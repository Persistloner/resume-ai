/**
 * DeepSeek AI Client
 *
 * Unified wrapper for DeepSeek Chat API (OpenAI-compatible).
 * Handles: prompt building, timeout, retry, structured logging, error normalization.
 */

import { buildOptimizeExperiencePrompt, buildOptimizeSkillPrompt } from "@/lib/prompts/optimize-resume"
import { buildPositioningPrompt, type PositioningInput } from "@/lib/prompts/career-positioning"

// ─── Configuration ──────────────────────────────────────────────

const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"
const DEFAULT_MODEL = "deepseek-chat"
const DEFAULT_TEMPERATURE = 0.2
const DEFAULT_MAX_TOKENS = 512
const POSITIONING_MAX_TOKENS = 1536
const REQUEST_TIMEOUT_MS = 30_000
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

// ─── Types ──────────────────────────────────────────────────────

export interface OptimizationInput {
  company: string
  role: string
  description: string
  targetJD?: string
}

export interface SkillOptimizationInput {
  title: string
  description: string
  targetJD?: string
}

export interface OptimizationDebugInfo {
  systemPrompt: string
  userPrompt: string
  targetJD: string
  modelResponse: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AbilityCard {
  title: string
  realExperience: string
  abilityExtraction: string
  jdMigration: string
}

export interface OptimizationResult {
  success: boolean
  optimizedText?: string
  abilityCards?: AbilityCard[]
  error?: string
  jdMode?: boolean
  debug?: OptimizationDebugInfo
  transferableSkills?: string[]
  rolePersona?: string
  coreInsight?: string
  sceneMapping?: string
  skillType?: string
}

interface DeepSeekMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface DeepSeekResponse {
  id: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function getApiKey(): string | null {
  return process.env.DEEPSEEK_API_KEY || null
}

function logRequest(
  phase: "start" | "success" | "retry" | "error" | "timeout" | "parse_warning" | "parse_success",
  details: Record<string, unknown> = {}
) {
  const entry = {
    ts: new Date().toISOString(),
    provider: "deepseek",
    phase,
    ...details,
  }
  console.log(`[AI:DeepSeek] ${JSON.stringify(entry)}`)
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Core API Call ──────────────────────────────────────────────

async function callDeepSeek(
  messages: DeepSeekMessage[],
  signal: AbortSignal
): Promise<DeepSeekResponse> {
  const apiKey = getApiKey()

  const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: DEFAULT_MAX_TOKENS,
    }),
    signal,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg =
      (body as { error?: { message?: string } })?.error?.message ||
      `DeepSeek API 返回 ${res.status}`
    throw new Error(msg)
  }

  return (await res.json()) as DeepSeekResponse
}

function extractText(response: DeepSeekResponse): string {
  const text = response.choices?.[0]?.message?.content?.trim() || ""
  console.log("=== AI RAW RESPONSE ===")
  console.log(JSON.stringify(text))
  return text
}

// ─── Structured Text Parsing ──────────────────────────────────

/**
 * Parse AI output into positionedText + optional abilityCards.
 *
 * PRIMARY PATH (v3 — Implicit Capability Fusion):
 *   The AI outputs a single natural paragraph with no markers.
 *   → Return raw text as positionedText, no abilityCards.
 *
 * FALLBACK PATH (v2 — 【标题】...可迁移至：...):
 *   For backward compatibility with cached results.
 *
 * FALLBACK PATH (v1 — JSON):
 *   For backward compatibility with very old cached results.
 */
function parsePositionedOutput(rawText: string): {
  positionedText: string
  abilityCards: AbilityCard[]
} {
  let text = rawText.trim()

  // Strip markdown code blocks if present
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim()
  }

  // PRIMARY: No 【 markers → new v3 flat format → return as-is
  if (!text.includes("【")) {
    return { positionedText: text, abilityCards: [] }
  }

  // FALLBACK: Has 【 markers → try old structured format
  const sections = text.split(/【/)
  const cards: AbilityCard[] = []

  for (let i = 1; i < sections.length; i++) {
    const section = sections[i].trim()
    if (!section) continue

    const titleEnd = section.indexOf("】")
    if (titleEnd === -1) continue

    const title = section.slice(0, titleEnd).trim()
    const body = section.slice(titleEnd + 1).trim()

    if (!title) continue

    const migrationIdx = body.indexOf("可迁移至：")

    let realExperience = body
    let abilityExtraction = ""
    let jdMigration = ""

    if (migrationIdx !== -1) {
      realExperience = body.slice(0, migrationIdx).trim()
      jdMigration = body.slice(migrationIdx + "可迁移至：".length).trim()
    }

    const paragraphs = realExperience.split(/\n\n+/)
    if (paragraphs.length >= 2) {
      realExperience = paragraphs[0].trim()
      abilityExtraction = paragraphs.slice(1).join("\n\n").trim()
    }

    if (realExperience || title) {
      cards.push({
        title: title.slice(0, 24),
        realExperience: realExperience || body.slice(0, 120),
        abilityExtraction,
        jdMigration,
      })
    }
  }

  if (cards.length > 0) {
    return { positionedText: text, abilityCards: cards }
  }

  // Has 【 but couldn't parse → treat as flat text
  return { positionedText: text, abilityCards: [] }
}

/**
 * Try to parse as JSON (backward compat). Returns null if not JSON.
 */
function tryParseLegacyJson(rawText: string): {
  positionedText: string
  abilityCards: AbilityCard[]
  transferableSkills: string[]
  rolePersona: string
  coreInsight: string
  sceneMapping: string
  skillType: string
} | null {
  let text = rawText.trim()

  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim()
  }

  const firstBrace = text.indexOf("{")
  const lastBrace = text.lastIndexOf("}")
  if (firstBrace === -1 || lastBrace <= firstBrace) return null

  text = text.slice(firstBrace, lastBrace + 1)

  try {
    const parsed = JSON.parse(text)
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null

    let abilityCards: AbilityCard[] = []
    if (Array.isArray(parsed.abilityCards)) {
      abilityCards = parsed.abilityCards.map((card: Record<string, unknown>) => ({
        title: String(card.title ?? ""),
        realExperience: String(card.realExperience ?? card.abilityDescription ?? ""),
        abilityExtraction: String(card.abilityExtraction ?? ""),
        jdMigration: String(card.jdMigration ?? card.jobMapping ?? ""),
      }))
    }

    const positionedText =
      String(parsed.positionedText ?? parsed.text ?? "") ||
      abilityCards
        .map(
          (c) =>
            `## ${c.title}\n\n${c.realExperience}\n\n${c.abilityExtraction}\n\n${c.jdMigration}`
        )
        .join("\n\n") ||
      rawText

    return {
      positionedText,
      abilityCards,
      transferableSkills: Array.isArray(parsed.transferableSkills)
        ? parsed.transferableSkills.map(String)
        : [],
      rolePersona: String(parsed.rolePersona ?? ""),
      coreInsight: String(parsed.coreInsight ?? ""),
      sceneMapping: String(parsed.sceneMapping ?? ""),
      skillType: String(parsed.skillType ?? ""),
    }
  } catch {
    return null
  }
}

function parsePositioningResponse(rawText: string): {
  positionedText: string
  abilityCards: AbilityCard[]
  transferableSkills: string[]
  rolePersona: string
  coreInsight: string
  sceneMapping: string
  skillType: string
} {
  // PRIMARY PATH: Try the new v3 flat format first (no 【 markers = single paragraph)
  // FALLBACK: Try old structured text (【标题】...可迁移至：...)
  // FALLBACK: Try legacy JSON
  const parsed = parsePositionedOutput(rawText)

  if (parsed.abilityCards.length > 0) {
    logRequest("parse_success", {
      method: "structured_text_legacy",
      cardsCount: parsed.abilityCards.length,
      charsOut: parsed.positionedText.length,
    })
    return {
      positionedText: parsed.positionedText,
      abilityCards: parsed.abilityCards,
      transferableSkills: [],
      rolePersona: "",
      coreInsight: "",
      sceneMapping: "",
      skillType: "",
    }
  }

  // Try legacy JSON (very old backward compat)
  const legacy = tryParseLegacyJson(rawText)
  if (legacy) {
    logRequest("parse_success", {
      method: "legacy_json",
      cardsCount: legacy.abilityCards.length,
    })
    return legacy
  }

  // v3 flat format: clean paragraph text, no cards
  logRequest("parse_success", {
    method: "flat_text_v3",
    charsOut: parsed.positionedText.length,
  })

  return {
    positionedText: parsed.positionedText,
    abilityCards: [],
    transferableSkills: [],
    rolePersona: "",
    coreInsight: "",
    sceneMapping: "",
    skillType: "",
  }
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Career Positioning v3 — Implicit Capability Fusion.
 *
 * Instead of the old "explicit job matching" approach (structured cards
 * with 【标题】 and 可迁移至), the AI now outputs a single natural paragraph
 * that implicitly demonstrates target-role capabilities through deep
 * analysis of the user's real work process.
 */
export async function generatePositioning(
  input: PositioningInput
): Promise<OptimizationResult> {
  const apiKey = getApiKey()

  if (!apiKey) {
    logRequest("error", { reason: "missing_api_key" })
    return {
      success: false,
      error: "未配置 DEEPSEEK_API_KEY，请在 .env.local 中设置后重启服务。",
    }
  }

  if (!input.description || !input.description.trim()) {
    return {
      success: false,
      error: "请提供需要定位的内容描述。",
    }
  }

  const { system, user } = buildPositioningPrompt(input)

  const messages: DeepSeekMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ]

  const jdMode = !!(input.targetJD && input.targetJD.trim().length > 0)

  logRequest("start", {
    type: input.type,
    company: input.company,
    role: input.role,
    title: input.title,
    descLen: input.description.length,
    jdMode,
  })

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await callDeepSeek(messages, controller.signal)
      clearTimeout(timeoutId)

      const rawText = extractText(response)

      if (!rawText) {
        throw new Error("AI 返回了空内容，请重试")
      }

      const parsed = parsePositioningResponse(rawText)

      logRequest("success", {
        type: input.type,
        attempt: attempt + 1,
        totalAttempts: attempt + 1,
        charsOut: parsed.positionedText.length,
        skillsCount: parsed.transferableSkills.length,
        hasRolePersona: !!parsed.rolePersona,
        hasCoreInsight: !!parsed.coreInsight,
        usage: response.usage,
      })

      const isDev = process.env.NODE_ENV === "development"

      return {
        success: true,
        optimizedText: parsed.positionedText,
        abilityCards: parsed.abilityCards,
        transferableSkills: parsed.transferableSkills,
        rolePersona: parsed.rolePersona,
        coreInsight: parsed.coreInsight,
        sceneMapping: parsed.sceneMapping,
        skillType: parsed.skillType,
        jdMode,
        ...(isDev && {
          debug: {
            systemPrompt: system,
            userPrompt: user,
            targetJD: input.targetJD || "(未填写)",
            modelResponse: rawText,
            usage: response.usage
              ? {
                  promptTokens: response.usage.prompt_tokens,
                  completionTokens: response.usage.completion_tokens,
                  totalTokens: response.usage.total_tokens,
                }
              : undefined,
          },
        }),
      }
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error instanceof Error ? error : new Error(String(error))

      const isTimeout = lastError.name === "AbortError"

      if (isTimeout) {
        logRequest("timeout", { type: input.type, attempt: attempt + 1 })
        lastError = new Error("AI 请求超时，请检查网络后重试")
      } else {
        logRequest(attempt < MAX_RETRIES ? "retry" : "error", {
          type: input.type,
          attempt: attempt + 1,
          error: lastError.message,
        })
      }

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * (attempt + 1))
        continue
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || "AI 分析失败，请重试",
  }
}

/** @deprecated Use generatePositioning instead. */
export async function generateResumeOptimization(
  input: OptimizationInput
): Promise<OptimizationResult> {
  const apiKey = getApiKey()

  if (!apiKey) {
    logRequest("error", { reason: "missing_api_key" })
    return {
      success: false,
      error: "未配置 DEEPSEEK_API_KEY，请在 .env.local 中设置后重启服务。",
    }
  }

  if (!input.description || !input.description.trim()) {
    return {
      success: false,
      error: "请提供需要优化的工作描述。",
    }
  }

  const { system, user } = buildOptimizeExperiencePrompt({
    company: input.company,
    role: input.role,
    description: input.description,
    targetJD: input.targetJD || "",
  })

  const messages: DeepSeekMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ]

  const jdMode = !!(input.targetJD && input.targetJD.trim().length > 0)

  logRequest("start", {
    company: input.company,
    role: input.role,
    descLen: input.description.length,
    jdMode,
  })

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await callDeepSeek(messages, controller.signal)
      clearTimeout(timeoutId)

      const optimizedText = extractText(response)

      if (!optimizedText) {
        throw new Error("AI 返回了空内容，请重试")
      }

      logRequest("success", {
        attempt: attempt + 1,
        totalAttempts: attempt + 1,
        charsOut: optimizedText.length,
        usage: response.usage,
      })

      const isDev = process.env.NODE_ENV === "development"

      return {
        success: true,
        optimizedText,
        jdMode,
        ...(isDev && {
          debug: {
            systemPrompt: system,
            userPrompt: user,
            targetJD: input.targetJD || "(未填写)",
            modelResponse: optimizedText,
            usage: response.usage
              ? {
                  promptTokens: response.usage.prompt_tokens,
                  completionTokens: response.usage.completion_tokens,
                  totalTokens: response.usage.total_tokens,
                }
              : undefined,
          },
        }),
      }
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error instanceof Error ? error : new Error(String(error))

      const isTimeout = lastError.name === "AbortError"

      if (isTimeout) {
        logRequest("timeout", { attempt: attempt + 1 })
        lastError = new Error("AI 请求超时，请检查网络后重试")
      } else {
        logRequest(attempt < MAX_RETRIES ? "retry" : "error", {
          attempt: attempt + 1,
          error: lastError.message,
        })
      }

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * (attempt + 1))
        continue
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || "AI 优化失败，请重试",
  }
}

/** @deprecated Use generatePositioning instead. */
export async function generateSkillOptimization(
  input: SkillOptimizationInput
): Promise<OptimizationResult> {
  const apiKey = getApiKey()

  if (!apiKey) {
    return {
      success: false,
      error: "未配置 DEEPSEEK_API_KEY，请在 .env.local 中设置后重启服务。",
    }
  }

  if (!input.description || !input.description.trim()) {
    return { success: false, error: "请提供需要优化的技能描述。" }
  }

  const { system, user } = buildOptimizeSkillPrompt({
    title: input.title,
    description: input.description,
    targetJD: input.targetJD || "",
  })

  const messages: DeepSeekMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ]

  const jdMode = !!(input.targetJD && input.targetJD.trim().length > 0)

  logRequest("start", {
    type: "skill",
    title: input.title,
    descLen: input.description.length,
    jdMode,
  })

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await callDeepSeek(messages, controller.signal)
      clearTimeout(timeoutId)

      const optimizedText = extractText(response)
      if (!optimizedText) throw new Error("AI 返回了空内容，请重试")

      logRequest("success", {
        type: "skill",
        attempt: attempt + 1,
        charsOut: optimizedText.length,
        usage: response.usage,
      })

      return { success: true, optimizedText, jdMode }
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error instanceof Error ? error : new Error(String(error))

      if (lastError.name === "AbortError") {
        logRequest("timeout", { type: "skill", attempt: attempt + 1 })
        lastError = new Error("AI 请求超时，请检查网络后重试")
      } else {
        logRequest(attempt < MAX_RETRIES ? "retry" : "error", {
          type: "skill",
          attempt: attempt + 1,
          error: lastError.message,
        })
      }

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * (attempt + 1))
        continue
      }
    }
  }

  return { success: false, error: lastError?.message || "AI 优化失败，请重试" }
}

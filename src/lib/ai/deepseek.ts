/**
 * DeepSeek AI Client
 *
 * Unified wrapper for DeepSeek Chat API (OpenAI-compatible).
 * Handles: prompt building, timeout, retry, structured logging, error normalization.
 */

import { buildOptimizeExperiencePrompt } from "@/lib/prompts/optimize-resume"

// ─── Configuration ──────────────────────────────────────────────

const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"
const DEFAULT_MODEL = "deepseek-chat"
const DEFAULT_TEMPERATURE = 0.2
const DEFAULT_MAX_TOKENS = 512
const REQUEST_TIMEOUT_MS = 30_000
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

// ─── Types ──────────────────────────────────────────────────────

export interface OptimizationInput {
  company: string
  position: string
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

export interface OptimizationResult {
  success: boolean
  optimizedText?: string
  error?: string
  jdMode?: boolean
  debug?: OptimizationDebugInfo
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
  phase: "start" | "success" | "retry" | "error" | "timeout",
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
  return text
}

// ─── Public API ─────────────────────────────────────────────────

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
    position: input.position,
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
    position: input.position,
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

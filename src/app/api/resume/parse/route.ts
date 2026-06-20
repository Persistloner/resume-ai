import { NextResponse } from "next/server"
import { v4 as uuid } from "uuid"
import {
  buildSegmentPrompt,
  buildSectionParsePrompt,
  SECTIONS,
  type SectionType,
  type SectionTexts,
} from "@/lib/ai/prompts/parse-resume"
import { normalizeResumeText, normalizeBullets } from "@/lib/normalize-resume-text"
import { createAICaller } from "@/lib/ai/ai-client"
import { createTaskContext, isQuotaError } from "@/lib/billing/quota"
import { getOrCreateSession } from "@/lib/auth/session"
import { checkRateLimit } from "@/lib/rate-limit"
import { TASK_TYPES } from "@/lib/constants"


const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const
const SECTION_PARSE_RETRIES = 1

export const maxDuration = 60

// ─── Logging ───────────────────────────────────────────────────────────

function log(phase: string, details: Record<string, unknown> = {}) {
  console.log(
    `[Parse] ${JSON.stringify({ ts: new Date().toISOString(), phase, ...details })}`
  )
}

// ─── JSON helpers ──────────────────────────────────────────────────────

function cleanJsonText(text: string): string {
  let cleaned = text.trim()
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "")
  }
  return cleaned.trim()
}

function safeJsonParse<T>(text: string, fallback: T, label: string): { data: T; warning?: string } {
  if (!text || !text.trim()) {
    return { data: fallback, warning: `${label}: 输入文本为空` }
  }
  try {
    const cleaned = cleanJsonText(text)
    const parsed = JSON.parse(cleaned)
    return { data: parsed as T }
  } catch (err) {
    const snippet = text.slice(0, 200)
    log("json-parse-error", { label, snippet, error: String(err) })
    return { data: fallback, warning: `${label}: AI 返回格式异常，已使用默认值` }
  }
}

// ─── Step 1: Segmentation ──────────────────────────────────────────────

const SECTION_HEADER_PATTERNS: Array<{ section: SectionType; re: RegExp }> = [
  {
    section: "education",
    re: /(?:##\s*)?教育(?:背景|经历)?|##\s*学历|Education|EDUCATION/i,
  },
  {
    section: "experience",
    re: /(?:##\s*)?(?:工作|实习)(?:经历|经验)?|##\s*(?:Experience|Work|Employment|Internship)/i,
  },
  {
    section: "projects",
    re: /(?:##\s*)?项目(?:经历|经验)?|##\s*(?:Projects?|Project\s*Experience)/i,
  },
  {
    section: "skills",
    re: /(?:##\s*)?(?:专业)?技能|##\s*(?:技术栈|证书|语言能力)|##\s*(?:Skills?|Technical|Certifications?|Languages?)/i,
  },
  {
    section: "personalInfo",
    re: /(?:##\s*)?(?:自我评价|个人(?:总结|介绍|信息)|求职意向|Summary|Objective|Profile|About\s*Me)/i,
  },
]

function segmentByRegex(rawText: string): SectionTexts {
  const result: SectionTexts = {
    personalInfo: "",
    experience: "",
    education: "",
    projects: "",
    skills: "",
  }

  // If text has ## markers, split on them
  if (rawText.includes("##")) {
    const blocks = rawText.split(/\n(?=##\s)/)
    let headerText = ""

    for (const block of blocks) {
      let matched = false
      for (const { section, re } of SECTION_HEADER_PATTERNS) {
        if (re.test(block)) {
          result[section] += (result[section] ? "\n" : "") + block
          matched = true
          break
        }
      }
      if (!matched) {
        // Blocks without a recognized header go to header/personalInfo
        headerText += (headerText ? "\n" : "") + block
      }
    }

    if (headerText.trim()) {
      result.personalInfo = headerText + (result.personalInfo ? "\n" + result.personalInfo : "")
    }
  } else {
    // No ## markers: try line-by-line section detection
    const lines = rawText.split("\n")
    let currentSection: SectionType | null = null
    const buckets: Record<SectionType, string[]> = {
      personalInfo: [],
      experience: [],
      education: [],
      projects: [],
      skills: [],
    }

    for (const line of lines) {
      let matched = false
      for (const { section, re } of SECTION_HEADER_PATTERNS) {
        if (re.test(line.trim())) {
          currentSection = section
          matched = true
          break
        }
      }
      if (!matched && currentSection) {
        buckets[currentSection].push(line)
      } else if (!matched && !currentSection) {
        buckets.personalInfo.push(line)
      }
    }

    for (const section of SECTIONS) {
      result[section] = buckets[section].join("\n").trim()
    }
  }

  // Fallback: if everything is empty, put all text into experience
  const totalChars = Object.values(result).reduce((sum, t) => sum + t.length, 0)
  if (totalChars < 20 && rawText.trim().length > 20) {
    result.experience = rawText
  }

  return result
}

async function segmentWithAI(
  ai: ReturnType<typeof createAICaller>,
  rawText: string,
  taskId: string
): Promise<SectionTexts> {
  const { system, user } = buildSegmentPrompt(rawText)
  log("segment-ai-start", { taskId, textLen: rawText.length })

  const result = await ai.call({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.1,
    maxTokens: 2048,
  })

  log("segment-ai-done", {
    taskId,
    tokens: result.usage.totalTokens,
    respLen: result.content.length,
  })

  const { data, warning } = safeJsonParse<SectionTexts>(result.content, {} as SectionTexts, "segment")
  if (warning) {
    log("segment-parse-warning", { taskId, warning })
    throw new Error(warning)
  }

  // Coerce: ensure all section fields are strings
  const sections: SectionTexts = {
    personalInfo: String(data.personalInfo ?? ""),
    experience: String(data.experience ?? ""),
    education: String(data.education ?? ""),
    projects: String(data.projects ?? ""),
    skills: String(data.skills ?? ""),
  }

  return sections
}

async function segmentResumeText(
  ai: ReturnType<typeof createAICaller>,
  rawText: string,
  taskId: string
): Promise<SectionTexts> {
  // Try AI segmentation first
  try {
    return await segmentWithAI(ai, rawText, taskId)
  } catch (err) {
    log("segment-ai-failed", { taskId, error: String(err) })
  }

  // Fallback: regex-based segmentation
  log("segment-regex-fallback", { taskId })
  const sections = segmentByRegex(rawText)
  log("segment-regex-result", {
    taskId,
    personalInfoLen: sections.personalInfo.length,
    experienceLen: sections.experience.length,
    educationLen: sections.education.length,
    projectsLen: sections.projects.length,
    skillsLen: sections.skills.length,
  })
  return sections
}

// ─── Step 2: Per-Section Parsing ───────────────────────────────────────

async function parseSectionWithAI<T>(
  ai: ReturnType<typeof createAICaller>,
  sectionType: SectionType,
  sectionText: string,
  taskId: string
): Promise<T> {
  const { system, user } = buildSectionParsePrompt(sectionType, sectionText)
  log(`parse-${sectionType}-start`, { taskId, textLen: sectionText.length })

  // Smaller sections don't need as many output tokens
  const maxTokensMap: Record<SectionType, number> = {
    personalInfo: 512,
    experience: 1536,
    education: 512,
    projects: 1024,
    skills: 1024,
  }

  const result = await ai.call({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.1,
    maxTokens: maxTokensMap[sectionType],
  })

  log(`parse-${sectionType}-done`, {
    taskId,
    tokens: result.usage.totalTokens,
    respLen: result.content.length,
  })

  const { data, warning } = safeJsonParse<T>(result.content, [] as unknown as T, sectionType)
  if (warning) {
    throw new Error(warning)
  }

  return data
}

/**
 * Parse a single section with retry + fallback.
 * Never throws — returns data or fallback with an optional warning.
 */
async function parseSection<T>(
  ai: ReturnType<typeof createAICaller>,
  sectionType: SectionType,
  sectionText: string,
  taskId: string,
  fallback: T
): Promise<{ data: T; warning?: string }> {
  if (!sectionText || sectionText.trim().length < 3) {
    return { data: fallback, warning: `${sectionType}: 输入文本不足，跳过解析` }
  }

  let lastError: string | null = null

  for (let attempt = 0; attempt <= SECTION_PARSE_RETRIES; attempt++) {
    try {
      const data = await parseSectionWithAI<T>(ai, sectionType, sectionText, taskId)
      return { data }
    } catch (err) {
      lastError = String(err)
      log(`parse-${sectionType}-retry`, {
        taskId,
        attempt: attempt + 1,
        error: lastError,
      })
    }
  }

  log(`parse-${sectionType}-all-failed`, { taskId, error: lastError })
  return {
    data: fallback,
    warning: `${sectionType}: ${SECTION_PARSE_RETRIES + 1} 次尝试均失败，已使用默认值`,
  }
}

// ─── Step 3: Merge ─────────────────────────────────────────────────────

interface ParsedPersonalInfo {
  fullName?: string
  email?: string
  phone?: string
  location?: string
  title?: string
  summary?: string
}

interface ParsedExperience {
  company?: string
  role?: string
  startDate?: string
  endDate?: string
  current?: boolean
  description?: string
}

interface ParsedEducation {
  school?: string
  degree?: string
  field?: string
  startDate?: string
  endDate?: string
}

interface ParsedProject {
  name?: string
  role?: string
  duration?: string
  description?: string
}

interface ParsedSkill {
  title?: string
  description?: string
}

// ─── Route Handler ─────────────────────────────────────────────────────

export async function POST(request: Request) {
  const warnings: string[] = []
  let extractedText = ""
  let ctx: Awaited<ReturnType<typeof createTaskContext>> | null = null

  try {
    // ── Session ──────────────────────────────────────────────────────
    const userId = await getOrCreateSession()

    const preRateCheck = checkRateLimit(userId, "system")
    if (!preRateCheck.allowed) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后重试" },
        { status: 429 }
      )
    }

    // ── File Parsing ─────────────────────────────────────────────────
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { error: "请求格式错误，请上传文件" },
        { status: 400 }
      )
    }

    const file = formData.get("file") as File | null
    const directText = formData.get("text") as string | null

    if (!file && !directText) {
      return NextResponse.json(
        { error: "请选择要上传的简历文件" },
        { status: 400 }
      )
    }

    if (directText) {
      extractedText = directText
      log("direct-text", { chars: extractedText.length })
    } else {
      if (!ALLOWED_TYPES.includes(file!.type as (typeof ALLOWED_TYPES)[number])) {
        return NextResponse.json(
          { error: "仅支持 DOCX 和 TXT 格式文件" },
          { status: 400 }
        )
      }
      if (file!.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "文件大小不能超过 10MB" },
          { status: 400 }
        )
      }

      log("file-received", {
        name: file!.name,
        type: file!.type,
        sizeKB: Math.round(file!.size / 1024),
      })

      const buffer = Buffer.from(await file!.arrayBuffer())
      try {
        if (file!.type === "text/plain") {
          extractedText = buffer.toString("utf-8")
        } else {
          const mammoth = await import("mammoth")
          const result = await mammoth.extractRawText({ buffer })
          extractedText = result.value
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        log("extract-error", { error: message })
        return NextResponse.json(
          { error: `文件解析失败：${message.slice(0, 200)}` },
          { status: 422 }
        )
      }
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json(
        { error: "未能从文件中提取到足够的文本内容，请确认文件包含可读取的文本。" },
        { status: 422 }
      )
    }

    const normalizedText = normalizeResumeText(extractedText)
    log("text-normalized", {
      before: extractedText.length,
      after: normalizedText.length,
    })

    // ── Billing ──────────────────────────────────────────────────────
    let taskId: string
    let ai: ReturnType<typeof createAICaller>

    try {
      ctx = await createTaskContext(userId, TASK_TYPES.RESUME_PARSE)
      taskId = ctx.taskId
      ai = createAICaller(ctx)
    } catch (err) {
      if (isQuotaError(err)) {
        return NextResponse.json(err, { status: 402 })
      }
      // DB or other infra error — fall back to direct system key
      log("billing-fallback", { error: String(err) })
      const systemKey = process.env.DEEPSEEK_API_KEY
      if (systemKey) {
        const { getProviderBaseUrl } = await import("@/lib/ai/providers")
        taskId = uuid()
        ai = createAICaller({
          taskId,
          userId,
          mode: "dev",
          provider: "deepseek",
          apiKey: systemKey,
          baseUrl: getProviderBaseUrl("deepseek"),
        })
        warnings.push("计费系统异常，已使用备用模式")
      } else {
        throw err
      }
    }

    log("parse-start", { taskId, mode: ctx?.mode ?? "recovery", textLen: normalizedText.length })

    // ═══════════════════════════════════════════════════════════════════
    // STEP 1: Segment resume text into sections
    // ═══════════════════════════════════════════════════════════════════
    const sections = await segmentResumeText(ai, normalizedText, taskId)

    // ═══════════════════════════════════════════════════════════════════
    // STEP 2: Parse each section independently (parallel)
    // ═══════════════════════════════════════════════════════════════════
    const [
      personalInfoResult,
      experienceResult,
      educationResult,
      projectsResult,
      skillsResult,
    ] = await Promise.allSettled([
      parseSection<ParsedPersonalInfo>(
        ai, "personalInfo", sections.personalInfo, taskId,
        { fullName: "", email: "", phone: "", location: "", title: "", summary: "" }
      ),
      parseSection<ParsedExperience[]>(
        ai, "experience", sections.experience, taskId, []
      ),
      parseSection<ParsedEducation[]>(
        ai, "education", sections.education, taskId, []
      ),
      parseSection<ParsedProject[]>(
        ai, "projects", sections.projects, taskId, []
      ),
      parseSection<ParsedSkill[]>(
        ai, "skills", sections.skills, taskId, []
      ),
    ])

    // Extract results from Promise.allSettled, collecting warnings
    const getResult = <T>(settled: PromiseSettledResult<{ data: T; warning?: string }>, fallback: T): T => {
      if (settled.status === "fulfilled") {
        if (settled.value.warning) warnings.push(settled.value.warning)
        return settled.value.data
      }
      warnings.push(`内部错误: ${String(settled.reason)}`)
      return fallback
    }

    const parsedPI = getResult(personalInfoResult, { fullName: "", email: "", phone: "", location: "", title: "", summary: "" })
    const parsedExp = getResult(experienceResult, [] as ParsedExperience[])
    const parsedEdu = getResult(educationResult, [] as ParsedEducation[])
    const parsedProj = getResult(projectsResult, [] as ParsedProject[])
    const parsedSkills = getResult(skillsResult, [] as ParsedSkill[])

    // ═══════════════════════════════════════════════════════════════════
    // STEP 3: Merge results
    // ═══════════════════════════════════════════════════════════════════
    const result = {
      personalInfo: {
        fullName: String(parsedPI.fullName ?? ""),
        email: String(parsedPI.email ?? ""),
        phone: String(parsedPI.phone ?? ""),
        location: String(parsedPI.location ?? ""),
        title: String(parsedPI.title ?? ""),
        summary: normalizeBullets(String(parsedPI.summary ?? "")),
      },
      education: (Array.isArray(parsedEdu) ? parsedEdu : []).map((e) => ({
        id: uuid(),
        school: String(e.school ?? ""),
        degree: String(e.degree ?? ""),
        field: String(e.field ?? ""),
        startDate: String(e.startDate ?? ""),
        endDate: String(e.endDate ?? ""),
      })),
      workExperience: (Array.isArray(parsedExp) ? parsedExp : []).map((e) => ({
        id: uuid(),
        company: String(e.company ?? ""),
        role: String(e.role ?? ""),
        startDate: String(e.startDate ?? ""),
        endDate: String(e.endDate ?? ""),
        current: Boolean(e.current ?? false),
        description: normalizeBullets(String(e.description ?? "")),
        optimizedDescription: "",
      })),
      projectExperience: (Array.isArray(parsedProj) ? parsedProj : []).map((p) => ({
        id: uuid(),
        name: String(p.name ?? ""),
        role: String(p.role ?? ""),
        duration: String(p.duration ?? ""),
        description: normalizeBullets(String(p.description ?? "")),
        optimizedDescription: "",
      })),
      skills: (Array.isArray(parsedSkills) ? parsedSkills : []).map((s) => ({
        id: uuid(),
        title: String(s.title ?? ""),
        description: normalizeBullets(String(s.description ?? "")),
        optimizedDescription: "",
        abilityCards: [] as any[],
      })),
    }

    // Add raw text to empty sections as fallback hints
    if (result.workExperience.length === 0 && sections.experience.length > 10) {
      result.workExperience.push({
        id: uuid(),
        company: "",
        role: "",
        startDate: "",
        endDate: "",
        current: false,
        description: normalizeBullets(sections.experience),
        optimizedDescription: "",
      })
      warnings.push("experience: AI 解析为空，已保留原始文本供手动编辑")
    }
    if (result.education.length === 0 && sections.education.length > 10) {
      result.education.push({
        id: uuid(),
        school: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
      })
      warnings.push("education: AI 解析为空，请手动填写")
    }
    if (result.projectExperience.length === 0 && sections.projects.length > 10) {
      result.projectExperience.push({
        id: uuid(),
        name: "",
        role: "",
        duration: "",
        description: normalizeBullets(sections.projects),
        optimizedDescription: "",
      })
      warnings.push("projects: AI 解析为空，已保留原始文本供手动编辑")
    }
    if (result.skills.length === 0 && sections.skills.length > 10) {
      result.skills.push({
        id: uuid(),
        title: "",
        description: normalizeBullets(sections.skills),
        optimizedDescription: "",
        abilityCards: [],
      })
      warnings.push("skills: AI 解析为空，已保留原始文本供手动编辑")
    }

    log("parse-complete", {
      taskId,
      workCount: result.workExperience.length,
      projCount: result.projectExperience.length,
      eduCount: result.education.length,
      skillCount: result.skills.length,
      warningCount: warnings.length,
      warnings: warnings.join("; "),
    })

    return NextResponse.json({
      success: true,
      data: result,
      mode: ctx?.mode ?? "recovery",
      ...(warnings.length > 0 ? { warnings } : {}),
    })
  } catch (error: unknown) {
    const err = error as Error
    const isTimeout =
      err?.name === "AbortError" || err?.message?.includes("超时")
    log("parse-fatal", { error: String(error), timeout: isTimeout })

    // Return raw text on total failure so user can work with it
    return NextResponse.json(
      {
        success: false,
        error: isTimeout
          ? "AI 解析请求超时，请重试"
          : "AI 解析失败，请重试",
        ...(extractedText ? { rawText: extractedText } : {}),
      },
      { status: isTimeout ? 504 : 500 }
    )
  }
}

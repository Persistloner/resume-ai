import { NextResponse } from "next/server"
import { buildParseResumePrompt } from "@/lib/ai/prompts/parse-resume"

// ─── Config ─────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"
const TEMPERATURE = 0.1
const MAX_TOKENS = 2048

// ─── Helpers ────────────────────────────────────────────────────

function log(phase: string, details: Record<string, unknown> = {}) {
  console.log(
    `[Parse] ${JSON.stringify({ ts: new Date().toISOString(), phase, ...details })}`
  )
}

function cleanJsonText(text: string): string {
  // Strip markdown code fences if present
  let cleaned = text.trim()
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "")
  }
  return cleaned.trim()
}

// ─── POST Handler ───────────────────────────────────────────────

export async function POST(request: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "未配置 DEEPSEEK_API_KEY" },
      { status: 500 }
    )
  }

  // 1. Parse FormData
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
  if (!file) {
    return NextResponse.json(
      { error: "请选择要上传的简历文件" },
      { status: 400 }
    )
  }

  // 2. Validate file type
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return NextResponse.json(
      { error: "仅支持 PDF 和 DOCX 格式文件" },
      { status: 400 }
    )
  }

  // 3. Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "文件大小不能超过 10MB" },
      { status: 400 }
    )
  }

  log("file-received", {
    name: file.name,
    type: file.type,
    sizeKB: Math.round(file.size / 1024),
  })

  // 4. Extract text from file
  let extractedText = ""
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    if (file.type === "application/pdf") {
      const { PDFParse } = await import("pdf-parse")
      const parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      extractedText = result.text
      await parser.destroy()
    } else {
      const mammoth = await import("mammoth")
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    }
  } catch (error) {
    log("extract-error", { error: String(error) })
    return NextResponse.json(
      { error: "文件解析失败，请确认文件未损坏且包含可提取的文本内容" },
      { status: 422 }
    )
  }

  if (!extractedText || extractedText.trim().length < 10) {
    return NextResponse.json(
      { error: "未能从文件中提取到足够的文本内容，请确认简历不是扫描图片" },
      { status: 422 }
    )
  }

  log("text-extracted", {
    chars: extractedText.length,
    preview: extractedText.slice(0, 100),
  })

  // 5. Call DeepSeek to structure the text
  const { system, user } = buildParseResumePrompt(extractedText)

  log("ai-request-start")

  try {
    const res = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    })

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      throw new Error(
        (errBody as { error?: { message?: string } })?.error?.message ||
          `DeepSeek API 返回 ${res.status}`
      )
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
    }

    const rawContent = data.choices?.[0]?.message?.content || ""
    const jsonText = cleanJsonText(rawContent)

    log("ai-response", {
      rawLen: rawContent.length,
      usage: data.usage,
    })

    // 6. Parse the structured JSON
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: Record<string, any>
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      log("json-parse-error", { jsonText: jsonText.slice(0, 200) })
      return NextResponse.json(
        { error: "AI 返回格式异常，请重试" },
        { status: 500 }
      )
    }

    // 7. Validate and normalize the result
    const result = {
      personalInfo: {
        fullName: String(parsed.personalInfo?.fullName ?? ""),
        email: String(parsed.personalInfo?.email ?? ""),
        phone: String(parsed.personalInfo?.phone ?? ""),
        location: String(parsed.personalInfo?.location ?? ""),
        title: String(parsed.personalInfo?.title ?? ""),
        summary: String(parsed.personalInfo?.summary ?? ""),
      },
      education: Array.isArray(parsed.education)
        ? parsed.education.map((e: Record<string, any>) => ({
            school: String(e.school ?? ""),
            degree: String(e.degree ?? ""),
            field: String(e.field ?? ""),
            startDate: String(e.startDate ?? ""),
            endDate: String(e.endDate ?? ""),
          }))
        : [],
      experience: Array.isArray(parsed.experience)
        ? parsed.experience.map((e: Record<string, any>) => ({
            company: String(e.company ?? ""),
            position: String(e.position ?? ""),
            startDate: String(e.startDate ?? ""),
            endDate: String(e.endDate ?? ""),
            current: Boolean(e.current ?? false),
            description: String(e.description ?? ""),
          }))
        : [],
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.map((s: Record<string, any>) => ({
            name: String(s.name ?? ""),
          }))
        : [],
    }

    log("success", {
      expCount: result.experience.length,
      eduCount: result.education.length,
      skillCount: result.skills.length,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    log("ai-error", { error: String(error) })
    return NextResponse.json(
      { error: "AI 解析失败，请重试" },
      { status: 500 }
    )
  }
}

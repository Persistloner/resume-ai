import { NextResponse } from "next/server"
import { buildAnalyzeJDPrompt } from "@/lib/ai/prompts/analyze-jd"

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"
const TEMPERATURE = 0.1
const MAX_TOKENS = 1024

function log(phase: string, details: Record<string, unknown> = {}) {
  console.log(
    `[ATS] ${JSON.stringify({ ts: new Date().toISOString(), phase, ...details })}`
  )
}

function cleanJsonText(text: string): string {
  let cleaned = text.trim()
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "")
  }
  return cleaned.trim()
}

export async function POST(request: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "未配置 DEEPSEEK_API_KEY" },
      { status: 500 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const { targetJD, resumeSummary } = body as {
    targetJD?: string
    resumeSummary?: string
  }

  if (!targetJD || !targetJD.trim()) {
    return NextResponse.json(
      { error: "请先填写目标岗位 JD" },
      { status: 400 }
    )
  }

  if (!resumeSummary || !resumeSummary.trim()) {
    return NextResponse.json(
      { error: "请先完善简历内容" },
      { status: 400 }
    )
  }

  const { system, user } = buildAnalyzeJDPrompt({ targetJD, resumeSummary })

  log("request-start", {
    jdLen: targetJD.length,
    resumeLen: resumeSummary.length,
  })

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

    log("response", {
      rawLen: rawContent.length,
      usage: data.usage,
    })

    let parsed: Record<string, any>
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      log("parse-error", { preview: jsonText.slice(0, 200) })
      return NextResponse.json(
        { error: "AI 返回格式异常，请重试" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      atsScore: Math.min(100, Math.max(0, Number(parsed.atsScore) || 0)),
      jdKeywords: Array.isArray(parsed.jdKeywords) ? parsed.jdKeywords : [],
      roleType: String(parsed.roleType ?? ""),
      coreRequirements: Array.isArray(parsed.coreRequirements)
        ? parsed.coreRequirements
        : [],
      matchedSkills: Array.isArray(parsed.matchedSkills)
        ? parsed.matchedSkills
        : [],
      missingSkills: Array.isArray(parsed.missingSkills)
        ? parsed.missingSkills
        : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    })
  } catch (error) {
    log("error", { error: String(error) })
    return NextResponse.json(
      { error: "ATS 分析失败，请重试" },
      { status: 500 }
    )
  }
}

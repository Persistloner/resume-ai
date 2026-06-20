import { NextResponse } from "next/server"
import { buildAnalyzeJDPrompt } from "@/lib/ai/prompts/analyze-jd"
import { createAICaller } from "@/lib/ai/ai-client"
import { resolveAIConfig } from "@/lib/ai/config"
import { getOrCreateSession } from "@/lib/auth/session"
import { checkRateLimit } from "@/lib/rate-limit"

export const maxDuration = 30

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
  try {
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

    const userId = await getOrCreateSession()
    const rateCheck = checkRateLimit(userId, "system")
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后重试" },
        { status: 429 }
      )
    }

    const config = resolveAIConfig(request.headers)
    if (!config) {
      return NextResponse.json(
        { error: "未配置 AI API Key，请在设置中配置你的 API Key" },
        { status: 402 }
      )
    }

    const ai = createAICaller(config)
    const { system, user } = buildAnalyzeJDPrompt({ targetJD, resumeSummary })

    log("start", { jdLen: targetJD.length, resumeLen: resumeSummary.length })

    const result = await ai.call({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.1,
      maxTokens: 1024,
    })

    const jsonText = cleanJsonText(result.content)

    log("response", {
      rawLen: result.content.length,
      tokensUsed: result.usage.totalTokens,
    })

    let parsed: Record<string, any>
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return NextResponse.json(
        { error: "AI 返回格式异常，请重试" },
        { status: 502 }
      )
    }

    return NextResponse.json({
      atsScore: Number(parsed.atsScore ?? parsed.ats_score ?? 0),
      jdKeywords: Array.isArray(parsed.jdKeywords ?? parsed.jd_keywords)
        ? (parsed.jdKeywords ?? parsed.jd_keywords)
        : [],
      roleType: String(parsed.roleType ?? parsed.role_type ?? ""),
      coreRequirements: Array.isArray(parsed.coreRequirements ?? parsed.core_requirements)
        ? (parsed.coreRequirements ?? parsed.core_requirements)
        : [],
      matchedSkills: Array.isArray(parsed.matchedSkills ?? parsed.matched_skills)
        ? (parsed.matchedSkills ?? parsed.matched_skills)
        : [],
      missingSkills: Array.isArray(parsed.missingSkills ?? parsed.missing_skills)
        ? (parsed.missingSkills ?? parsed.missing_skills)
        : [],
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions
        : [],
    })
  } catch (error) {
    const err = error as Error
    log("error", { message: err.message })
    return NextResponse.json(
      { error: err.message || "AI 分析失败，请重试" },
      { status: 500 }
    )
  }
}

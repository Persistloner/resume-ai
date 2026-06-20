import { NextResponse } from "next/server"
import { buildPositioningPrompt, type PositioningInput } from "@/lib/prompts/career-positioning"
import { parsePositioningResponse } from "@/lib/ai/parse-response"
import { createAICaller } from "@/lib/ai/ai-client"
import { resolveAIConfig } from "@/lib/ai/config"
import { checkRateLimit } from "@/lib/rate-limit"
import { getOrCreateSession } from "@/lib/auth/session"

export const maxDuration = 30

function log(phase: string, details: Record<string, unknown> = {}) {
  console.log(
    `[Optimize] ${JSON.stringify({ ts: new Date().toISOString(), phase, ...details })}`
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { type, company, role, position, description, targetJD, title } = body

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: "请提供需要优化的内容描述" },
        { status: 400 }
      )
    }

    // Rate limit
    const userId = await getOrCreateSession()
    const rateCheck = checkRateLimit(userId, "system")
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后重试" },
        { status: 429 }
      )
    }

    // Resolve AI config (user headers → env fallback)
    const config = resolveAIConfig(request.headers)
    if (!config) {
      return NextResponse.json(
        { error: "未配置 AI API Key，请在设置中配置你的 API Key" },
        { status: 402 }
      )
    }

    const ai = createAICaller(config)

    const positioningType: PositioningInput["type"] =
      type === "skill" ? "skill" : type === "project" ? "project" : "experience"

    const input: PositioningInput = {
      type: positioningType,
      company: company || "",
      role: role || position || "",
      title: title || "",
      description: description || "",
      targetJD: targetJD || "",
    }

    const { system, user } = buildPositioningPrompt(input)
    const jdMode = !!(targetJD && targetJD.trim().length > 0)

    log("start", { type: input.type, jdMode })

    const result = await ai.call({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      maxTokens: 1536,
    })

    if (!result.content) {
      return NextResponse.json(
        { error: "AI 返回了空内容，请重试" },
        { status: 502 }
      )
    }

    const parsed = parsePositioningResponse(result.content)

    log("success", {
      charsOut: parsed.positionedText.length,
      tokensUsed: result.usage.totalTokens,
    })

    const isDev = process.env.NODE_ENV === "development"

    return NextResponse.json({
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
          targetJD: targetJD || "(未填写)",
          modelResponse: result.content,
          input,
          parsed,
        },
      }),
    })
  } catch (error) {
    const err = error as Error
    log("error", { message: err.message })
    return NextResponse.json(
      { error: err.message || "AI 优化失败，请重试" },
      { status: 500 }
    )
  }
}

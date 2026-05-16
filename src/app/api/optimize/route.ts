import { NextResponse } from "next/server"
import { generatePositioning } from "@/lib/ai/deepseek"
import type { PositioningInput } from "@/lib/prompts/career-positioning"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { type, company, role, position, description, targetJD, title } = body as {
    type?: string
    company?: string
    role?: string
    position?: string
    description?: string
    targetJD?: string
    title?: string
  }

  const positioningType: PositioningInput["type"] =
    type === "skill" ? "skill" : type === "project" ? "project" : "experience"

  const result = await generatePositioning({
    type: positioningType,
    company: company || "",
    role: role || position || "",
    title: title || "",
    description: description || "",
    targetJD: targetJD || "",
  })

  if (!result.success) {
    const status = result.error?.includes("未配置") ? 500 : 400
    return NextResponse.json({ error: result.error }, { status })
  }

  const responseBody: Record<string, unknown> = {
    optimizedText: result.optimizedText,
    abilityCards: result.abilityCards,
    transferableSkills: result.transferableSkills,
    rolePersona: result.rolePersona,
    coreInsight: result.coreInsight,
    sceneMapping: result.sceneMapping,
    skillType: result.skillType,
    jdMode: result.jdMode ?? false,
  }

  if (result.debug) {
    responseBody.debug = result.debug
  }

  return NextResponse.json(responseBody)
}

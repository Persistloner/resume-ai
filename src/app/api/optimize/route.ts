import { NextResponse } from "next/server"
import { generateResumeOptimization } from "@/lib/ai/deepseek"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { company, position, description, targetJD } = body as {
    company?: string
    position?: string
    description?: string
    targetJD?: string
  }

  const result = await generateResumeOptimization({
    company: company || "",
    position: position || "",
    description: description || "",
    targetJD: targetJD || "",
  })

  if (!result.success) {
    const status = result.error?.includes("未配置") ? 500 : 400
    return NextResponse.json({ error: result.error }, { status })
  }

  const responseBody: Record<string, unknown> = {
    optimizedText: result.optimizedText,
    jdMode: result.jdMode ?? false,
  }

  if (result.debug) {
    responseBody.debug = result.debug
  }

  return NextResponse.json(responseBody)
}

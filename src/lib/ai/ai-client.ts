/**
 * Unified AI Client — OpenAI-compatible API.
 *
 * Accepts a simple config { apiKey, baseUrl, model } and makes
 * chat completion requests. No billing, no DB, no quota tracking.
 */

const REQUEST_TIMEOUT_MS = 15_000
const MAX_RETRIES = 1
const RETRY_DELAY_MS = 1000

export interface AICallerConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export interface AICallParams {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
  temperature?: number
  maxTokens?: number
}

export interface AICallResult {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

interface AIResponse {
  choices: Array<{ message: { content: string } }>
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function createAICaller(config: AICallerConfig) {
  return {
    async call(params: AICallParams): Promise<AICallResult> {
      let lastError: Error | null = null

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

        try {
          const res = await fetch(`${config.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.apiKey}`,
              ...(config.baseUrl.includes("openrouter.ai")
                ? { "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" }
                : {}),
            },
            body: JSON.stringify({
              model: config.model,
              messages: params.messages,
              temperature: params.temperature ?? 0.2,
              max_tokens: params.maxTokens ?? 1536,
            }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}))
            const msg =
              (errBody as { error?: { message?: string } })?.error?.message ||
              `AI API 返回 ${res.status}`
            throw new Error(msg)
          }

          const data = (await res.json()) as AIResponse
          const content = data.choices?.[0]?.message?.content || ""
          const usage = {
            promptTokens: data.usage?.prompt_tokens ?? 0,
            completionTokens: data.usage?.completion_tokens ?? 0,
            totalTokens: data.usage?.total_tokens ?? 0,
          }

          return { content, usage }
        } catch (error) {
          clearTimeout(timeoutId)
          lastError = error instanceof Error ? error : new Error(String(error))

          if (lastError.name === "AbortError") {
            lastError = new Error("AI 请求超时，请检查网络后重试")
          }

          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY_MS * (attempt + 1))
          }
        }
      }

      throw lastError || new Error("AI 请求失败")
    },
  }
}

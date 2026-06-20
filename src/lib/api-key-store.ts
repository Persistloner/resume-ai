"use client"

const STORAGE_KEY = "resume-builder-ai-config"

export interface AIConfig {
  apiKey: string
  baseUrl: string
  model: string
}

// ─── Provider Definitions ──────────────────────────────────────────────

export interface ProviderDef {
  label: string
  baseUrl: string
  defaultModel: string
  models: string[]
}

export const PROVIDERS: Record<string, ProviderDef> = {
  deepseek: {
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
  },
  openrouter: {
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "anthropic/claude-sonnet-4",
    models: [
      "anthropic/claude-sonnet-4",
      "openai/gpt-4o-mini",
      "google/gemini-2.5-flash",
      "deepseek/deepseek-chat",
      "qwen/qwen-2.5-72b-instruct",
    ],
  },
  openai: {
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o"],
  },
}

// ─── Storage ───────────────────────────────────────────────────────────

export function loadAIConfig(): AIConfig | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.apiKey && parsed.baseUrl && parsed.model) return parsed
  } catch {
    /* corrupted */
  }
  return null
}

export function saveAIConfig(config: AIConfig): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function clearAIConfig(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}

export function hasAIConfig(): boolean {
  return loadAIConfig() !== null
}

// ─── Mask ──────────────────────────────────────────────────────────────

/** Show only first 3 + last 4 chars of an API key. */
export function maskApiKey(key: string): string {
  if (key.length <= 10) return "****"
  return key.slice(0, 5) + "****" + key.slice(-4)
}

// ─── Request Headers ───────────────────────────────────────────────────

export function getAIRequestHeaders(): Record<string, string> | null {
  const config = loadAIConfig()
  if (!config) return null
  return {
    "x-ai-api-key": config.apiKey,
    "x-ai-base-url": config.baseUrl,
    "x-ai-model": config.model,
  }
}

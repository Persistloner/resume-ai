"use client"

const STORAGE_KEY = "resume-builder-ai-config"

export interface AIConfig {
  apiKey: string
  baseUrl: string
  model: string
}

const PRESETS = {
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openrouter/auto",
  },
} as const

export type PresetId = keyof typeof PRESETS

/** Load AI config from localStorage. Returns null if not configured. */
export function loadAIConfig(): AIConfig | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.apiKey && parsed.baseUrl && parsed.model) {
      return parsed
    }
  } catch {
    // Corrupted storage
  }
  return null
}

/** Save AI config to localStorage. */
export function saveAIConfig(config: AIConfig): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

/** Remove AI config from localStorage. */
export function clearAIConfig(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}

/** Check if user has configured their own API key. */
export function hasAIConfig(): boolean {
  return loadAIConfig() !== null
}

/** Returns all available preset configurations. */
export function getPresets(): Record<PresetId, { baseUrl: string; model: string }> {
  return PRESETS
}

/** Headers to attach to AI API requests if user has configured their key. */
export function getAIRequestHeaders(): Record<string, string> | null {
  const config = loadAIConfig()
  if (!config) return null
  return {
    "x-ai-api-key": config.apiKey,
    "x-ai-base-url": config.baseUrl,
    "x-ai-model": config.model,
  }
}

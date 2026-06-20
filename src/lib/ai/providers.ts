/**
 * Provider presets and server-side fallback config.
 *
 * Users configure their own API key / base URL / model via the settings UI.
 * These are stored in localStorage and sent as request headers.
 *
 * If no user config is present, the server falls back to environment variables.
 */

export const PRESETS = {
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

/** Server-side fallback when no user API key is provided in request headers. */
export function getFallbackConfig(): { apiKey: string; baseUrl: string; model: string } | null {
  const key = process.env.DEEPSEEK_API_KEY
  if (!key) return null
  return {
    apiKey: key,
    baseUrl: PRESETS.deepseek.baseUrl,
    model: PRESETS.deepseek.model,
  }
}

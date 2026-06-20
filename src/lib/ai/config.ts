/**
 * Server-side AI configuration resolver.
 *
 * Priority:
 *   1. User-provided headers (x-ai-api-key, x-ai-base-url, x-ai-model)
 *   2. Server environment variables (DEEPSEEK_API_KEY, etc.)
 *   3. Error — no key available
 *
 * Headers are read once per request and never stored, logged, or cached.
 */

import { getFallbackConfig } from "./providers"

export interface AICallerConfig {
  apiKey: string
  baseUrl: string
  model: string
}

const KEY_HEADER = "x-ai-api-key"
const URL_HEADER = "x-ai-base-url"
const MODEL_HEADER = "x-ai-model"

/**
 * Resolve AI config from request headers or server environment.
 * Returns config or null if no key is available.
 */
export function resolveAIConfig(headers: Headers): AICallerConfig | null {
  const userKey = headers.get(KEY_HEADER)
  const userUrl = headers.get(URL_HEADER)
  const userModel = headers.get(MODEL_HEADER)

  // User provided all required fields — use them
  if (userKey && userUrl && userModel) {
    return {
      apiKey: userKey,
      baseUrl: userUrl,
      model: userModel,
    }
  }

  // No user config — fall back to server environment
  return getFallbackConfig()
}

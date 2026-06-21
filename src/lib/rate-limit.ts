import { RATE_LIMIT } from "@/lib/constants"

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, 300_000)

export function checkRateLimit(
  userId: string,
  mode: "system" | "user"
): { allowed: boolean; remaining: number; resetAt: number } {
  const limit =
    mode === "system" ? RATE_LIMIT.FREE : RATE_LIMIT.USER_KEY
  const key = `${userId}:${mode}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + limit.windowMs,
    }
    store.set(key, newEntry)
    return {
      allowed: true,
      remaining: limit.maxRequests - 1,
      resetAt: newEntry.resetAt,
    }
  }

  if (entry.count >= limit.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: limit.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

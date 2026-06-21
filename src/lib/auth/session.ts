import { cookies } from "next/headers"
import { v4 as uuid } from "uuid"
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/constants"

export async function getOrCreateSession(): Promise<string> {
  const cookieStore = await cookies()
  const existing = cookieStore.get(SESSION_COOKIE)

  if (existing?.value) {
    return existing.value
  }

  const sessionId = uuid()
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  })

  return sessionId
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies()
  const existing = cookieStore.get(SESSION_COOKIE)
  return existing?.value ?? null
}

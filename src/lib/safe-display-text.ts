/**
 * Sanitize AI-generated text for safe display.
 * Prevents raw JSON or malformed AI output from appearing in the UI.
 */
export function safeDisplayText(text: string | undefined | null): string {
  if (!text) return ""
  const trimmed = text.trim()
  // If the text is still raw JSON (unparsed), don't render it
  if (trimmed.startsWith("{") && trimmed.includes('"')) {
    return "AI 返回结果解析异常，请重新分析。"
  }
  return trimmed
}

/**
 * Normalize raw resume text extracted from DOCX/PDF before AI parsing.
 *
 * Addresses:
 * - Wingdings/Webdings Private Use Area symbols from WPS/Word
 * - Invisible formatting characters
 * - Repeated blank lines
 * - Inconsistent bullet styles
 * - Single-char garbage artifacts from PUA decode
 */

// ─── PUA bullet mappings ─────────────────────────────────────────

const BULLET = "•"

const PUA_SYMBOL_MAP: Record<number, string> = {
  0xf06e: BULLET,
  0xf0a7: BULLET,
  0xf0d8: BULLET,
  0xf0b7: BULLET,
  0xf0fc: "✓",
  0xf0a8: "◆",
  0xf020: "",
  0xf04a: "○",
  0xf0de: "→",
  0xf0e0: "→",
  0xf0c2: "✗",
  0xf06c: BULLET,
}

function mapPuaChar(code: number): string {
  if (code in PUA_SYMBOL_MAP) return PUA_SYMBOL_MAP[code]
  if ((code >= 0xe000 && code <= 0xf8ff) || (code >= 0xf0000 && code <= 0xffffd)) {
    return ""
  }
  return String.fromCodePoint(code)
}

// ─── Build regexes from code points (avoids literal invisible chars in source) ─

const INVISIBLE_CODES = [0x00ad, 0x200b, 0x200c, 0x200d, 0x200e, 0x200f, 0xfeff, 0x2060]
const INVISIBLE_RE = new RegExp("[" + INVISIBLE_CODES.map((c) => String.fromCodePoint(c)).join("") + "]", "g")

const NBSP_RE = new RegExp(String.fromCodePoint(0x00a0), "g")

const LINE_SEP_RE = new RegExp(
  "[" + String.fromCodePoint(0x2028) + String.fromCodePoint(0x2029) + "]",
  "g",
)

// Bullet-like chars to normalize
const BULLET_CODES = [
  0x25cb, 0x25e6, 0x25ef, 0x25c9, 0x25ce, 0x25cf, // circles
  0x25a0, // square
  0x25c6, // diamond
  0x25b6, 0x25b8, // triangles
  0x25aa, 0x25ab, // small squares
  0x2013, 0x2014, // en/em dash
  0x2023, // triangular bullet
  0x2043, // hyphen bullet
  0x27a2, // arrowhead
  0x2756, 0x2726, 0x2727, 0x2736, // stars/diamonds
  0x00b7, // middle dot
  0x2022, // bullet (normalize to self)
  0x00a7, // section sign (common U+F0A7 artifact)
]
const BULLET_RE = new RegExp(
  "[" + BULLET_CODES.map((c) => String.fromCodePoint(c)).join("") + "]",
  "g",
)

// Unicode spaces + formatting chars for stripping single-char rubbish lines
const SPACE_CODES: number[] = []
for (let c = 0x2000; c <= 0x200f; c++) SPACE_CODES.push(c)
SPACE_CODES.push(0x2028, 0x2029, 0x00a0)
const SPACE_RE = new RegExp(
  "[\\s" + SPACE_CODES.map((c) => String.fromCodePoint(c)).join("") + "]",
  "g",
)

const SINGLE_CHAR_LINE_RE = /^[!-~§]$/

// ─── Main export ──────────────────────────────────────────────────

export function normalizeResumeText(raw: string): string {
  if (!raw) return ""

  let text = raw

  // 1. Remove BOM
  text = text.replace(/^﻿/, "")

  // 2. Map/replace Private Use Area characters
  text = text.replace(/[\u{E000}-\u{F8FF}\u{F0000}-\u{FFFFD}]/gu, (ch) => {
    const code = ch.codePointAt(0)
    return code != null ? mapPuaChar(code) : ""
  })

  // 3. Remove invisible / zero-width formatting chars; normalize NBSP & separators
  text = text.replace(INVISIBLE_RE, "").replace(NBSP_RE, " ").replace(LINE_SEP_RE, "\n")

  // 4. PUA bullet decode artifacts: Wingdings bullet → "n" prefix at line start
  //    e.g. U+F0D8 ("") decoded as "n " at start of bullet lines
  text = text.replace(/^[nN]\s+(?=\S)/gm, `${BULLET} `)
  //    also: "" (U+F0B7) → often decoded as "l " or "·"
  text = text.replace(/^[lL]\s+(?=\S)/gm, `${BULLET} `)

  // 5. Remove spaces between CJK characters (common OCR artifact)
  //    OCR often inserts spaces: "我 是 一 名" → "我是一名"
  text = text.replace(/([一-鿿㐀-䶿]) (?=[一-鿿㐀-䶿])/g, "$1")

  // 6. Remove lines that are OCR noise: very short (2-3 chars) with no CJK content
  text = text
    .split("\n")
    .filter((line) => {
      const stripped = line.trim()
      if (!stripped) return true // keep blank lines (will be collapsed later)
      // Remove lines that are just page numbers, artifact bars, etc.
      if (/^\d{1,3}$/.test(stripped)) return false
      if (/^[|/\\_\-=]{2,}$/.test(stripped)) return false
      if (stripped.length <= 3 && !/[一-鿿]/.test(stripped)) return false
      return true
    })
    .join("\n")

  // 7. Collapse repeated spaces (preserve newlines)
  text = text.replace(/[^\S\n]{2,}/g, " ")

  // 8. Normalize bullet-like characters to uniform bullet
  text = text.replace(BULLET_RE, BULLET)

  // 8b. Join continuation lines: lines that don't start with a bullet
  //      or section marker are continuations of the previous line
  //      (common artifact of PDF/DOCX text extraction with hard wraps).
  {
    const lines = text.split("\n")
    const joined: string[] = []
    for (const line of lines) {
      const trimmed = line.trimStart()
      const isBulletLine = /^[·•\-–—\*\+]/.test(trimmed)
      const isSectionLine = /^【/.test(trimmed)
      const isBlank = trimmed === ""

      if (isBulletLine || isSectionLine || isBlank || joined.length === 0) {
        joined.push(line)
      } else {
        // Continuation: append to previous line without adding space
        joined[joined.length - 1] += trimmed
      }
    }
    text = joined.join("\n")
  }

  // 9. Remove lines that contain ONLY a single stray printable ASCII/SI char
  text = text
    .split("\n")
    .map((line) => {
      const stripped = line.replace(SPACE_RE, "").trim()
      if (stripped.length === 1 && SINGLE_CHAR_LINE_RE.test(stripped)) {
        return ""
      }
      return line.trimEnd()
    })
    .join("\n")

  // 10. Collapse 3+ consecutive newlines into 2
  text = text.replace(/\n{3,}/g, "\n\n")

  // 11. Trim
  text = text.trim()

  return text
}

// ─── Bullet normalization for import consistency ───────────────────

/** Characters to normalize as bullet markers at line start */
const BULLET_CHARS = /^[·•●○▪▸►▶→➢✓✔✗✘☐☑⬜🔹🔸🔻🔵◆◇❖⭐📍▫▪️\*\+–—]\s*/

/**
 * Normalize ALL bullet markers in text to the standard `- ` format.
 *
 * This ensures the editor (raw text) and preview (structured render)
 * use the same bullet convention.  Apply this after AI parsing
 * to guarantee consistency regardless of what format the AI returned.
 */
export function normalizeBullets(text: string): string {
  if (!text) return ""

  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trimStart()
      if (BULLET_CHARS.test(trimmed)) {
        // Replace the bullet character with standard "- "
        const content = trimmed.replace(BULLET_CHARS, "")
        const indent = line.length - trimmed.length
        return " ".repeat(indent) + "- " + content
      }
      return line
    })
    .join("\n")
}

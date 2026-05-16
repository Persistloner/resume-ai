/**
 * Resume Content Preprocessor
 *
 * Splits raw resume text into structured sentence arrays BEFORE rendering.
 *
 * This is the single source of truth for both preview and PDF export.
 * No renderer should receive raw unformatted text — all text flows through
 * this preprocessor first.
 *
 * Split priority (highest to lowest):
 *   1. ； (Chinese semicolon) — strongest semantic break
 *   2. 。 (Chinese period) — sentence boundary
 *   3. \n (newline) — explicit paragraph break
 *   4. · / • (bullet markers) — list items
 *   5. Max-length smart split at ， (Chinese comma)
 *
 * Anti-orphan rule: no segment ends with fewer than 3 CJK characters
 * orphaned from its parent sentence.
 */

// ─── Types ──────────────────────────────────────────────────────────

/** One independently-rendered block of content */
export interface ContentBlock {
  /** What kind of block */
  type: "bullet" | "paragraph" | "header"
  /** Individual sentences/lines to render separately */
  items: string[]
}

// ─── Constants ──────────────────────────────────────────────────────

const DEFAULT_MAX_ITEM_LENGTH = 65

const MIN_ORPHAN_CHARS = 3

/** Characters we consider "end of sentence" for Chinese text */
const SENTENCE_END_RE = /([。！？])(?=\S)/

/** Characters we consider "clause boundary" */
const CLAUSE_BOUNDARY_RE = /([；])(?=\S)/

/** Characters for soft split (comma-level) */
const SOFT_SPLIT_RE = /([，、])(?=\S)/

/** Bullet markers */
const BULLET_RE = /^[·•●○▪▸►▶→➢\-–—]\s*/

/** Is this a CJK character? */
function isCJK(ch: string): boolean {
  const cp = ch.codePointAt(0)
  return cp != null && (
    (cp >= 0x4e00 && cp <= 0x9fff) ||   // CJK Unified
    (cp >= 0x3400 && cp <= 0x4dbf) ||   // CJK Extension A
    (cp >= 0x3000 && cp <= 0x303f) ||   // CJK Symbols
    (cp >= 0xff00 && cp <= 0xffef) ||   // Halfwidth/Fullwidth
    (cp >= 0xf900 && cp <= 0xfaff)      // CJK Compatibility
  )
}

/** Count CJK characters in a string */
function cjkLen(s: string): number {
  let count = 0
  for (const ch of s) {
    if (isCJK(ch)) count++
  }
  return count
}

// ─── Main API ───────────────────────────────────────────────────────

/**
 * Format resume text into structured content blocks ready for rendering.
 *
 * Both the preview and PDF export should call this function to get
 * the same structured data, guaranteeing visual consistency.
 */
export function formatResumeContent(
  text: string,
  maxItemLength: number = DEFAULT_MAX_ITEM_LENGTH,
): ContentBlock[] {
  if (!text || !text.trim()) return []

  const trimmed = text.trim()

  // Step 0: Split into paragraphs by double newlines
  const rawParagraphs = trimmed.split(/\n{2,}/)

  const blocks: ContentBlock[] = []

  for (const rawPara of rawParagraphs) {
    const para = rawPara.trim()
    if (!para) continue

    // Step 1: Split paragraph into lines by single newlines
    const lines = para.split(/\n/).map((l) => l.trim()).filter(Boolean)

    // Step 2: Process each line
    for (const line of lines) {
      // Check if line starts with a bullet marker
      const bulletMatch = line.match(BULLET_RE)
      const isBullet = bulletMatch !== null

      // Strip bullet prefix for processing
      const cleanLine = isBullet ? line.slice(bulletMatch![0].length).trim() : line

      // Step 3: Split by clause boundaries (；)
      const clauseParts = splitByPattern(cleanLine, CLAUSE_BOUNDARY_RE)

      // Step 4: Split each clause by sentence boundaries (。！？)
      const sentenceParts: string[] = []
      for (const clause of clauseParts) {
        sentenceParts.push(...splitByPattern(clause, SENTENCE_END_RE))
      }

      // Step 5: Split long sentences at soft breaks (，、) — only if exceeding maxItemLength
      const items: string[] = []
      for (const sentence of sentenceParts) {
        const s = sentence.trim()
        if (!s) continue

        if (s.length > maxItemLength) {
          items.push(...softSplit(s))
        } else {
          items.push(s)
        }
      }

      if (items.length === 0) continue

      // Step 6: Group items into blocks
      for (const item of items) {
        blocks.push({
          type: isBullet ? "bullet" : "paragraph",
          items: [item],
        })
      }
    }
  }

  // Step 7: Merge orphan blocks
  return mergeOrphans(blocks)
}

// ─── Internal helpers ───────────────────────────────────────────────

/**
 * Split text by a regex pattern, preserving the delimiter
 * as part of the preceding segment.
 */
function splitByPattern(text: string, pattern: RegExp): string[] {
  const parts: string[] = []
  let remaining = text
  let match: RegExpExecArray | null

  // Use a fresh regex each time to avoid lastIndex issues
  const re = new RegExp(pattern.source, "g")

  while ((match = re.exec(remaining)) !== null) {
    const end = match.index + match[0].length
    parts.push(remaining.slice(0, end).trim())
    remaining = remaining.slice(end).trim()
  }

  if (remaining) {
    parts.push(remaining.trim())
  }

  return parts.length > 0 ? parts : [text]
}

/**
 * Soft-split a long sentence at comma positions.
 * Ensures no fragment ends with fewer than MIN_ORPHAN_CHARS CJK characters.
 */
function softSplit(text: string): string[] {
  // Caller already checks length; this guard is for direct calls.
  if (text.length <= DEFAULT_MAX_ITEM_LENGTH) return [text]

  const parts = splitByPattern(text, SOFT_SPLIT_RE)
  const result: string[] = []

  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue

    // Check if this fragment is too short (orphan)
    if (cjkLen(trimmed) < MIN_ORPHAN_CHARS && result.length > 0) {
      // Merge with previous fragment
      const prev = result[result.length - 1]
      // Reconstruct with the comma that was consumed
      result[result.length - 1] = prev + "，" + trimmed
    } else {
      result.push(trimmed)
    }
  }

  // If merging created an overlong item, accept it (better than orphan)
  return result.length > 0 ? result : [text]
}

/**
 * Merge orphan blocks: a single very short bullet
 * gets merged with the next block if possible.
 */
function mergeOrphans(blocks: ContentBlock[]): ContentBlock[] {
  if (blocks.length < 2) return blocks

  const merged: ContentBlock[] = []
  let i = 0

  while (i < blocks.length) {
    const current = blocks[i]

    // Check if this is a short orphan bullet followed by another bullet
    if (
      current.type === "bullet" &&
      current.items.length === 1 &&
      current.items[0].length < 10 &&
      i + 1 < blocks.length &&
      blocks[i + 1].type === "bullet"
    ) {
      // Merge into next block
      const next = blocks[i + 1]
      merged.push({
        type: "bullet",
        items: [...current.items, ...next.items],
      })
      i += 2
      continue
    }

    merged.push(current)
    i++
  }

  return merged
}

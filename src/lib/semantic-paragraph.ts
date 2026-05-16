/**
 * Semantic Paragraph Segmentation Engine
 *
 * Transforms raw AI-optimized text (bullet-formatted, section-marked,
 * category-headed) into structured segments for professional PDF rendering.
 *
 * Design goals:
 * - Each bullet (· • - → etc.) becomes an independent block
 * - Section markers 【...】 create visual sections with spacing
 * - Category headers (short lines without bullets) group related bullets
 * - Long sentences split at natural Chinese punctuation points
 * - Pure function — no DOM/React dependency, usable in vanilla JS popup
 */

// ─── Types ────────────────────────────────────────────────────────

export interface SemanticSegment {
  type: "bullet" | "paragraph" | "section" | "category-header" | "break"
  content: string
  /** Section label text (without brackets), e.g. "项目背景" */
  label?: string
  /** The bullet character used, preserved for rendering */
  bullet?: string
}

// ─── Constants ────────────────────────────────────────────────────

/** Characters recognized as bullet markers at line start */
const BULLET_PATTERN = /^([·•●○▪▸►▶→➢✅✓✔✗✘☐☑⬜🔹🔸🔻🔵◆◇❖⭐📍▫▪️\-–—\*\+])\s*/

/** Section marker: 【...】 or ［...］ */
const SECTION_PATTERN = /^(【|［)(.+?)(】|］)\s*/

/** Characters where long sentences can be softly split */
const SOFT_BREAK_CHARS = /([。；：])(?=\S)/

/** Characters for secondary soft breaks (within a clause) */
const SECONDARY_BREAK_CHARS = /([，、])(?=\S)/

/** Maximum characters before attempting a soft split.
 *  Set very high — sentence splitting is now handled by
 *  formatResumeContent() which has smarter CJK-aware logic. */
const SOFT_SPLIT_THRESHOLD = 9999

/** Category header: short line without bullet, followed by bullets */
const CATEGORY_HEADER_MAX_LENGTH = 30

// ─── Core segmentation ────────────────────────────────────────────

export function segmentText(text: string): SemanticSegment[] {
  if (!text || !text.trim()) return []

  const trimmed = text.trim()

  // Step 0: Split by double newlines (explicit paragraph breaks)
  const paragraphs = trimmed.split(/\n{2,}/)

  // Step 1: Process each paragraph block
  const segments: SemanticSegment[] = []

  for (let pi = 0; pi < paragraphs.length; pi++) {
    const para = paragraphs[pi].trim()
    if (!para) continue

    // Add spacing between paragraph groups
    if (pi > 0 && segments.length > 0) {
      segments.push({ type: "break", content: "" })
    }

    const lines = para.split("\n").map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) continue

    // Detect: is this a bullet list?
    const bulletLines = lines.filter((l) => BULLET_PATTERN.test(l))
    const bulletRatio = bulletLines.length / lines.length

    if (bulletRatio >= 0.5 || (bulletLines.length >= 1 && lines.length <= 4)) {
      // ── Bullet list processing ──────────────────────────────
      processBulletList(lines, segments)
    } else if (lines.length === 1) {
      // ── Single line ─────────────────────────────────────────
      const line = lines[0]

      // Check for section marker at start
      const sectionMatch = line.match(SECTION_PATTERN)
      if (sectionMatch) {
        const label = sectionMatch[2]
        const rest = line.slice(sectionMatch[0].length).trim()
        segments.push({ type: "section", content: rest, label })
        continue
      }

      // Check for inline section markers
      if (/【.+?】/.test(line)) {
        processInlineSections(line, segments)
        continue
      }

      // Regular paragraph — possibly split long ones
      splitLongSentence(line, segments)
    } else {
      // ── Multi-line non-bullet ───────────────────────────────
      processNonBulletLines(lines, segments)
    }
  }

  return segments
}

// ─── Sub-processors ───────────────────────────────────────────────

function processBulletList(
  lines: string[],
  segments: SemanticSegment[]
): void {
  // Track the last bullet segment so continuation lines can be appended.
  let lastBullet: SemanticSegment | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed) continue

    // ── Rule 1: Bullet marker → new bullet item ────────────────
    const bulletMatch = trimmed.match(BULLET_PATTERN)
    if (bulletMatch) {
      const bullet = bulletMatch[1]
      const content = trimmed.slice(bulletMatch[0].length).trim()

      const sectionMatch = content.match(/^【(.+?)】\s*/)
      if (sectionMatch) {
        lastBullet = {
          type: "section",
          label: sectionMatch[1],
          content: content.slice(sectionMatch[0].length).trim(),
          bullet,
        }
      } else {
        lastBullet = { type: "bullet", content, bullet }
      }
      segments.push(lastBullet)
      continue
    }

    // ── Rule 2: Line starting with ；or ; → new bullet item ────
    //    Semicolon at line-start is a deliberate clause boundary,
    //    not a hard-wrap artifact.  Treat as a new bullet row.
    if (/^[；;]/.test(trimmed)) {
      const content = trimmed.replace(/^[；;]\s*/, "")
      lastBullet = { type: "bullet", content, bullet: "·" }
      segments.push(lastBullet)
      continue
    }

    // ── Rule 3: Category header ────────────────────────────────
    const isShortLine = line.length <= CATEGORY_HEADER_MAX_LENGTH
    const hasFollowingBullets =
      i < lines.length - 1 && BULLET_PATTERN.test(lines[i + 1] || "")

    if (isShortLine && hasFollowingBullets) {
      segments.push({ type: "category-header", content: trimmed })
      lastBullet = null // category header is not a bullet
      continue
    }

    // ── Rule 4: Section marker ─────────────────────────────────
    const sectionMatch = trimmed.match(SECTION_PATTERN)
    if (sectionMatch) {
      const label = sectionMatch[2]
      const rest = trimmed.slice(sectionMatch[0].length).trim()
      lastBullet = { type: "section", content: rest, label }
      segments.push(lastBullet)
      continue
    }

    // ── Rule 5: Continuation line → append to previous bullet ──
    //    No bullet prefix, no semicolon-start, not a header.
    //    This is a hard-wrap continuation from the source document.
    if (lastBullet) {
      // Don't insert a space — Chinese text has no word spacing,
      // and English line breaks in PDF extractions are mid-word
      // artifacts that should be removed.
      lastBullet.content += trimmed
      continue
    }

    // ── Rule 6: Truly isolated line (no preceding bullet) ──────
    splitLongSentence(line, segments)
  }
}

function processNonBulletLines(
  lines: string[],
  segments: SemanticSegment[]
): void {
  let lastParagraph: SemanticSegment | null = null

  // Check if first line is a category header (short, followed by bullet-like content)
  const firstLine = lines[0]
  const restLines = lines.slice(1)

  if (
    firstLine.length <= CATEGORY_HEADER_MAX_LENGTH &&
    restLines.length > 0 &&
    !BULLET_PATTERN.test(firstLine) &&
    !SECTION_PATTERN.test(firstLine)
  ) {
    segments.push({ type: "category-header", content: firstLine })
    lastParagraph = null

    // Process the rest as potential bullet items with continuation
    for (const line of restLines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      const bulletMatch = trimmed.match(BULLET_PATTERN)
      if (bulletMatch) {
        lastParagraph = {
          type: "bullet",
          content: trimmed.slice(bulletMatch[0].length).trim(),
          bullet: bulletMatch[1],
        }
        segments.push(lastParagraph)
      } else if (/^[；;]/.test(trimmed)) {
        const content = trimmed.replace(/^[；;]\s*/, "")
        lastParagraph = { type: "bullet", content, bullet: "·" }
        segments.push(lastParagraph)
      } else if (lastParagraph) {
        // Continuation line
        lastParagraph.content += trimmed
      } else {
        lastParagraph = { type: "paragraph", content: trimmed }
        segments.push(lastParagraph)
      }
    }
    return
  }

  // Regular multi-line — each line might be a paragraph or continuation
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const sectionMatch = trimmed.match(SECTION_PATTERN)
    if (sectionMatch) {
      lastParagraph = {
        type: "section",
        label: sectionMatch[2],
        content: trimmed.slice(sectionMatch[0].length).trim(),
      }
      segments.push(lastParagraph)
    } else if (/【.+?】/.test(trimmed)) {
      processInlineSections(trimmed, segments)
      lastParagraph = null
    } else if (/^[；;]/.test(trimmed)) {
      // Semicolon-start → new item
      const content = trimmed.replace(/^[；;]\s*/, "")
      lastParagraph = { type: "bullet", content, bullet: "·" }
      segments.push(lastParagraph)
    } else if (/^[·•\-–—\*\+]/.test(trimmed)) {
      // Bullet-start in non-bullet context → treat as bullet
      const bulletMatch = trimmed.match(BULLET_PATTERN)
      if (bulletMatch) {
        lastParagraph = {
          type: "bullet",
          content: trimmed.slice(bulletMatch[0].length).trim(),
          bullet: bulletMatch[1],
        }
      } else {
        lastParagraph = { type: "paragraph", content: trimmed }
      }
      segments.push(lastParagraph)
    } else if (lastParagraph && lastParagraph.type !== "section") {
      // Continuation: append to previous paragraph/bullet
      lastParagraph.content += trimmed
    } else {
      lastParagraph = { type: "paragraph", content: trimmed }
      segments.push(lastParagraph)
    }
  }
}

function processInlineSections(
  text: string,
  segments: SemanticSegment[]
): void {
  // Split text by 【...】 markers, preserving them as section labels
  const parts = text.split(/(【.+?】)/)
  let currentLabel = ""

  for (const part of parts) {
    if (!part) continue
    const sectionMatch = part.match(/^【(.+?)】$/)
    if (sectionMatch) {
      currentLabel = sectionMatch[1]
    } else if (currentLabel) {
      segments.push({ type: "section", content: part.trim(), label: currentLabel })
      currentLabel = ""
    } else {
      splitLongSentence(part.trim(), segments)
    }
  }
}

function splitLongSentence(
  text: string,
  segments: SemanticSegment[]
): void {
  if (!text) return

  // Don't split if already short enough
  if (text.length <= SOFT_SPLIT_THRESHOLD) {
    const bulletMatch = text.match(BULLET_PATTERN)
    if (bulletMatch) {
      segments.push({
        type: "bullet",
        content: text.slice(bulletMatch[0].length).trim(),
        bullet: bulletMatch[1],
      })
    } else {
      segments.push({ type: "paragraph", content: text })
    }
    return
  }

  // Try primary breaks first (。；：)
  const primarySplit = splitAtBreaks(text, SOFT_BREAK_CHARS)
  if (primarySplit.length > 1) {
    for (const part of primarySplit) {
      if (part.length > SOFT_SPLIT_THRESHOLD) {
        // Try secondary breaks (，、)
        const secondarySplit = splitAtBreaks(part, SECONDARY_BREAK_CHARS)
        for (const sub of secondarySplit) {
          segments.push({ type: "paragraph", content: sub })
        }
      } else {
        segments.push({ type: "paragraph", content: part })
      }
    }
    return
  }

  // Try secondary breaks (，、)
  const secondarySplit = splitAtBreaks(text, SECONDARY_BREAK_CHARS)
  if (secondarySplit.length > 1) {
    for (const part of secondarySplit) {
      segments.push({ type: "paragraph", content: part })
    }
    return
  }

  // Can't split naturally — keep as single paragraph
  segments.push({ type: "paragraph", content: text })
}

function splitAtBreaks(text: string, pattern: RegExp): string[] {
  const parts: string[] = []
  let remaining = text

  while (remaining.length > SOFT_SPLIT_THRESHOLD) {
    // Find the best break point: search for pattern match near the threshold
    const searchEnd = Math.min(remaining.length, SOFT_SPLIT_THRESHOLD + 40)
    const searchRange = remaining.slice(0, searchEnd)

    // Find the LAST match within search range (break at the latest natural point)
    let bestBreak = -1
    let match: RegExpExecArray | null
    const re = new RegExp(pattern.source, "g")

    while ((match = re.exec(searchRange)) !== null) {
      const pos = match.index + match[0].length
      if (pos >= SOFT_SPLIT_THRESHOLD - 10) {
        bestBreak = pos
        break
      }
      bestBreak = pos
    }

    if (bestBreak === -1 || bestBreak < SOFT_SPLIT_THRESHOLD - 20) {
      // No good break found, try secondary pattern if using primary
      if (pattern === SOFT_BREAK_CHARS) {
        // Try finding ，or 、for a softer break
        const secondaryRe = new RegExp(SECONDARY_BREAK_CHARS.source, "g")
        let secondaryBest = -1
        while ((match = secondaryRe.exec(searchRange)) !== null) {
          const pos = match.index + match[0].length
          if (pos >= SOFT_SPLIT_THRESHOLD - 10) {
            secondaryBest = pos
            break
          }
          secondaryBest = pos
        }
        if (secondaryBest > 0) {
          bestBreak = secondaryBest
        }
      }
    }

    if (bestBreak > 0) {
      parts.push(remaining.slice(0, bestBreak).trim())
      remaining = remaining.slice(bestBreak).trim()
    } else {
      // No break point found — keep the rest as one chunk
      break
    }
  }

  if (remaining.trim()) {
    parts.push(remaining.trim())
  }

  return parts.length > 0 ? parts : [text]
}


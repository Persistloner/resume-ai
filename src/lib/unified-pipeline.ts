/**
 * Unified Content Pipeline — SINGLE SOURCE OF TRUTH
 *
 * Every piece of resume text flows through this module.
 *
 * Pipeline:
 *   raw text → segmentText() → SemanticSegment[]
 *          → formatResumeContent() → sentence-level split
 *          → RenderBlock[] (flat, render-ready)
 *
 * Consumers:
 *   - SemanticParagraph (preview React component)
 *   - PDF export (clones the rendered DOM)
 *
 * NO OTHER MODULE should parse, split, or re-interpret text.
 * All line breaks come from block boundaries.
 */

import { segmentText } from "./semantic-paragraph"
import { formatResumeContent } from "./format-resume-content"

/** Bullet items can be longer before comma-splitting kicks in */
const BULLET_MAX_LEN = 120
const PARAGRAPH_MAX_LEN = 65

// ─── Types ──────────────────────────────────────────────────────────

/** Atomic renderable unit. A flat list of these is the final output. */
export interface RenderBlock {
  type: "bullet-row" | "paragraph-row" | "section-header" | "category-header" | "spacer"
  content: string
  /** Only for section-header: the text inside 【】 */
  label?: string
}

// ─── Pipeline ───────────────────────────────────────────────────────

/**
 * Convert raw resume text into a flat list of render-ready blocks.
 *
 * This is THE function. Every bit of text displayed in the resume
 * preview or exported to PDF must pass through this function.
 */
export function parseToRenderBlocks(text: string): RenderBlock[] {
  if (!text || !text.trim()) return []

  // Phase 1: structural detection (bullets, sections, categories, paragraphs)
  const structuralSegments = segmentText(text)

  // Phase 2: flatten into atomic render blocks
  const blocks: RenderBlock[] = []

  for (const seg of structuralSegments) {
    switch (seg.type) {
      case "break":
        blocks.push({ type: "spacer", content: "" })
        break

      case "category-header":
        blocks.push({ type: "category-header", content: seg.content })
        break

      case "section":
        // Section content may contain multiple sentences
        pushSentenceBlocks(seg.content, seg.type, blocks, seg.label)
        break

      case "bullet":
        // Split bullet content into individual sentence items
        pushSentenceBlocks(seg.content, seg.type, blocks)
        break

      case "paragraph":
        // Split paragraph content into individual sentence items
        pushSentenceBlocks(seg.content, seg.type, blocks)
        break
    }
  }

  return blocks
}

// ─── Internal helpers ───────────────────────────────────────────────

/**
 * Split segment content into sentences via formatResumeContent,
 * then append the appropriate RenderBlock for each sentence.
 */
function pushSentenceBlocks(
  content: string,
  segmentType: "bullet" | "paragraph" | "section",
  blocks: RenderBlock[],
  sectionLabel?: string,
): void {
  const maxLen = segmentType === "bullet" ? BULLET_MAX_LEN : PARAGRAPH_MAX_LEN
  const contentBlocks = formatResumeContent(content, maxLen)
  const allItems = contentBlocks.flatMap((cb) => cb.items)

  if (allItems.length === 0) return

  // Section header gets its own block, remaining items follow
  if (segmentType === "section" && sectionLabel) {
    blocks.push({ type: "section-header", content: "", label: sectionLabel })
  }

  const rowType =
    segmentType === "bullet" ? "bullet-row" : "paragraph-row"

  for (const item of allItems) {
    blocks.push({ type: rowType, content: item })
  }
}

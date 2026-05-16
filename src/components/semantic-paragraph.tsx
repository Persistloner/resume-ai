"use client"

interface SemanticParagraphProps {
  text: string
  sizeClass?: string
  className?: string
}

/**
 * Renders text exactly as-is — every newline in the source
 * becomes a line break in the output.  No parsing, no
 * bullet detection, no sentence splitting.
 *
 * Editor <textarea> and Preview are now 1:1 identical.
 */
export function SemanticParagraph({
  text,
  sizeClass = "text-[10px]",
  className = "",
}: SemanticParagraphProps) {
  if (!text) return null

  // Collapse 3+ consecutive newlines → 2 (max 1 blank line between paragraphs)
  const collapsed = text.replace(/\n{3,}/g, "\n\n")

  return (
    <p
      className={`${sizeClass} font-medium text-gray-700 leading-snug whitespace-pre-wrap ${className}`}
      style={{
        maxWidth: "100%",
        wordBreak: "normal",
        overflowWrap: "break-word",
      }}
    >
      {collapsed}
    </p>
  )
}

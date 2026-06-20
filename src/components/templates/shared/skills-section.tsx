"use client"

import { safeDisplayText } from "@/lib/safe-display-text"
import type { Resume } from "@/lib/types"

export interface SkillsSectionProps {
  skills: Resume["skills"]
  showOptimized: boolean
  /** Section heading text, e.g. "核心能力" or "专业技能" */
  heading?: string
  /** Optional CSS class on the outer container */
  className?: string
  /** Render each skill's content. Default: title + description paragraph. */
  renderSkill?: (props: { title: string; description: string }) => React.ReactNode
}

function displayText(desc: string, optimized: string, showOptimized: boolean): string {
  if (!showOptimized) return safeDisplayText(desc)
  return safeDisplayText(optimized) || safeDisplayText(desc)
}

/**
 * Unified skills section — guarantees full description text is shown
 * regardless of which template renders it.
 *
 * Templates can override `renderSkill` for visual styling (chip, compact, etc.)
 * but must always pass the full description through. The default rendering
 * uses pre-wrap + break-word for natural text wrapping.
 */
export function SkillsSection({
  skills,
  showOptimized,
  heading = "专业技能",
  className = "",
  renderSkill,
}: SkillsSectionProps) {
  if (!skills || skills.length === 0) return null

  return (
    <div className={className}>
      {skills.map((skill) => {
        const description = displayText(skill.description, skill.optimizedDescription, showOptimized)

        if (renderSkill) {
          return (
            <div key={skill.id}>{renderSkill({ title: skill.title, description })}</div>
          )
        }

        return (
          <div key={skill.id}>
            <h3 className="font-bold" style={{ fontSize: "0.78rem", color: "#334155" }}>
              {skill.title}
            </h3>
            {description && (
              <p
                className="min-w-0 max-w-full"
                style={{
                  fontSize: "0.75rem",
                  lineHeight: "1.6",
                  color: "#475569",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  lineBreak: "loose",
                  maxWidth: "100%",
                  minWidth: 0,
                  paddingLeft: "10px",
                }}
              >
                {description}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

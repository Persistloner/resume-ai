"use client"

import { useState, useEffect, useMemo } from "react"
import { useResumeStore } from "@/lib/store"
import { Mail, Phone, MapPin, Eye, EyeOff } from "lucide-react"
import { safeDisplayText } from "@/lib/safe-display-text"
import { SemanticParagraph } from "@/components/semantic-paragraph"
import type { Skill, AbilityCard } from "@/lib/types"

function displayText(desc: string, optimized: string, showOptimized: boolean): string {
  if (!showOptimized) return safeDisplayText(desc)
  return safeDisplayText(optimized) || safeDisplayText(desc)
}

// ─── Per-skill isolated renderer ──────────────────────────────

function SkillPreviewItem({
  skill,
  showOptimized,
  skillIndex,
}: {
  skill: Skill
  showOptimized: boolean
  skillIndex: number
}) {
  const primaryText = displayText(skill.description, skill.optimizedDescription, showOptimized)
  const hasCards = showOptimized && skill.abilityCards && skill.abilityCards.length > 0

  return (
    <div data-skill-id={skill.id} data-skill-index={skillIndex}>
      <h3 className="text-[13px] font-bold text-gray-900">{skill.title}</h3>

      {primaryText && (
        <div className="pl-4 text-justify mt-0">
          <SemanticParagraph text={primaryText} sizeClass="text-[13px]" />
        </div>
      )}

      {hasCards && (
        <div className="mt-1 space-y-1.5 pl-2 border-l-2 border-primary/10">
          {skill.abilityCards!.map((card) => (
            <AbilityCardItem key={card.title} card={card} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Per-card isolated renderer ───────────────────────────────

function AbilityCardItem({ card }: { card: AbilityCard }) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold text-gray-700">{card.title}</h4>
      <p className="text-[10px] text-gray-600 leading-relaxed mt-0 font-medium">
        {card.realExperience}
      </p>
      <p className="text-[10px] text-gray-600 leading-relaxed mt-0 font-medium">
        {card.abilityExtraction}
      </p>
      <p className="text-[10px] text-gray-500 leading-relaxed mt-0 font-medium">
        {card.jdMigration}
      </p>
    </div>
  )
}

// ─── Main Preview ─────────────────────────────────────────────

export function ResumePreview() {
  const resume = useResumeStore((s) => s.resume)
  const { personalInfo, workExperience, projectExperience, education, skills } = resume
  const [previewMode, setPreviewMode] = useState<"positioned" | "original">("positioned")
  const showOptimized = previewMode === "positioned"

  // Verify skills don't share object references
  useEffect(() => {
    if (skills.length < 2) return
    for (let i = 0; i < skills.length; i++) {
      for (let j = i + 1; j < skills.length; j++) {
        if (skills[i] === skills[j]) {
          console.error(
            `[ResumePreview] SHARED REFERENCE: skills[${i}]("${skills[i].title}") and skills[${j}]("${skills[j].title}") are the SAME object`
          )
        }
      }
    }
  }, [skills])

  // Detect content duplication (two skills with identical optimized content)
  useEffect(() => {
    const optimized = skills.filter(
      (s) => s.optimizedDescription && s.optimizedDescription.length > 0
    )
    for (let i = 0; i < optimized.length; i++) {
      for (let j = i + 1; j < optimized.length; j++) {
        if (optimized[i].optimizedDescription === optimized[j].optimizedDescription) {
          console.error(
            `[ResumePreview] CONTENT DUPLICATION: "${optimized[i].title}" and "${optimized[j].title}" have IDENTICAL optimizedDescription`
          )
        }
      }
    }
  }, [skills])

  // ─── Auto-zoom to fit one A4 page ─────────────────────────
  const [zoom, setZoom] = useState(1)
  const [overflow, setOverflow] = useState(false)

  // Reset zoom to 1 when content changes
  useEffect(() => {
    setZoom(1)
    setOverflow(false)
  }, [resume, previewMode])

  // Measure after paint and iteratively shrink until content fits
  useEffect(() => {
    const el = document.getElementById("resume-preview")
    if (!el) return

    const A4_H = 297 * 3.7795 // mm → px
    const MIN_ZOOM = 10 / 13  // font floor: 10px / 13px base

    // Wait for paint + font layout before measuring
    const timer = setTimeout(() => {
      // Undo current zoom to get true height, then compute needed zoom
      const trueH = el.scrollHeight / zoom
      if (trueH <= A4_H) return

      const needed = A4_H / trueH
      const newZoom = Math.max(needed, MIN_ZOOM)

      // Only update if meaningfully different (prevents infinite loop)
      if (Math.abs(newZoom - zoom) > 0.001) {
        setZoom(newZoom)
        setOverflow(needed < MIN_ZOOM)
      }
    }, 100) // small delay ensures DOM + fonts are settled

    return () => clearTimeout(timer)
  }, [zoom, resume, previewMode])

  const hasAnyOptimized = useMemo(
    () =>
      workExperience.some((e) => e.optimizedDescription) ||
      projectExperience.some((p) => p.optimizedDescription) ||
      skills.some((s) => s.optimizedDescription),
    [workExperience, projectExperience, skills]
  )

  return (
    <div className="space-y-3">
      {/* Overflow warning — fixed at top of preview area */}
      {overflow && (
        <div className="sticky top-0 z-50 flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 rounded-md px-3 py-2 text-[12px] font-medium shadow-sm">
          <span className="text-amber-500 text-base font-bold">!</span>
          简历内容较多，建议精简部分描述以获得最佳排版效果
        </div>
      )}

      {/* Preview mode toggle */}
      {hasAnyOptimized && (
        <div className="flex items-center justify-end">
          <button
            onClick={() =>
              setPreviewMode((m) => (m === "positioned" ? "original" : "positioned"))
            }
            className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-md border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {previewMode === "positioned" ? (
              <>
                <EyeOff className="size-3" />
                查看原始描述
              </>
            ) : (
              <>
                <Eye className="size-3" />
                查看 AI 优化
              </>
            )}
          </button>
        </div>
      )}

      <div
        id="resume-preview"
        className="bg-white shadow-xl w-[210mm] min-h-[297mm] px-[22px] py-[26px] text-sm leading-relaxed"
        style={{ zoom }}
      >
        {/* Header */}
        <div data-preview-anchor="preview-personal" className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold tracking-wide">
                {personalInfo.fullName || "姓名"}
              </h1>
              <p className="text-[13px] font-bold text-gray-700 mt-0">{personalInfo.title || "职位"}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[9.5px] font-medium text-gray-500">
                {personalInfo.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="size-3 shrink-0" /> {personalInfo.email}
                  </span>
                )}
                {personalInfo.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3 shrink-0" /> {personalInfo.phone}
                  </span>
                )}
                {personalInfo.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3 shrink-0" /> {personalInfo.location}
                  </span>
                )}
              </div>
            </div>
            {personalInfo.photo && (
              <img
                src={personalInfo.photo}
                alt="简历照片"
                className="w-[60px] h-[76px] object-cover rounded border shrink-0 ml-3"
              />
            )}
          </div>
        </div>

        {/* Summary */}
        {personalInfo.summary && (
          <div className="mb-2">
            <h2 className="text-[15px] font-bold uppercase tracking-wider border-b-2 pb-0.5 mb-1">
              个人简介
            </h2>
            <div className="pl-4 text-justify">
              <SemanticParagraph text={personalInfo.summary} sizeClass="text-[13px]" />
            </div>
          </div>
        )}

        {/* Work Experience */}
        {workExperience.length > 0 && (
          <div data-preview-anchor="preview-work" className="mb-2">
            <h2 className="text-[15px] font-bold uppercase tracking-wider border-b-2 pb-0.5 mb-1">
              工作经历
            </h2>
            {workExperience.map((exp) => {
              const text = displayText(exp.description, exp.optimizedDescription, showOptimized)
              return (
                <div key={exp.id} className="mb-1.5">
                  <div className="flex justify-between items-baseline gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-bold">
                        {exp.company || "公司名称"}
                        {exp.role ? ` — ${exp.role}` : ""}
                      </h3>
                    </div>
                    <span className="text-[9.5px] font-medium text-gray-500 text-right shrink-0 w-[110px]">
                      {exp.startDate} — {exp.current ? "至今" : exp.endDate}
                    </span>
                  </div>
                  {text && (
                    <div className="pl-4 text-justify mt-0">
                      <SemanticParagraph text={text} sizeClass="text-[13px]" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Project Experience */}
        {projectExperience.length > 0 && (
          <div data-preview-anchor="preview-project" className="mb-2">
            <h2 className="text-[15px] font-bold uppercase tracking-wider border-b-2 pb-0.5 mb-1">
              项目经历
            </h2>
            {projectExperience.map((proj) => {
              const text = displayText(proj.description, proj.optimizedDescription, showOptimized)
              return (
                <div key={proj.id} className="mb-1.5">
                  <div className="flex justify-between items-baseline gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-bold">
                        {proj.name || "项目名称"}
                        {proj.role ? ` — ${proj.role}` : ""}
                      </h3>
                    </div>
                    <span className="text-[9.5px] font-medium text-gray-500 text-right shrink-0 w-[110px]">
                      {proj.duration}
                    </span>
                  </div>
                  {text && (
                    <div className="pl-4 text-justify mt-0">
                      <SemanticParagraph text={text} sizeClass="text-[13px]" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div data-preview-anchor="preview-education" className="mb-2">
            <h2 className="text-[15px] font-bold uppercase tracking-wider border-b-2 pb-0.5 mb-1">
              教育背景
            </h2>
            {education.map((edu) => (
              <div key={edu.id} className="mb-1">
                <div className="flex justify-between items-baseline gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-bold">{edu.school || "学校名称"}</h3>
                  </div>
                  <span className="text-[9.5px] font-medium text-gray-500 text-right shrink-0 w-[110px]">
                    {edu.startDate} — {edu.endDate}
                  </span>
                </div>
                <p className="text-[13px] font-medium text-gray-600 pl-4 text-justify mt-0">
                  {edu.degree} {edu.field && `· ${edu.field}`}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div data-preview-anchor="preview-skills">
            <h2 className="text-[15px] font-bold uppercase tracking-wider border-b-2 pb-0.5 mb-1">
              专业技能
            </h2>
            <div className="space-y-1.5">
              {skills.map((skill, idx) => (
                <SkillPreviewItem
                  key={skill.id}
                  skill={skill}
                  showOptimized={showOptimized}
                  skillIndex={idx}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

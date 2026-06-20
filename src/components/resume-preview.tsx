"use client"

import { useState, useEffect, useMemo } from "react"
import { useResumeStore } from "@/lib/store"
import { Eye, EyeOff } from "lucide-react"
import { ClassicTemplate } from "@/components/templates/classic-template"
import type { TemplateId } from "@/lib/templates"
import { THEME_TO_TEMPLATE } from "@/lib/templates"
import type { ThemeId } from "@/lib/themes"

function getEffectiveTemplateId(theme: ThemeId, templateId: TemplateId): TemplateId {
  if (templateId) return templateId
  return THEME_TO_TEMPLATE[theme] ?? "classic"
}

export function ResumePreview() {
  const resume = useResumeStore((s) => s.resume)
  const theme = useResumeStore((s) => s.theme)
  const templateId = useResumeStore((s) => s.templateId)
  const { skills, workExperience, projectExperience } = resume
  const [previewMode, setPreviewMode] = useState<"positioned" | "original">("positioned")
  const showOptimized = previewMode === "positioned"

  const effectiveTemplateId = getEffectiveTemplateId(theme, templateId)

  // Verify skills don't share object references
  useEffect(() => {
    if (skills.length < 2) return
    for (let i = 0; i < skills.length; i++) {
      for (let j = i + 1; j < skills.length; j++) {
        if (skills[i] === skills[j]) {
          console.error(
            `[ResumePreview] SHARED REFERENCE: skills[${i}] and skills[${j}] are the SAME object`
          )
        }
      }
    }
  }, [skills])

  useEffect(() => {
    const optimized = skills.filter(
      (s) => s.optimizedDescription && s.optimizedDescription.length > 0
    )
    for (let i = 0; i < optimized.length; i++) {
      for (let j = i + 1; j < optimized.length; j++) {
        if (optimized[i].optimizedDescription === optimized[j].optimizedDescription) {
          console.error(
            `[ResumePreview] CONTENT DUPLICATION: "${optimized[i].title}" and "${optimized[j].title}"`
          )
        }
      }
    }
  }, [skills])

  // Auto-zoom to fit one A4 page
  const [zoom, setZoom] = useState(1)
  const [overflow, setOverflow] = useState(false)

  useEffect(() => {
    setZoom(1)
    setOverflow(false)
  }, [resume, previewMode])

  useEffect(() => {
    const el = document.getElementById("resume-preview")
    if (!el) return

    const A4_H = 297 * 3.7795
    const MIN_ZOOM = 10 / 13

    const timer = setTimeout(() => {
      const trueH = el.scrollHeight / zoom
      if (trueH <= A4_H) return

      const needed = A4_H / trueH
      const newZoom = Math.max(needed, MIN_ZOOM)

      if (Math.abs(newZoom - zoom) > 0.001) {
        setZoom(newZoom)
        setOverflow(needed < MIN_ZOOM)
      }
    }, 100)

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
      {overflow && (
        <div className="sticky top-0 z-50 flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 rounded-md px-3 py-2 text-[12px] font-medium shadow-sm">
          <span className="text-amber-500 text-base font-bold">!</span>
          简历内容较多，建议精简部分描述以获得最佳排版效果
        </div>
      )}

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
                <EyeOff className="size-3" /> 查看原始描述
              </>
            ) : (
              <>
                <Eye className="size-3" /> 查看 AI 优化
              </>
            )}
          </button>
        </div>
      )}

      <div
        id="resume-preview"
        data-theme={theme}
        data-template={effectiveTemplateId}
        className="bg-white shadow-xl w-[210mm] min-h-[297mm] text-sm leading-relaxed"
        style={{
          zoom,
          paddingLeft: "var(--resume-page-padding-x)",
          paddingRight: "var(--resume-page-padding-x)",
          paddingTop: "var(--resume-page-padding-y)",
          paddingBottom: "var(--resume-page-padding-y)",
        }}
      >
        <ClassicTemplate resume={resume} showOptimized={showOptimized} />
      </div>
    </div>
  )
}

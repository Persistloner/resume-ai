"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ResumeForm } from "@/components/resume-form"
import { ResumePreview } from "@/components/resume-preview"
import { ExportPDFButton } from "@/components/export-pdf-button"
import { ImportResumeDialog } from "@/components/import-resume-dialog"
import { ATSPanel } from "@/components/ats-panel"
import { SettingsDialog } from "@/components/settings-dialog"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useResumeStore } from "@/lib/store"
import { Upload, PanelRightOpen, PanelRightClose, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"

type SectionId = "personal" | "work" | "project" | "education" | "skills"

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "personal", label: "基本信息" },
  { id: "work", label: "工作经历" },
  { id: "project", label: "项目经历" },
  { id: "education", label: "教育背景" },
  { id: "skills", label: "专业技能" },
]

const SECTION_ANCHORS: Record<SectionId, string> = {
  personal: "preview-personal",
  work: "preview-work",
  project: "preview-project",
  education: "preview-education",
  skills: "preview-skills",
}

export default function EditorPage() {
  const openSettings = useResumeStore((s) => s.openSettings)
  const [importOpen, setImportOpen] = useState(false)
  const [atsOpen, setAtsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId | null>("personal")
  const previewContainerRef = useRef<HTMLDivElement>(null)

  // Lock body scroll while on editor page
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  const scrollPreviewTo = useCallback((sectionId: SectionId) => {
    const anchor = SECTION_ANCHORS[sectionId]
    const container = previewContainerRef.current
    if (!container) return
    const el = container.querySelector(`[data-preview-anchor="${anchor}"]`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    setActiveSection(sectionId)
  }, [])

  const handleSectionNav = useCallback((sectionId: SectionId) => {
    setActiveSection(sectionId)
    const el = document.getElementById(`editor-section-${sectionId}`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  return (
    <div className="flex flex-col h-screen overflow-hidden print:block print:h-auto print:overflow-visible">
      {/* Top Toolbar */}
      <div className="h-14 border-b flex items-center justify-between px-4 shrink-0 bg-muted/20 print:hidden">
        <div className="flex items-center gap-2.5">
          <span className="size-1.5 rounded-full bg-primary/60" />
          <span className="text-sm font-semibold tracking-tight">简历编辑器</span>
          <span className="text-xs text-muted-foreground/60 hidden sm:inline">— 实时预览</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <Button
            variant="ghost"
            size="sm"
            onClick={openSettings}
            className="gap-1.5 text-xs h-8"
          >
            <Cpu className="size-3.5" />
            <span className="hidden sm:inline">模型配置</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAtsOpen(!atsOpen)}
            className="gap-1.5 text-xs h-8"
          >
            {atsOpen ? (
              <PanelRightClose className="size-3.5" />
            ) : (
              <PanelRightOpen className="size-3.5" />
            )}
            <span className="hidden sm:inline">AI岗位匹配度分析</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            className="gap-1.5 h-8 text-xs"
          >
            <Upload className="size-3.5" />
            <span className="hidden sm:inline">导入</span>
          </Button>
          <ExportPDFButton />
        </div>
      </div>

      {/* Main Content — dual-pane */}
      <div className="flex flex-1 min-h-0 min-w-0 print:block print:overflow-visible">
        {/* Left: Editor Panel */}
        <aside className="w-[45%] min-w-0 min-h-0 shrink-0 border-r flex flex-col print:hidden">
          {/* Section Nav Bar */}
          <nav className="shrink-0 border-b bg-muted/10 px-3 py-1.5 flex items-center gap-1 overflow-x-auto">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSectionNav(s.id)}
                className={`shrink-0 px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  activeSection === s.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
            <span className="w-px h-4 bg-border mx-1 shrink-0" />
            <button
              onClick={() => activeSection && scrollPreviewTo(activeSection)}
              className="shrink-0 px-2 py-1 rounded text-[10px] text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              title="滚动预览区到当前模块"
            >
              定位预览 →
            </button>
          </nav>

          {/* Editor scroll area */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-4">
              <ResumeForm
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                onScrollPreview={scrollPreviewTo}
              />
            </div>
          </div>
        </aside>

        {/* Right: Preview Panel */}
        <main
          ref={previewContainerRef}
          className="flex-1 min-w-0 min-h-0 overflow-y-auto bg-muted/30 print:overflow-visible print:bg-white"
          style={{ scrollbarGutter: "stable" }}
        >
          <div className="p-6 flex justify-center print:p-0 print:block">
            <div className="w-full max-w-[210mm] print:max-w-none" style={{ wordBreak: "break-word" }}>
              <ResumePreview />
            </div>
          </div>
        </main>
      </div>

      {/* ATS Slide-in Drawer */}
      {atsOpen && (
        <aside className="fixed right-0 top-14 bottom-0 w-[380px] max-w-[90vw] border-l bg-background shadow-2xl z-20 overflow-y-auto print:hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">AI岗位匹配度分析</h3>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setAtsOpen(false)}
              >
                <PanelRightClose className="size-4" />
              </Button>
            </div>
            <ATSPanel />
          </div>
        </aside>
      )}

      <ImportResumeDialog open={importOpen} onOpenChange={setImportOpen} />
      <SettingsDialog />
    </div>
  )
}

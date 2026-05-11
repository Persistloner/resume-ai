"use client"

import { useState } from "react"
import { ResumeForm } from "@/components/resume-form"
import { ResumePreview } from "@/components/resume-preview"
import { JDInput } from "@/components/jd-input"
import { ExportPDFButton } from "@/components/export-pdf-button"
import { ImportResumeDialog } from "@/components/import-resume-dialog"
import { ATSPanel } from "@/components/ats-panel"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function EditorPage() {
  const [importOpen, setImportOpen] = useState(false)

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-3.5rem)]">
      {/* Top Toolbar */}
      <div className="h-14 border-b flex items-center justify-between px-6 shrink-0 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <span className="size-1.5 rounded-full bg-primary/60" />
          <span className="text-sm font-semibold tracking-tight">简历编辑器</span>
          <span className="text-xs text-muted-foreground/60">— 实时预览</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            className="gap-2 h-8.5 text-xs"
          >
            <Upload className="size-3.5" />
            导入
          </Button>
          <ExportPDFButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Form */}
        <div className="w-[480px] shrink-0 border-r overflow-y-auto">
          <div className="p-6">
            <JDInput />
            <ATSPanel />
            <h2 className="text-lg font-semibold mb-6 mt-6">简历编辑</h2>
            <ResumeForm />
          </div>
        </div>

        {/* Right: Preview */}
        <div className="flex-1 bg-muted/30 overflow-y-auto">
          <div className="p-8 flex justify-center">
            <ResumePreview />
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      <ImportResumeDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}

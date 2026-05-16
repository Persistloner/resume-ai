"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useResumeStore } from "@/lib/store"
import { toast } from "sonner"
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react"

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

type ParsePhase = "idle" | "uploading" | "parsing" | "preview"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Preview helpers ──────────────────────────────────────────────

interface PreviewData {
  personalInfo: {
    fullName: string; title: string; email: string; phone: string; location: string
  }
  workExperience: Array<{ company: string; role: string; description: string }>
  projectExperience: Array<{ name: string; role: string; description: string }>
  education: Array<{ school: string; degree: string; field: string }>
  skills: Array<{ title: string; description: string }>
}

function SectionPreview({
  title,
  count,
  items,
}: {
  title: string
  count: number
  items: Array<{ primary: string; secondary: string; detail?: string }>
}) {
  const [expanded, setExpanded] = useState(false)

  if (count === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <AlertCircle className="size-3 text-amber-500" />
        <span>{title}：未识别到（可手动补充）</span>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs font-medium hover:text-foreground transition-colors w-full text-left"
      >
        {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        <CheckCircle2 className="size-3 text-emerald-500" />
        {title}：{count} 条
      </button>
      {expanded && (
        <div className="mt-1.5 ml-5 space-y-1.5 max-h-48 overflow-y-auto">
          {items.map((item, i) => (
            <div key={i} className="text-[11px] leading-relaxed border-l-2 border-muted pl-2">
              <span className="font-medium">{item.primary}</span>
              {item.secondary && <span className="text-muted-foreground"> · {item.secondary}</span>}
              {item.detail && (
                <p className="text-muted-foreground mt-0.5 line-clamp-2">{item.detail}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────

export function ImportResumeDialog({ open, onOpenChange }: Props) {
  const [phase, setPhase] = useState<ParsePhase>("idle")
  const [fileName, setFileName] = useState("")
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const setResume = useResumeStore((s) => s.setResume)

  const resetState = () => {
    setPhase("idle")
    setFileName("")
    setPreviewData(null)
  }

  const handleImport = () => {
    if (!previewData) return
    // The actual data was already stored in previewData
    // setResume expects the full Resume format
    setResume(previewData as any)
    toast.success("简历导入成功", { id: "parse-resume" })
    onOpenChange(false)
    resetState()
  }

  const handleFile = useCallback(
    async (file: File) => {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ]
      if (!validTypes.includes(file.type)) {
        toast.error("仅支持 DOCX 和 TXT 格式。推荐使用 Word 导出的 DOCX 简历。")
        return
      }
      if (file.size > MAX_SIZE) {
        toast.error("文件大小不能超过 10MB")
        return
      }

      setFileName(file.name)
      setPhase("uploading")

      const formData = new FormData()
      formData.append("file", file)

      try {
        setPhase("parsing")
        toast.loading("正在 AI 解析简历...", { id: "parse-resume" })

        const res = await fetch("/api/resume/parse", {
          method: "POST",
          body: formData,
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "解析失败")
        }

        // Store parsed data for preview — don't import yet
        setPreviewData(data.data)
        setPhase("preview")
        toast.success("解析完成，请核对后确认导入", { id: "parse-resume" })
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "导入失败，请重试",
          { id: "parse-resume" }
        )
        setPhase("idle")
      }
    },
    []
  )

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleFile(acceptedFiles[0])
      }
    },
    [handleFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: MAX_SIZE,
    disabled: phase !== "idle",
  })

  const isProcessing = phase === "uploading" || phase === "parsing"

  // ── Build preview sections ────────────────────────────────────

  const workItems = (previewData?.workExperience || []).map((e) => ({
    primary: e.company || "未知公司",
    secondary: e.role,
    detail: e.description,
  }))

  const projectItems = (previewData?.projectExperience || []).map((p) => ({
    primary: p.name || "未知项目",
    secondary: p.role,
    detail: p.description,
  }))

  const eduItems = (previewData?.education || []).map((e) => ({
    primary: e.school || "未知学校",
    secondary: `${e.degree || ""} ${e.field || ""}`.trim(),
  }))

  const skillItems = (previewData?.skills || []).map((s) => ({
    primary: s.title,
    secondary: "",
    detail: s.description,
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {phase === "preview" ? "核对解析结果" : "导入简历"}
          </DialogTitle>
          <DialogDescription>
            {phase === "preview"
              ? "AI 已从简历中提取以下信息，请核对是否完整。确认后信息将填入编辑器。"
              : "上传 DOCX 或 TXT 格式简历，系统自动提取信息填入编辑器。推荐 Word 导出的 DOCX，解析效果最佳。"}
          </DialogDescription>
        </DialogHeader>

        {/* ── Preview Phase ──────────────────────────────────── */}
        {phase === "preview" && previewData && (
          <div className="space-y-3 py-2">
            {/* Personal info summary */}
            <div className="bg-muted/30 rounded-lg px-3 py-2">
              <div className="text-sm font-semibold">
                {previewData.personalInfo?.fullName || "未识别姓名"}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 space-x-2">
                {previewData.personalInfo?.title && <span>{previewData.personalInfo.title}</span>}
                {previewData.personalInfo?.email && <span>· {previewData.personalInfo.email}</span>}
                {previewData.personalInfo?.phone && <span>· {previewData.personalInfo.phone}</span>}
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              <SectionPreview title="工作经历" count={workItems.length} items={workItems} />
              <SectionPreview title="项目经历" count={projectItems.length} items={projectItems} />
              <SectionPreview title="教育背景" count={eduItems.length} items={eduItems} />
              <SectionPreview title="专业技能" count={skillItems.length} items={skillItems} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => {
                  resetState()
                  toast.dismiss("parse-resume")
                }}
              >
                重新上传
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs gap-1.5"
                onClick={handleImport}
              >
                <CheckCircle2 className="size-3.5" />
                确认导入
              </Button>
            </div>
          </div>
        )}

        {/* ── Drop Zone (idle / processing) ──────────────────── */}
        {phase !== "preview" && (
          <>
            <div
              {...getRootProps()}
              className={`
                relative border-2 border-dashed rounded-lg p-10 text-center cursor-pointer
                transition-colors select-none
                ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"}
                ${isProcessing ? "pointer-events-none opacity-60" : ""}
              `}
            >
              <input {...getInputProps()} />

              {isProcessing ? (
                <div className="space-y-3">
                  {phase === "uploading" && (
                    <>
                      <Loader2 className="size-8 mx-auto animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">正在上传...</p>
                    </>
                  )}
                  {phase === "parsing" && (
                    <>
                      <Loader2 className="size-8 mx-auto animate-spin text-primary" />
                      <p className="text-sm font-medium">正在 AI 解析中...</p>
                      <p className="text-xs text-muted-foreground">{fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        提取基本信息、教育、工作经历、项目经历、技能
                      </p>
                    </>
                  )}
                </div>
              ) : isDragActive ? (
                <div className="space-y-2">
                  <Upload className="size-8 mx-auto text-primary" />
                  <p className="text-sm font-medium text-primary">释放文件以上传</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileText className="size-8 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">
                    拖拽简历文件到此处，或点击选择
                  </p>
                  <p className="text-xs text-muted-foreground">
                    支持 DOCX、TXT，最大 10MB。推荐上传 DOCX 获得最佳解析效果
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <AlertCircle className="size-3" />
                信息由 AI 自动提取，请核对后保存
              </span>
              {isProcessing && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    resetState()
                    toast.dismiss("parse-resume")
                  }}
                >
                  取消
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

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
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react"

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

type ParsePhase = "idle" | "uploading" | "parsing"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportResumeDialog({ open, onOpenChange }: Props) {
  const [phase, setPhase] = useState<ParsePhase>("idle")
  const [fileName, setFileName] = useState("")
  const setResume = useResumeStore((s) => s.setResume)

  const handleFile = useCallback(
    async (file: File) => {
      // Client-side validation
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      if (!validTypes.includes(file.type)) {
        toast.error("仅支持 PDF 和 DOCX 格式")
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
        toast.loading("正在解析简历...", { id: "parse-resume" })

        const res = await fetch("/api/resume/parse", {
          method: "POST",
          body: formData,
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "解析失败")
        }

        // Fill the Zustand store
        setResume(data.data)

        toast.success("简历导入成功，信息已自动填充", { id: "parse-resume" })
        onOpenChange(false)
        resetState()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "导入失败，请重试",
          { id: "parse-resume" }
        )
        setPhase("idle")
      }
    },
    [setResume, onOpenChange]
  )

  const resetState = () => {
    setPhase("idle")
    setFileName("")
  }

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
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx",
      ],
    },
    maxFiles: 1,
    maxSize: MAX_SIZE,
    disabled: phase !== "idle",
  })

  const isProcessing = phase !== "idle"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>导入简历</DialogTitle>
          <DialogDescription>
            上传 PDF 或 DOCX 格式简历，系统自动提取信息填入编辑器。
          </DialogDescription>
        </DialogHeader>

        {/* Drop Zone */}
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
                  <p className="text-xs text-muted-foreground">
                    {fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    正在提取基本信息、教育、经历、技能
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
                支持 PDF、DOCX，最大 10MB
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
      </DialogContent>
    </Dialog>
  )
}

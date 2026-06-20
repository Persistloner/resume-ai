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
import { Upload, FileText, Loader2 } from "lucide-react"

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

type ParsePhase = "idle" | "uploading" | "parsing" | "preview"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportResumeDialog({ open, onOpenChange }: Props) {
  const setResume = useResumeStore((s) => s.setResume)
  const [phase, setPhase] = useState<ParsePhase>("idle")
  const [uploadedFileName, setUploadedFileName] = useState("")

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_SIZE) {
        toast.error("文件过大，最大支持 10MB")
        return
      }

      setUploadedFileName(file.name)
      setPhase("uploading")

      try {
        const formData = new FormData()
        formData.append("file", file)

        setPhase("parsing")

        const res = await fetch("/api/resume/parse", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "解析失败" }))
          throw new Error(err.error || `服务器错误 ${res.status}`)
        }

        const json = await res.json()
        console.log("Import response:", json)

        const resume = json.data

        if (!resume) {
          throw new Error("未能从文件中提取简历信息")
        }

        setResume(resume)
        setPhase("preview")
        toast.success("导入成功！已自动填充简历信息")
        onOpenChange(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : "导入失败，请重试"
        toast.error(message)
        setPhase("idle")
      }
    },
    [setResume, onOpenChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (file) handleFile(file)
    },
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: phase !== "idle",
  })

  const isLoading = phase === "uploading" || phase === "parsing"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>导入简历</DialogTitle>
          <DialogDescription>
            支持 DOCX / TXT，最大 10MB
          </DialogDescription>
        </DialogHeader>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
        >
          <input {...getInputProps()} />

          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="size-8 animate-spin" />
              <p className="text-sm font-medium">
                {phase === "uploading" ? "正在上传..." : "正在解析简历..."}
              </p>
              {uploadedFileName && (
                <p className="text-xs text-muted-foreground/60 truncate max-w-[280px]">
                  {uploadedFileName}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="size-8" />
              <p className="text-sm font-medium">
                {isDragActive ? "释放文件以上传" : "拖拽文件到此处或点击选择"}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                <FileText className="size-3.5" />
                <span>DOCX / TXT</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { exportResumeToPDF } from "@/lib/export-pdf"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function ExportPDFButton() {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    const element = document.getElementById("resume-preview")
    if (!element) {
      toast.error("未找到简历预览内容")
      return
    }

    setLoading(true)

    await exportResumeToPDF({
      element,
      filename: "resume",
      onStart: () => {
        toast.loading("正在生成 PDF...", { id: "pdf-export" })
      },
      onSuccess: () => {
        toast.success("PDF 导出成功", { id: "pdf-export" })
        setLoading(false)
      },
      onError: (error) => {
        toast.error(error.message || "PDF 导出失败，请重试", { id: "pdf-export" })
        setLoading(false)
      },
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className="gap-2 h-8.5 text-xs"
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Download className="size-3.5" />
      )}
      {loading ? "导出中..." : "导出"}
    </Button>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { exportResumeToPDF } from "@/lib/export-pdf"
import { useResumeStore } from "@/lib/store"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function ExportPDFButton() {
  const [loading, setLoading] = useState(false)
  const resume = useResumeStore((s) => s.resume)

  const handleExport = async () => {
    setLoading(true)

    await exportResumeToPDF({
      resume,
      onStart: () => {
        toast.info("正在准备导出，请在弹出的打印对话框中：选择「另存为 PDF」→ 点击保存 → 选择保存位置", {
          id: "pdf-export",
          duration: 6000,
        })
      },
      onSuccess: () => {
        toast.success("PDF 导出完成", { id: "pdf-export" })
        setLoading(false)
      },
      onError: (error) => {
        toast.error(error.message || "导出失败，请重试", { id: "pdf-export" })
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
      {loading ? "导出中..." : "导出 PDF"}
    </Button>
  )
}

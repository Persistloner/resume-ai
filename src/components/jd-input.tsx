"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useResumeStore } from "@/lib/store"
import { Briefcase, ChevronDown, ChevronRight, X } from "lucide-react"

export function JDInput() {
  const targetJD = useResumeStore((s) => s.targetJD)
  const setTargetJD = useResumeStore((s) => s.setTargetJD)
  const [open, setOpen] = useState(false)

  const hasJD = targetJD.trim().length > 0

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 w-full group py-1"
      >
        {open ? (
          <ChevronDown className="size-4 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground" />
        )}
        <Briefcase className="size-4 text-muted-foreground/60" />
        <span className={`text-sm font-medium transition-colors ${hasJD ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
          目标岗位 JD
        </span>
        {hasJD && (
          <span className="text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
            ·
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2.5 space-y-2.5">
          <Textarea
            value={targetJD}
            onChange={(e) => setTargetJD(e.target.value)}
            placeholder="粘贴目标岗位 JD，AI 将根据岗位要求优化简历内容"
            rows={5}
            className="text-sm resize-y"
          />
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              {hasJD
                ? "✓ AI 将对标岗位要求，进行定向优化"
                : "填写后开启 JD 匹配模式"}
            </p>
            {hasJD && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setTargetJD("")}
                className="gap-1 text-[11px] h-6 px-2 text-muted-foreground hover:text-destructive"
              >
                <X className="size-3" />
                清空
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

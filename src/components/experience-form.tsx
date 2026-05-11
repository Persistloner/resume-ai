"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useResumeStore } from "@/lib/store"
import { Plus, Trash2, Sparkles } from "lucide-react"
import { toast } from "sonner"

export function ExperienceForm() {
  const experience = useResumeStore((s) => s.resume.experience)
  const addExperience = useResumeStore((s) => s.addExperience)
  const updateExperience = useResumeStore((s) => s.updateExperience)
  const removeExperience = useResumeStore((s) => s.removeExperience)
  const optimizingId = useResumeStore((s) => s.optimizingId)
  const setOptimizingId = useResumeStore((s) => s.setOptimizingId)
  const targetJD = useResumeStore((s) => s.targetJD)

  const jdMode = targetJD.trim().length > 0

  const handleOptimize = async (id: string, company: string, position: string, description: string) => {
    if (!description.trim()) {
      toast.warning("请先填写工作描述内容")
      return
    }

    setOptimizingId(id)

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, position, description, targetJD }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "优化失败")
      }

      updateExperience(id, { description: data.optimizedText })
      toast.success(jdMode ? "JD 匹配优化完成" : "AI 优化完成")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI 优化失败，请重试")
    } finally {
      setOptimizingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {jdMode && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-md px-3 py-1.5">
          <span className="size-1 rounded-full bg-primary/70" />
          JD 匹配模式 — AI 将对标岗位要求进行定向优化
        </div>
      )}

      {experience.map((exp) => {
        const isOptimizing = optimizingId === exp.id

        return (
          <div key={exp.id} className="border rounded-lg p-4 space-y-3 relative">
            <Button
              variant="ghost"
              size="icon-xs"
              className="absolute top-3 right-3"
              onClick={() => removeExperience(exp.id)}
              disabled={experience.length <= 1}
            >
              <Trash2 className="size-3.5 text-muted-foreground" />
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">公司</label>
                <Input
                  value={exp.company}
                  onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                  placeholder="公司名称"
                />
              </div>
              <div>
                <label className="text-sm font-medium">职位</label>
                <Input
                  value={exp.position}
                  onChange={(e) => updateExperience(exp.id, { position: e.target.value })}
                  placeholder="职位名称"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">开始日期</label>
                <Input
                  value={exp.startDate}
                  onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                  placeholder="2022-03"
                />
              </div>
              <div>
                <label className="text-sm font-medium">结束日期</label>
                <Input
                  value={exp.endDate}
                  onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                  placeholder="至今留空"
                  disabled={exp.current}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={exp.current}
                onChange={(e) =>
                  updateExperience(exp.id, { current: e.target.checked, endDate: "" })
                }
                className="rounded"
              />
              至今
            </label>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">工作描述</label>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleOptimize(exp.id, exp.company, exp.position, exp.description)}
                  disabled={isOptimizing}
                  className="gap-1.5 text-[11px] h-7 hover:bg-primary/5 hover:text-primary transition-colors"
                >
                  <Sparkles className={isOptimizing ? "size-3 animate-pulse text-primary" : "size-3"} />
                  {isOptimizing ? "优化中..." : "AI 优化"}
                </Button>
              </div>
              <Textarea
                value={exp.description}
                onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                placeholder="描述工作内容和成就..."
                rows={3}
              />
            </div>
          </div>
        )
      })}

      <Button variant="outline" className="w-full" onClick={addExperience}>
        <Plus className="size-4" />
        添加工作经历
      </Button>
    </div>
  )
}

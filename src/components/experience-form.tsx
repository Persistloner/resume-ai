"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useResumeStore } from "@/lib/store"
import { Plus, Trash2, Sparkles, Undo2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { getAIRequestHeaders } from "@/lib/api-key-store"

export function ExperienceForm() {
  const workExperience = useResumeStore((s) => s.resume.workExperience)
  const addWorkExperience = useResumeStore((s) => s.addWorkExperience)
  const updateWorkExperience = useResumeStore((s) => s.updateWorkExperience)
  const removeWorkExperience = useResumeStore((s) => s.removeWorkExperience)
  const optimizingId = useResumeStore((s) => s.optimizingId)
  const setOptimizingId = useResumeStore((s) => s.setOptimizingId)
  const targetJD = useResumeStore((s) => s.targetJD)
  const setPositioningResult = useResumeStore((s) => s.setPositioningResult)
  const undoOptimization = useResumeStore((s) => s.undoOptimization)

  const jdMode = targetJD.trim().length > 0

  const handleOptimize = async (id: string, company: string, role: string, description: string) => {
    if (!description.trim()) {
      toast.warning("请先填写工作描述内容")
      return
    }
    setOptimizingId(id)
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAIRequestHeaders() },
        body: JSON.stringify({ type: "work", company, role, description, targetJD }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === "QUOTA_EXHAUSTED") {
          useResumeStore.getState().openSettings()
        }
        throw new Error(data.message || data.error || "分析失败")
      }
      setPositioningResult("work", id, data.optimizedText, {
        rolePersona: data.rolePersona || "",
        transferableSkills: data.transferableSkills || [],
        coreInsight: data.coreInsight || "",
        sceneMapping: data.sceneMapping || "",
        skillType: data.skillType || "",
        positionedAt: new Date().toISOString(),
        jdMode: data.jdMode || false,
      }, data.abilityCards || [])
      toast.success(jdMode ? "AI 优化完成" : "AI 优化完成")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "分析失败，请重试")
    } finally {
      setOptimizingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {jdMode && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-md px-3 py-1.5">
          <span className="size-1 rounded-full bg-primary/70" />
          已填写目标 JD — AI 将深挖经历中与岗位相关的能力
        </div>
      )}

      {workExperience.map((exp) => {
        const isOptimizing = optimizingId === exp.id
        const hasOptimized = !!exp.optimizedDescription

        return (
          <div key={exp.id} className="border rounded-lg p-4 space-y-3 relative">
            <Button
              variant="ghost"
              size="icon-xs"
              className="absolute top-3 right-3"
              onClick={() => removeWorkExperience(exp.id)}
              disabled={workExperience.length <= 1}
            >
              <Trash2 className="size-3.5 text-muted-foreground" />
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">公司</label>
                <Input
                  value={exp.company}
                  onChange={(e) => updateWorkExperience(exp.id, { company: e.target.value })}
                  placeholder="公司名称"
                />
              </div>
              <div>
                <label className="text-sm font-medium">职位</label>
                <Input
                  value={exp.role}
                  onChange={(e) => updateWorkExperience(exp.id, { role: e.target.value })}
                  placeholder="职位名称"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">开始日期</label>
                <Input
                  value={exp.startDate}
                  onChange={(e) => updateWorkExperience(exp.id, { startDate: e.target.value })}
                  placeholder="2022-03"
                />
              </div>
              <div>
                <label className="text-sm font-medium">结束日期</label>
                <Input
                  value={exp.endDate}
                  onChange={(e) => updateWorkExperience(exp.id, { endDate: e.target.value })}
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
                  updateWorkExperience(exp.id, { current: e.target.checked, endDate: "" })
                }
                className="rounded"
              />
              至今
            </label>

            {/* Description — data-driven: optimized OR original */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">工作描述</label>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleOptimize(exp.id, exp.company, exp.role, exp.description)}
                  disabled={isOptimizing}
                  className="gap-1.5 text-[11px] h-7 hover:bg-primary/5 hover:text-primary transition-colors"
                >
                  <Sparkles className={isOptimizing ? "size-3 animate-pulse text-primary" : "size-3"} />
                  {isOptimizing ? "优化中..." : "AI 优化"}
                </Button>
              </div>

              {/* Always one textarea — data determines content */}
              {hasOptimized ? (
                <div className="border border-primary/15 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-primary/5 border-b border-primary/10">
                    <span className="text-xs font-medium text-primary/70">
                      ✨ AI 优化
                    </span>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => undoOptimization("work", exp.id)}
                        disabled={!exp.optimizationHistory?.length}
                        title="撤销优化"
                      >
                        <Undo2 className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleOptimize(exp.id, exp.company, exp.role, exp.description)}
                        disabled={isOptimizing}
                        title="重新优化"
                      >
                        <RotateCcw className="size-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="px-3 py-2.5">
                    <Textarea
                      value={exp.optimizedDescription}
                      onChange={(e) => updateWorkExperience(exp.id, { optimizedDescription: e.target.value })}
                      rows={5}
                      className="border-0 bg-transparent resize-none text-sm p-0 focus-visible:ring-0"
                    />
                  </div>
                </div>
              ) : (
                <Textarea
                  value={exp.description}
                  onChange={(e) => updateWorkExperience(exp.id, { description: e.target.value })}
                  placeholder="描述工作内容和成就..."
                  rows={3}
                />
              )}
            </div>
          </div>
        )
      })}

      <Button variant="outline" className="w-full" onClick={addWorkExperience}>
        <Plus className="size-4" />
        添加工作经历
      </Button>
    </div>
  )
}

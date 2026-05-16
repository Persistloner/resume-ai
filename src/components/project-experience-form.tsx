"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useResumeStore } from "@/lib/store"
import { Plus, Trash2, Sparkles, Undo2, RotateCcw } from "lucide-react"
import { toast } from "sonner"

export function ProjectExperienceForm() {
  const projectExperience = useResumeStore((s) => s.resume.projectExperience)
  const addProjectExperience = useResumeStore((s) => s.addProjectExperience)
  const updateProjectExperience = useResumeStore((s) => s.updateProjectExperience)
  const removeProjectExperience = useResumeStore((s) => s.removeProjectExperience)
  const optimizingId = useResumeStore((s) => s.optimizingId)
  const setOptimizingId = useResumeStore((s) => s.setOptimizingId)
  const targetJD = useResumeStore((s) => s.targetJD)
  const setPositioningResult = useResumeStore((s) => s.setPositioningResult)
  const undoOptimization = useResumeStore((s) => s.undoOptimization)

  const jdMode = targetJD.trim().length > 0

  const handleOptimize = async (id: string, name: string, role: string, description: string) => {
    if (!description.trim()) {
      toast.warning("请先填写项目描述内容")
      return
    }
    setOptimizingId(id)
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "project", company: name, role, description, targetJD }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "分析失败")
      setPositioningResult("project", id, data.optimizedText, {
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

      {projectExperience.map((proj) => {
        const isOptimizing = optimizingId === proj.id
        const hasOptimized = !!proj.optimizedDescription

        return (
          <div key={proj.id} className="border rounded-lg p-4 space-y-3 relative">
            <Button
              variant="ghost"
              size="icon-xs"
              className="absolute top-3 right-3"
              onClick={() => removeProjectExperience(proj.id)}
            >
              <Trash2 className="size-3.5 text-muted-foreground" />
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">项目名称</label>
                <Input
                  value={proj.name}
                  onChange={(e) => updateProjectExperience(proj.id, { name: e.target.value })}
                  placeholder="项目名称"
                />
              </div>
              <div>
                <label className="text-sm font-medium">担任角色</label>
                <Input
                  value={proj.role}
                  onChange={(e) => updateProjectExperience(proj.id, { role: e.target.value })}
                  placeholder="如：前端负责人"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">项目时间</label>
              <Input
                value={proj.duration}
                onChange={(e) => updateProjectExperience(proj.id, { duration: e.target.value })}
                placeholder="如：2023.10 — 2023.12"
              />
            </div>

            {/* Description — data-driven */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">项目描述</label>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleOptimize(proj.id, proj.name, proj.role, proj.description)}
                  disabled={isOptimizing}
                  className="gap-1.5 text-[11px] h-7 hover:bg-primary/5 hover:text-primary transition-colors"
                >
                  <Sparkles className={isOptimizing ? "size-3 animate-pulse text-primary" : "size-3"} />
                  {isOptimizing ? "优化中..." : "AI 优化"}
                </Button>
              </div>

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
                        onClick={() => undoOptimization("project", proj.id)}
                        disabled={!proj.optimizationHistory?.length}
                        title="撤销优化"
                      >
                        <Undo2 className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleOptimize(proj.id, proj.name, proj.role, proj.description)}
                        disabled={isOptimizing}
                        title="重新优化"
                      >
                        <RotateCcw className="size-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="px-3 py-2.5">
                    <Textarea
                      value={proj.optimizedDescription}
                      onChange={(e) => updateProjectExperience(proj.id, { optimizedDescription: e.target.value })}
                      rows={5}
                      className="border-0 bg-transparent resize-none text-sm p-0 focus-visible:ring-0"
                    />
                  </div>
                </div>
              ) : (
                <Textarea
                  value={proj.description}
                  onChange={(e) => updateProjectExperience(proj.id, { description: e.target.value })}
                  placeholder="描述项目内容、技术栈和成果..."
                  rows={3}
                />
              )}
            </div>
          </div>
        )
      })}

      <Button variant="outline" className="w-full" onClick={addProjectExperience}>
        <Plus className="size-4" />
        添加项目经历
      </Button>
    </div>
  )
}

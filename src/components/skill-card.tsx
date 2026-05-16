"use client"

import { Input } from "@/components/ui/input"
import { useResumeStore } from "@/lib/store"
import { X, Sparkles, Undo2, RotateCcw } from "lucide-react"
import { toast } from "sonner"

interface SkillCardProps {
  skillId: string
}

export function SkillCard({ skillId }: SkillCardProps) {
  const skill = useResumeStore((s) => s.resume.skills.find((sk) => sk.id === skillId))
  const updateSkill = useResumeStore((s) => s.updateSkill)
  const removeSkill = useResumeStore((s) => s.removeSkill)
  const optimizingId = useResumeStore((s) => s.optimizingId)
  const setOptimizingId = useResumeStore((s) => s.setOptimizingId)
  const targetJD = useResumeStore((s) => s.targetJD)
  const optimizeSkillStore = useResumeStore((s) => s.optimizeSkill)
  const undoOptimization = useResumeStore((s) => s.undoOptimization)

  if (!skill) return null

  const isOptimizing = optimizingId === skillId
  const hasOptimized = !!skill.optimizedDescription
  const jdMode = targetJD.trim().length > 0

  const handleOptimize = async () => {
    const desc = skill.description
    if (!desc.trim()) {
      toast.warning("请先填写技能描述")
      return
    }

    console.log(`[SkillCard:${skill.title}] optimizing, id=${skillId}`)
    setOptimizingId(skillId)

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "skill",
          title: skill.title,
          description: skill.description,
          targetJD,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "分析失败")

      optimizeSkillStore(skillId, data.optimizedText, {
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

  const handleUndo = () => {
    undoOptimization("skill", skillId)
  }

  return (
    <div className="group relative rounded-lg border px-3 py-2.5 pr-9 text-sm">
      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={handleOptimize}
          disabled={isOptimizing}
          className="rounded p-0.5 hover:bg-primary/10 hover:text-primary"
          title="AI 优化"
        >
          <Sparkles className={isOptimizing ? "size-3.5 animate-pulse" : "size-3.5"} />
        </button>
        <button onClick={() => removeSkill(skillId)} className="rounded p-0.5 hover:bg-muted">
          <X className="size-3.5" />
        </button>
      </div>

      {/* Title */}
      <Input
        value={skill.title}
        onChange={(e) => updateSkill(skillId, { title: e.target.value })}
        className="font-medium text-sm border-0 border-b border-transparent hover:border-border focus:border-primary px-0 py-0 h-6 rounded-none bg-transparent"
        placeholder="技能标题"
      />

      {/* ── Single textarea: data determines content ── */}
      {hasOptimized ? (
        <div className="mt-1.5 space-y-1.5">
          {/* Header bar */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-primary/70">✨ AI 优化</span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleUndo}
                disabled={!skill.optimizationHistory?.length}
                className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
                title="撤销优化"
              >
                <Undo2 className="size-3" />
              </button>
              <button
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
                title="重新优化"
              >
                <RotateCcw className="size-3" />
              </button>
            </div>
          </div>

          {/* Editable optimized content */}
          <textarea
            value={skill.optimizedDescription}
            onChange={(e) => updateSkill(skillId, { optimizedDescription: e.target.value })}
            rows={5}
            className="w-full rounded-md border border-primary/20 bg-background px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 leading-relaxed"
            placeholder="AI优化后的内容（可编辑）..."
          />
        </div>
      ) : (
        /* Original — always editable */
        <textarea
          value={skill.description}
          onChange={(e) => updateSkill(skillId, { description: e.target.value })}
          placeholder="描述你的实际经历和使用场景..."
          rows={3}
          className="w-full mt-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        />
      )}
    </div>
  )
}

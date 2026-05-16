"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useResumeStore } from "@/lib/store"
import { Plus } from "lucide-react"
import { SkillCard } from "./skill-card"

export function SkillsForm() {
  const skills = useResumeStore((s) => s.resume.skills)
  const addSkill = useResumeStore((s) => s.addSkill)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const handleAdd = () => {
    const t = title.trim()
    if (!t) return
    addSkill(t, description.trim())
    setTitle("")
    setDescription("")
  }

  return (
    <div className="space-y-4">
      {/* Add new skill */}
      <div className="space-y-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="技能方向，如：AI工具与Prompt工程"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="描述你的真实使用场景、工具、方法和产出..."
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button variant="outline" size="sm" onClick={handleAdd} disabled={!title.trim()}>
          <Plus className="size-4" />
          添加
        </Button>
      </div>

      {/* Skill cards — each is a fully independent component */}
      <div className="space-y-2">
        {skills.map((skill) => (
          <SkillCard key={skill.id} skillId={skill.id} />
        ))}
      </div>

      {skills.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          还没有技能，请添加技能方向与描述
        </p>
      )}
    </div>
  )
}

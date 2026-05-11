"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useResumeStore } from "@/lib/store"
import { Plus, X } from "lucide-react"

export function SkillsForm() {
  const skills = useResumeStore((s) => s.resume.skills)
  const addSkill = useResumeStore((s) => s.addSkill)
  const removeSkill = useResumeStore((s) => s.removeSkill)
  const [value, setValue] = useState("")

  const handleAdd = () => {
    const name = value.trim()
    if (!name) return
    addSkill(name)
    setValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入技能名称..."
        />
        <Button variant="outline" size="default" onClick={handleAdd} disabled={!value.trim()}>
          <Plus className="size-4" />
          添加
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Badge key={skill.id} variant="outline" className="gap-1 pr-1">
            {skill.name}
            <button
              onClick={() => removeSkill(skill.id)}
              className="ml-1 rounded-full hover:bg-muted p-0.5"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>

      {skills.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          还没有技能，请输入并添加
        </p>
      )}
    </div>
  )
}

"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useResumeStore } from "@/lib/store"
import { Plus, Trash2 } from "lucide-react"

export function EducationForm() {
  const education = useResumeStore((s) => s.resume.education)
  const addEducation = useResumeStore((s) => s.addEducation)
  const updateEducation = useResumeStore((s) => s.updateEducation)
  const removeEducation = useResumeStore((s) => s.removeEducation)

  return (
    <div className="space-y-6">
      {education.map((edu) => (
        <div key={edu.id} className="border rounded-lg p-4 space-y-3 relative">
          <Button
            variant="ghost"
            size="icon-xs"
            className="absolute top-3 right-3"
            onClick={() => removeEducation(edu.id)}
            disabled={education.length <= 1}
          >
            <Trash2 className="size-3.5 text-muted-foreground" />
          </Button>

          <div>
            <label className="text-sm font-medium">学校</label>
            <Input
              value={edu.school}
              onChange={(e) => updateEducation(edu.id, { school: e.target.value })}
              placeholder="学校名称"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">学位</label>
              <Input
                value={edu.degree}
                onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                placeholder="本科/硕士/博士"
              />
            </div>
            <div>
              <label className="text-sm font-medium">专业</label>
              <Input
                value={edu.field}
                onChange={(e) => updateEducation(edu.id, { field: e.target.value })}
                placeholder="计算机科学"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">开始日期</label>
              <Input
                value={edu.startDate}
                onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })}
                placeholder="2015-09"
              />
            </div>
            <div>
              <label className="text-sm font-medium">结束日期</label>
              <Input
                value={edu.endDate}
                onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })}
                placeholder="2019-06"
              />
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" className="w-full" onClick={addEducation}>
        <Plus className="size-4" />
        添加教育经历
      </Button>
    </div>
  )
}

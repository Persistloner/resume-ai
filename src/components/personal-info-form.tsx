"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useResumeStore } from "@/lib/store"

export function PersonalInfoForm() {
  const personalInfo = useResumeStore((s) => s.resume.personalInfo)
  const setPersonalInfo = useResumeStore((s) => s.setPersonalInfo)

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">姓名</label>
        <Input
          value={personalInfo.fullName}
          onChange={(e) => setPersonalInfo({ fullName: e.target.value })}
          placeholder="张三"
        />
      </div>

      <div>
        <label className="text-sm font-medium">职位</label>
        <Input
          value={personalInfo.title}
          onChange={(e) => setPersonalInfo({ title: e.target.value })}
          placeholder="高级前端工程师"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">邮箱</label>
          <Input
            value={personalInfo.email}
            onChange={(e) => setPersonalInfo({ email: e.target.value })}
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium">电话</label>
          <Input
            value={personalInfo.phone}
            onChange={(e) => setPersonalInfo({ phone: e.target.value })}
            placeholder="138-0000-1234"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">所在地</label>
        <Input
          value={personalInfo.location}
          onChange={(e) => setPersonalInfo({ location: e.target.value })}
          placeholder="北京"
        />
      </div>

      <div>
        <label className="text-sm font-medium">个人简介</label>
        <Textarea
          value={personalInfo.summary}
          onChange={(e) => setPersonalInfo({ summary: e.target.value })}
          placeholder="简短的自我介绍..."
          rows={4}
        />
      </div>
    </div>
  )
}

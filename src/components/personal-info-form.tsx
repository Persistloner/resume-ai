"use client"

import { useRef } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useResumeStore } from "@/lib/store"
import { Camera, X } from "lucide-react"

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp"
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export function PersonalInfoForm() {
  const personalInfo = useResumeStore((s) => s.resume.personalInfo)
  const setPersonalInfo = useResumeStore((s) => s.setPersonalInfo)
  const setPhoto = useResumeStore((s) => s.setPhoto)
  const setHidePhotoInExport = useResumeStore((s) => s.setHidePhotoInExport)
  const fileRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      alert("仅支持 JPG、PNG、WebP 格式")
      return
    }
    if (file.size > MAX_SIZE) {
      alert("照片大小不能超过 2MB")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPhoto(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Reset so re-selecting the same file triggers onChange
    if (fileRef.current) fileRef.current.value = ""
  }

  const handleRemovePhoto = () => {
    setPhoto("")
  }

  return (
    <div className="space-y-4">
      {/* ── Photo Upload ──────────────────────────────────── */}
      <div>
        <label className="text-sm font-medium">照片</label>
        <div className="mt-1.5 flex items-start gap-3">
          {/* Preview or placeholder */}
          {personalInfo.photo ? (
            <div className="relative shrink-0">
              <img
                src={personalInfo.photo}
                alt="简历照片"
                className="size-20 object-cover rounded-md border"
              />
              <button
                onClick={handleRemovePhoto}
                className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="shrink-0 size-20 border-2 border-dashed border-muted-foreground/30 rounded-md flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              <Camera className="size-5" />
              <span className="text-[10px]">上传照片</span>
            </button>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>支持 JPG、PNG、WebP，最大 2MB</p>
            {personalInfo.photo && (
              <Button
                variant="outline"
                size="xs"
                className="text-[10px] h-6"
                onClick={() => fileRef.current?.click()}
              >
                更换照片
              </Button>
            )}
            {/* ATS-friendly toggle */}
            <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={personalInfo.hidePhotoInExport}
                onChange={(e) => setHidePhotoInExport(e.target.checked)}
                className="size-3 rounded"
              />
              <span>ATS友好模式（导出时隐藏照片）</span>
            </label>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* ── Name ──────────────────────────────────────────── */}
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

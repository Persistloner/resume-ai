"use client"

import { useState } from "react"
import { useResumeStore } from "@/lib/store"
import { THEME_LIST, type ThemeId } from "@/lib/themes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Palette, Check, LayoutGrid, StretchHorizontal, Columns, PanelBottom } from "lucide-react"

function DensityIcon({ density }: { density: "compact" | "normal" | "spacious" }) {
  if (density === "compact")
    return <StretchHorizontal className="size-3 text-muted-foreground" />
  if (density === "spacious")
    return <PanelBottom className="size-3 text-muted-foreground" />
  return <Columns className="size-3 text-muted-foreground" />
}

function ThemePreviewCard({
  theme,
  isActive,
  onSelect,
}: {
  theme: (typeof THEME_LIST)[number]
  isActive: boolean
  onSelect: () => void
}) {
  const { headingColor, accentColor, borderColor, surfaceBg, textColor } = theme.preview

  return (
    <button
      onClick={onSelect}
      className={`relative w-full text-left rounded-lg border-2 p-3 transition-all hover:border-primary/50 ${
        isActive ? "border-primary bg-primary/5" : "border-border bg-background"
      }`}
    >
      {isActive && (
        <div className="absolute top-2 right-2 size-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="size-3 text-primary-foreground" />
        </div>
      )}

      {/* ── Visual preview: simulated resume snippet ──────── */}
      <div
        className="rounded-md p-2 mb-2.5 space-y-1.5"
        style={{
          backgroundColor:
            surfaceBg === "transparent" ? "#fafafa" : surfaceBg,
          border:
            theme.layoutMode === "card"
              ? `1px solid ${borderColor}`
              : "1px solid transparent",
          borderRadius: theme.layoutMode === "card" ? "4px" : "2px",
        }}
      >
        {/* Name bar */}
        <div
          className="h-2 rounded w-2/5"
          style={{ backgroundColor: headingColor }}
        />
        {/* Contact bar */}
        <div
          className="h-1 rounded w-3/5"
          style={{ backgroundColor: textColor, opacity: 0.5 }}
        />
        {/* Divider */}
        <div
          style={{
            height: theme.density === "compact" ? "1.5px" : "1px",
            backgroundColor: borderColor,
          }}
        />
        {/* Content lines */}
        <div className="space-y-1">
          <div
            className="h-1 rounded w-full"
            style={{
              backgroundColor: textColor,
              opacity: 0.25,
            }}
          />
          <div
            className="h-1 rounded w-4/5"
            style={{
              backgroundColor: textColor,
              opacity: 0.25,
            }}
          />
          {theme.density !== "compact" && (
            <div
              className="h-1 rounded w-3/5"
              style={{
                backgroundColor: textColor,
                opacity: 0.2,
              }}
            />
          )}
        </div>
        {/* Accent dot (Creative has visible accent) */}
        {theme.id === "creative" && (
          <div className="flex gap-1">
            <div
              className="size-1 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <div
              className="size-1 rounded-full"
              style={{ backgroundColor: accentColor, opacity: 0.5 }}
            />
          </div>
        )}
      </div>

      {/* ── Meta ──────────────────────────────────────────── */}
      <p className="text-sm font-semibold">{theme.name}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">
        {theme.description}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <DensityIcon density={theme.density} />
          {theme.density === "compact"
            ? "紧凑"
            : theme.density === "spacious"
              ? "宽松"
              : "适中"}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <LayoutGrid className="size-3" />
          {theme.layoutMode === "card" ? "卡片" : theme.layoutMode === "airy" ? "留白" : "经典"}
        </span>
      </div>
    </button>
  )
}

export function ThemeSwitcher() {
  const theme = useResumeStore((s) => s.theme)
  const templateId = useResumeStore((s) => s.templateId)
  const setTheme = useResumeStore((s) => s.setTheme)
  const setTemplateId = useResumeStore((s) => s.setTemplateId)
  const [open, setOpen] = useState(false)

  const currentTheme = THEME_LIST.find((t) => t.id === theme) ?? THEME_LIST[0]

  const handleSelect = (id: ThemeId) => {
    setTheme(id)
    setOpen(false)
  }

  const handleSelectSidebar = () => {
    setTemplateId("sidebar")
    setOpen(false)
  }

  const isSidebarActive = templateId === "sidebar"

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-xs h-8"
      >
        <Palette className="size-3.5" />
        <span className="hidden sm:inline text-muted-foreground">
          {isSidebarActive ? "左侧栏风" : currentTheme.name}
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>选择简历风格</DialogTitle>
            <DialogDescription>
              切换风格仅改变视觉呈现，不影响简历内容
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {THEME_LIST.map((t) => (
              <ThemePreviewCard
                key={t.id}
                theme={t}
                isActive={!isSidebarActive && theme === t.id}
                onSelect={() => handleSelect(t.id)}
              />
            ))}
            {/* Sidebar template — Phase 2 new layout */}
            <button
              onClick={handleSelectSidebar}
              className={`relative w-full text-left rounded-lg border-2 p-3 transition-all hover:border-primary/50 ${
                isSidebarActive ? "border-primary bg-primary/5" : "border-border bg-background"
              }`}
            >
              {isSidebarActive && (
                <div className="absolute top-2 right-2 size-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="size-3 text-primary-foreground" />
                </div>
              )}
              <div className="rounded-md p-2 mb-2.5 space-y-1.5 bg-slate-800">
                <div className="flex gap-1.5">
                  <div className="w-2/5 bg-slate-600 rounded" style={{ height: "28px" }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2 rounded w-3/5" style={{ backgroundColor: "#e2e8f0" }} />
                    <div className="h-1 rounded w-4/5" style={{ backgroundColor: "#94a3b8", opacity: 0.5 }} />
                    <div className="h-1 rounded w-full" style={{ backgroundColor: "#64748b", opacity: 0.3 }} />
                    <div className="h-1 rounded w-2/3" style={{ backgroundColor: "#64748b", opacity: 0.3 }} />
                  </div>
                </div>
              </div>
              <p className="text-sm font-semibold">左侧栏风</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">左深色栏 + 右正文</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <LayoutGrid className="size-3" />
                  双栏
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Palette className="size-3" />
                  视觉突出
                </span>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

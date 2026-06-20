# Resume Template System — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract current ResumePreview layout into ClassicTemplate component, refactor ResumePreview to thin wrapper, add templateId to store alongside theme — with zero visual or behavioral regression.

**Architecture:** ClassicTemplate is a pure presentational component receiving `resume` + `showOptimized` as props. ResumePreview becomes a thin controller that handles zoom, toggle, data loading, and delegates rendering to the selected template. Store gains `templateId` field; old `theme` field preserved for CSS compatibility. `data-theme` stays on the DOM so existing `[data-theme]` CSS continues working.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS v4, Next.js 16.2 (Turbopack)

---

## File Change Summary

| Action | File | Description |
|--------|------|-------------|
| Create | `src/lib/templates.ts` | TemplateId type, TemplateMeta, migration mapping |
| Create | `src/components/templates/classic-template.tsx` | Extracted layout from ResumePreview |
| Modify | `src/lib/store.ts` | Add `templateId` + `setTemplateId`, keep `theme` |
| Modify | `src/components/resume-preview.tsx` | Refactor to thin wrapper |
| Backup | `src/components/resume-preview.tsx` → `resume-preview.backup.tsx` | Safety net |

---

### Task 1: Create safety backup of ResumePreview

**Files:**
- Copy: `src/components/resume-preview.tsx` → `src/components/resume-preview.backup.tsx`

- [ ] **Step 1: Copy ResumePreview to backup**

```bash
cp src/components/resume-preview.tsx src/components/resume-preview.backup.tsx
```

---

### Task 2: Create templates.ts with type definitions

**Files:**
- Create: `src/lib/templates.ts`

- [ ] **Step 1: Write templates.ts**

```typescript
export type TemplateId = "classic" | "sidebar" | "business" | "tech" | "elegant" | "creative" | "ats"

export interface TemplateMeta {
  id: TemplateId
  name: string
  description: string
  suitableRoles: string
  tags: string[]
  thumbnail: {
    headerColor: string
    accentColor: string
    bgColor: string
    layout: "single" | "sidebar" | "centered" | "modern"
  }
}

export const TEMPLATES: Record<TemplateId, TemplateMeta> = {
  classic: {
    id: "classic",
    name: "经典黑白风",
    description: "单栏黑白布局，信息密度高，适合通用岗位",
    suitableRoles: "通用 / AI产品 / 运营 / 实习",
    tags: ["单栏", "黑白", "ATS友好"],
    thumbnail: {
      headerColor: "#374151",
      accentColor: "#6b7280",
      bgColor: "#ffffff",
      layout: "single",
    },
  },
  sidebar: {
    id: "sidebar",
    name: "左侧栏风",
    description: "左深色栏 + 右正文，视觉差异明显",
    suitableRoles: "销售 / 运营 / 市场 / 应届生",
    tags: ["双栏", "照片", "视觉突出"],
    thumbnail: {
      headerColor: "#1e293b",
      accentColor: "#3b82f6",
      bgColor: "#f8fafc",
      layout: "sidebar",
    },
  },
  business: {
    id: "business",
    name: "商务风",
    description: "顶部姓名居中，字体稳重，内容紧凑",
    suitableRoles: "金融 / 咨询 / 管培 / 企业",
    tags: ["稳重", "紧凑", "专业"],
    thumbnail: {
      headerColor: "#1a1a1a",
      accentColor: "#2c2c2c",
      bgColor: "#ffffff",
      layout: "centered",
    },
  },
  tech: {
    id: "tech",
    name: "科技风",
    description: "蓝色强调色，卡片式分区，技能标签化",
    suitableRoles: "AI产品 / 数据 / 开发 / 技术运营",
    tags: ["标签", "蓝色", "项目突出"],
    thumbnail: {
      headerColor: "#1e3a5f",
      accentColor: "#2563eb",
      bgColor: "#f8fafc",
      layout: "modern",
    },
  },
  elegant: {
    id: "elegant",
    name: "优雅风",
    description: "留白更多，字体更轻，排版干净（Phase 2）",
    suitableRoles: "外企 / 翻译 / 内容 / 品牌",
    tags: ["留白", "轻字重", "干净"],
    thumbnail: {
      headerColor: "#6b7280",
      accentColor: "#9ca3af",
      bgColor: "#ffffff",
      layout: "single",
    },
  },
  creative: {
    id: "creative",
    name: "创意风",
    description: "轻微色块，卡片式分区，头像更突出（Phase 2）",
    suitableRoles: "设计 / 内容 / 市场 / 新媒体",
    tags: ["色块", "卡片", "头像"],
    thumbnail: {
      headerColor: "#7c3aed",
      accentColor: "#db2777",
      bgColor: "#faf5ff",
      layout: "single",
    },
  },
  ats: {
    id: "ats",
    name: "ATS友好",
    description: "纯文本结构，无照片无图标，机器解析最优（Phase 2）",
    suitableRoles: "网申 / 系统筛选",
    tags: ["无照片", "纯文本", "机器友好"],
    thumbnail: {
      headerColor: "#111827",
      accentColor: "#374151",
      bgColor: "#ffffff",
      layout: "single",
    },
  },
}

export const PHASE1_TEMPLATES: TemplateId[] = ["classic", "sidebar", "business", "tech"]

export const DEFAULT_TEMPLATE_ID: TemplateId = "classic"

/**
 * Maps old ThemeId to new TemplateId during migration.
 * Used as fallback when templateId is not yet set.
 */
import type { ThemeId } from "./themes"
export const THEME_TO_TEMPLATE: Record<ThemeId, TemplateId> = {
  minimal: "classic",
  business: "business",
  tech: "tech",
  creative: "creative",
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/templates.ts
git commit -m "feat: add templates.ts with TemplateId type, metadata, and migration mapping"
```

---

### Task 3: Add templateId to store alongside theme

**Files:**
- Modify: `src/lib/store.ts:1-10`

- [ ] **Step 1: Add import for templates**

In `src/lib/store.ts`, add after the existing imports (line 4-6):

```typescript
import type { TemplateId } from "./templates"
import { DEFAULT_TEMPLATE_ID } from "./templates"
```

- [ ] **Step 2: Add templateId field and setTemplateId action to ResumeStore interface**

In `src/lib/store.ts`, add after the theme section (after line 23):

```typescript
  // Template (new system — coexists with theme during migration)
  templateId: TemplateId
  setTemplateId: (id: TemplateId) => void
```

- [ ] **Step 3: Add templateId initial value and setTemplateId implementation**

In `src/lib/store.ts`, add after `setTheme` implementation (after line 205):

```typescript
  // Template (new system)
  templateId: DEFAULT_TEMPLATE_ID,
  setTemplateId: (id) => set({ templateId: id }),
```

- [ ] **Step 4: Verify the store compiles**

Run: `npx tsc --noEmit src/lib/store.ts 2>&1 | head -20`

Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/store.ts
git commit -m "feat: add templateId field to store alongside theme"
```

---

### Task 4: Create ClassicTemplate component

**Files:**
- Create: `src/components/templates/classic-template.tsx`

ClassicTemplate is the exact render output from the current ResumePreview, extracted into its own component. It receives `resume` and `showOptimized` as props. All internal sub-components (SectionHeading, ItemDate, ItemHeading, ItemContent, SkillPreviewItem, AbilityCardItem) are kept inside this file for now — extraction to shared/ happens later when other templates need them.

- [ ] **Step 1: Create directory**

```bash
mkdir -p src/components/templates
```

- [ ] **Step 2: Write classic-template.tsx**

```typescript
"use client"

import { Mail, Phone, MapPin } from "lucide-react"
import { safeDisplayText } from "@/lib/safe-display-text"
import { SemanticParagraph } from "@/components/semantic-paragraph"
import type { Resume, Skill, AbilityCard } from "@/lib/types"

// ═══════════════════════════════════════════════════════════
// Template Props
// ═══════════════════════════════════════════════════════════

export interface ClassicTemplateProps {
  resume: Resume
  showOptimized: boolean
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function displayText(desc: string, optimized: string, showOptimized: boolean): string {
  if (!showOptimized) return safeDisplayText(desc)
  return safeDisplayText(optimized) || safeDisplayText(desc)
}

// ═══════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="resume-section-heading">{children}</h2>
}

function ItemDate({ children }: { children: React.ReactNode }) {
  return <span className="resume-item-date">{children}</span>
}

function ItemHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="font-bold"
      style={{
        fontSize: "var(--resume-item-heading-size)",
        fontWeight: "var(--resume-item-heading-weight)",
        color: "var(--resume-subheading-color)",
      }}
    >
      {children}
    </h3>
  )
}

function ItemContent({ text }: { text: string }) {
  return (
    <div className="resume-item-content text-justify mt-0">
      <SemanticParagraph
        text={text}
        sizeClass="text-[var(--resume-body-size)]"
      />
    </div>
  )
}

function SkillPreviewItem({
  skill,
  showOptimized,
  skillIndex,
}: {
  skill: Skill
  showOptimized: boolean
  skillIndex: number
}) {
  const primaryText = displayText(skill.description, skill.optimizedDescription, showOptimized)
  const hasCards = showOptimized && skill.abilityCards && skill.abilityCards.length > 0

  return (
    <div className="resume-skill-card" data-skill-id={skill.id} data-skill-index={skillIndex}>
      <h3
        className="font-bold"
        style={{
          fontSize: "var(--resume-item-heading-size)",
          fontWeight: "var(--resume-item-heading-weight)",
          color: "var(--resume-subheading-color)",
        }}
      >
        {skill.title}
      </h3>

      {primaryText && (
        <div className="resume-item-content text-justify mt-0">
          <SemanticParagraph
            text={primaryText}
            sizeClass="text-[var(--resume-body-size)]"
          />
        </div>
      )}

      {hasCards && (
        <div className="resume-ability-cards space-y-1.5">
          {skill.abilityCards!.map((card) => (
            <AbilityCardItem key={card.title} card={card} />
          ))}
        </div>
      )}
    </div>
  )
}

function AbilityCardItem({ card }: { card: AbilityCard }) {
  return (
    <div>
      <h4
        className="font-semibold leading-relaxed"
        style={{
          fontSize: "calc(var(--resume-body-size) * 0.85)",
          color: "var(--resume-text-color)",
        }}
      >
        {card.title}
      </h4>
      <p
        className="leading-relaxed mt-0 font-medium"
        style={{
          fontSize: "calc(var(--resume-body-size) * 0.8)",
          color: "var(--resume-text-color)",
        }}
      >
        {card.realExperience}
      </p>
      <p
        className="leading-relaxed mt-0 font-medium"
        style={{
          fontSize: "calc(var(--resume-body-size) * 0.8)",
          color: "var(--resume-text-color)",
        }}
      >
        {card.abilityExtraction}
      </p>
      <p
        className="leading-relaxed mt-0 font-medium"
        style={{
          fontSize: "calc(var(--resume-body-size) * 0.8)",
          color: "var(--resume-muted-color)",
        }}
      >
        {card.jdMigration}
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Template Component
// ═══════════════════════════════════════════════════════════

export function ClassicTemplate({ resume, showOptimized }: ClassicTemplateProps) {
  const { personalInfo, workExperience, projectExperience, education, skills } = resume

  return (
    <>
      {/* ── Header ──────────────────────────────────────── */}
      <div data-preview-anchor="preview-personal" className="resume-header">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="resume-name">
              {personalInfo.fullName || "姓名"}
            </h1>
            <p className="resume-title mt-0">
              {personalInfo.title || "职位"}
            </p>
            <div className="flex flex-wrap items-center resume-contact mt-1.5 font-medium">
              {personalInfo.email && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3 shrink-0" /> {personalInfo.email}
                </span>
              )}
              {personalInfo.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="size-3 shrink-0" /> {personalInfo.phone}
                </span>
              )}
              {personalInfo.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3 shrink-0" /> {personalInfo.location}
                </span>
              )}
            </div>
          </div>
          {personalInfo.photo && (
            <img
              src={personalInfo.photo}
              alt="简历照片"
              className="resume-photo object-cover rounded border shrink-0 ml-3"
            />
          )}
        </div>
      </div>

      {/* ── Summary ─────────────────────────────────────── */}
      {personalInfo.summary && (
        <div data-preview-anchor="preview-summary" className="resume-section">
          <SectionHeading>个人简介</SectionHeading>
          <ItemContent text={personalInfo.summary} />
        </div>
      )}

      {/* ── Work Experience ─────────────────────────────── */}
      {workExperience.length > 0 && (
        <div data-preview-anchor="preview-work" className="resume-section">
          <SectionHeading>工作经历</SectionHeading>
          {workExperience.map((exp) => {
            const text = displayText(exp.description, exp.optimizedDescription, showOptimized)
            return (
              <div key={exp.id} className="resume-item">
                <div className="flex justify-between items-baseline gap-2">
                  <div className="flex-1 min-w-0">
                    <ItemHeading>
                      {exp.company || "公司名称"}
                      {exp.role ? ` — ${exp.role}` : ""}
                    </ItemHeading>
                  </div>
                  <ItemDate>
                    {exp.startDate} — {exp.current ? "至今" : exp.endDate}
                  </ItemDate>
                </div>
                {text && <ItemContent text={text} />}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Project Experience ──────────────────────────── */}
      {projectExperience.length > 0 && (
        <div data-preview-anchor="preview-project" className="resume-section">
          <SectionHeading>项目经历</SectionHeading>
          {projectExperience.map((proj) => {
            const text = displayText(proj.description, proj.optimizedDescription, showOptimized)
            return (
              <div key={proj.id} className="resume-item">
                <div className="flex justify-between items-baseline gap-2">
                  <div className="flex-1 min-w-0">
                    <ItemHeading>
                      {proj.name || "项目名称"}
                      {proj.role ? ` — ${proj.role}` : ""}
                    </ItemHeading>
                  </div>
                  <ItemDate>{proj.duration}</ItemDate>
                </div>
                {text && <ItemContent text={text} />}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Education ───────────────────────────────────── */}
      {education.length > 0 && (
        <div data-preview-anchor="preview-education" className="resume-section">
          <SectionHeading>教育背景</SectionHeading>
          {education.map((edu) => (
            <div key={edu.id} className="resume-item">
              <div className="flex justify-between items-baseline gap-2">
                <div className="flex-1 min-w-0">
                  <ItemHeading>{edu.school || "学校名称"}</ItemHeading>
                </div>
                <ItemDate>
                  {edu.startDate} — {edu.endDate}
                </ItemDate>
              </div>
              <p className="resume-edu-detail font-medium text-justify mt-0">
                {edu.degree} {edu.field && `· ${edu.field}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Skills ──────────────────────────────────────── */}
      {skills.length > 0 && (
        <div data-preview-anchor="preview-skills" className="resume-section">
          <SectionHeading>专业技能</SectionHeading>
          <div className="space-y-1.5">
            {skills.map((skill, idx) => (
              <SkillPreviewItem
                key={skill.id}
                skill={skill}
                showOptimized={showOptimized}
                skillIndex={idx}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/templates/classic-template.tsx
git commit -m "feat: create ClassicTemplate — extracted layout from ResumePreview"
```

---

### Task 5: Refactor ResumePreview to thin wrapper

**Files:**
- Modify: `src/components/resume-preview.tsx`

Remove all internal rendering components and delegate to `<ClassicTemplate>`. Keep: zoom logic, overflow warning, optimized/original toggle, store reading, container with `id="resume-preview"` and `data-theme`.

- [ ] **Step 1: Replace resume-preview.tsx content**

```typescript
"use client"

import { useState, useEffect, useMemo } from "react"
import { useResumeStore } from "@/lib/store"
import { Eye, EyeOff } from "lucide-react"
import { ClassicTemplate } from "@/components/templates/classic-template"
import type { TemplateId } from "@/lib/templates"
import { THEME_TO_TEMPLATE } from "@/lib/templates"
import type { ThemeId } from "@/lib/themes"

function getEffectiveTemplateId(theme: ThemeId, templateId: TemplateId): TemplateId {
  if (templateId) return templateId
  return THEME_TO_TEMPLATE[theme] ?? "classic"
}

export function ResumePreview() {
  const resume = useResumeStore((s) => s.resume)
  const theme = useResumeStore((s) => s.theme)
  const templateId = useResumeStore((s) => s.templateId)
  const { skills, workExperience, projectExperience } = resume
  const [previewMode, setPreviewMode] = useState<"positioned" | "original">("positioned")
  const showOptimized = previewMode === "positioned"

  const effectiveTemplateId = getEffectiveTemplateId(theme, templateId)

  // Verify skills don't share object references
  useEffect(() => {
    if (skills.length < 2) return
    for (let i = 0; i < skills.length; i++) {
      for (let j = i + 1; j < skills.length; j++) {
        if (skills[i] === skills[j]) {
          console.error(
            `[ResumePreview] SHARED REFERENCE: skills[${i}] and skills[${j}] are the SAME object`
          )
        }
      }
    }
  }, [skills])

  useEffect(() => {
    const optimized = skills.filter(
      (s) => s.optimizedDescription && s.optimizedDescription.length > 0
    )
    for (let i = 0; i < optimized.length; i++) {
      for (let j = i + 1; j < optimized.length; j++) {
        if (optimized[i].optimizedDescription === optimized[j].optimizedDescription) {
          console.error(
            `[ResumePreview] CONTENT DUPLICATION: "${optimized[i].title}" and "${optimized[j].title}"`
          )
        }
      }
    }
  }, [skills])

  // Auto-zoom to fit one A4 page
  const [zoom, setZoom] = useState(1)
  const [overflow, setOverflow] = useState(false)

  useEffect(() => {
    setZoom(1)
    setOverflow(false)
  }, [resume, previewMode])

  useEffect(() => {
    const el = document.getElementById("resume-preview")
    if (!el) return

    const A4_H = 297 * 3.7795
    const MIN_ZOOM = 10 / 13

    const timer = setTimeout(() => {
      const trueH = el.scrollHeight / zoom
      if (trueH <= A4_H) return

      const needed = A4_H / trueH
      const newZoom = Math.max(needed, MIN_ZOOM)

      if (Math.abs(newZoom - zoom) > 0.001) {
        setZoom(newZoom)
        setOverflow(needed < MIN_ZOOM)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [zoom, resume, previewMode])

  const hasAnyOptimized = useMemo(
    () =>
      workExperience.some((e) => e.optimizedDescription) ||
      projectExperience.some((p) => p.optimizedDescription) ||
      skills.some((s) => s.optimizedDescription),
    [workExperience, projectExperience, skills]
  )

  return (
    <div className="space-y-3">
      {overflow && (
        <div className="sticky top-0 z-50 flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 rounded-md px-3 py-2 text-[12px] font-medium shadow-sm">
          <span className="text-amber-500 text-base font-bold">!</span>
          简历内容较多，建议精简部分描述以获得最佳排版效果
        </div>
      )}

      {hasAnyOptimized && (
        <div className="flex items-center justify-end">
          <button
            onClick={() =>
              setPreviewMode((m) => (m === "positioned" ? "original" : "positioned"))
            }
            className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-md border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {previewMode === "positioned" ? (
              <>
                <EyeOff className="size-3" /> 查看原始描述
              </>
            ) : (
              <>
                <Eye className="size-3" /> 查看 AI 优化
              </>
            )}
          </button>
        </div>
      )}

      <div
        id="resume-preview"
        data-theme={theme}
        data-template={effectiveTemplateId}
        className="bg-white shadow-xl w-[210mm] min-h-[297mm] text-sm leading-relaxed"
        style={{
          zoom,
          paddingLeft: "var(--resume-page-padding-x)",
          paddingRight: "var(--resume-page-padding-x)",
          paddingTop: "var(--resume-page-padding-y)",
          paddingBottom: "var(--resume-page-padding-y)",
        }}
      >
        <ClassicTemplate resume={resume} showOptimized={showOptimized} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the page compiles with no type errors**

Run: `npx tsc --noEmit 2>&1 | head -30`

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/resume-preview.tsx
git commit -m "refactor: extract ClassicTemplate, ResumePreview becomes thin wrapper"
```

---

### Task 6: Verification — preview, PDF, photo, toggle, AI, import

- [ ] **Step 1: Start dev server and check preview**

Run: `npm run dev`
Then: Open http://localhost:3000/editor

Verify:
- [ ] Resume renders with mock data
- [ ] Name, title, contact info visible
- [ ] Photo visible (mock data has no photo — add one via editor to test)
- [ ] Work experience renders with dates
- [ ] Project experience renders
- [ ] Education renders
- [ ] Skills render
- [ ] Visual appearance matches pre-refactor exactly

- [ ] **Step 2: Test optimized/original toggle**

Click the "查看原始描述" / "查看 AI 优化" toggle button.
Verify:
- [ ] Toggle switches between original and optimized text
- [ ] No content loss on toggle
- [ ] Visual layout unchanged during toggle

- [ ] **Step 3: Test PDF export**

Click Export PDF button.
Verify:
- [ ] Popup opens
- [ ] Print dialog appears
- [ ] Preview in print dialog matches on-screen preview
- [ ] Save as PDF produces correct output

- [ ] **Step 4: Test editing flow**

Add a work experience entry in the left panel.
Verify:
- [ ] Entry appears in preview immediately
- [ ] Edit fields update preview in real-time
- [ ] Delete removes entry from preview

- [ ] **Step 5: Test template switching**

The old ThemeSwitcher still uses `setTheme()` which maps to `[data-theme]` CSS.
Change theme via switcher.
Verify:
- [ ] Theme changes visually (color/spacing change via CSS vars)
- [ ] Content is preserved
- [ ] ClassicTemplate still renders correctly

- [ ] **Step 6: Final commit for Phase 1**

```bash
git add -A
git commit -m "chore: Phase 1 verification complete — ClassicTemplate working, zero regressions"
```

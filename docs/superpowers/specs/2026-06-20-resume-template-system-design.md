# Resume Template System — Design Spec

**Date**: 2026-06-20
**Status**: Approved

## Problem

The current resume template system uses the same DOM structure for all templates,
differing only in CSS custom properties (colors, spacing, borders). Users
perceive templates as "the same layout with different colors" rather than
genuinely different resume styles.

## Goal

Build a true multi-layout template system. Switching templates changes DOM
structure, section ordering, photo placement, column layout, and visual
identity — not just color variables.

## Architecture

### Pattern: Independent Template Components

`ResumePreview` becomes a thin controller wrapper. Each template is a
self-contained presentational component that receives resume data as props
and returns its own DOM structure.

```
ResumePreview (controller)
  ├── auto-zoom / A4 fit
  ├── optimized/original toggle
  ├── data-template attribute
  └── delegates rendering to:
      ├── ClassicTemplate
      ├── SidebarTemplate
      ├── BusinessTemplate
      └── TechTemplate
```

### Props Interface

```typescript
interface TemplateProps {
  resume: Resume
  showOptimized: boolean
}
```

Templates are pure presentational components — no store access, no side effects.

### File Structure

```
src/
  components/
    templates/
      classic-template.tsx
      sidebar-template.tsx
      business-template.tsx
      tech-template.tsx
      shared/
        section-heading.tsx
        date-badge.tsx
        skill-tag.tsx
        photo-display.tsx
        contact-row.tsx
        divider.tsx
    resume-preview.tsx          (refactored)
    template-selector-dialog.tsx (upgraded)
    template-preview-card.tsx
  lib/
    templates.ts                 (replaces themes.ts)
    store.ts                     (add templateId, keep theme)
```

### Styling Approach (Hybrid)

- **Shared design tokens** via CSS custom properties on `[data-template]` —
  fonts, spacing scale, core colors
- **Layout/structure** via Tailwind CSS directly in each template component
- Each template scopes its own visual identity

### Template Layout Identities (Phase 1)

| Template  | Layout             | Photo Position       | Skills        | Key Visual                     |
|-----------|--------------------|----------------------|---------------|--------------------------------|
| Classic   | Single column      | Inline, small        | List, accent  | Horizontal dividers, B&W       |
| Sidebar   | Left 30% + right   | Top of sidebar       | Sidebar list  | Dark sidebar, two-column       |
| Business  | Single col, center | Left of name, mod    | Compact list  | Thick divider, serif feel      |
| Tech      | Single col, modern | Top-right, optional  | Colorful tags | Blue accent, card sections     |

### Data Flow

```
Store (resume, templateId, showOptimized)
  ↓
ResumePreview reads store
  ↓
ResumePreview passes resume + showOptimized as props
  ↓
Selected template renders layout
```

Template switching only changes the rendered component — resume data is
never mutated.

---

## Detailed Phase Breakdown

### Phase 1: ClassicTemplate Extraction (safety baseline)

**Goal**: Extract current ResumePreview render output into ClassicTemplate with
zero visual or behavioral change. This proves the template component pattern
works and establishes the safety baseline for all future templates.

**Entry criteria**:
- Current system works: preview renders, PDF exports, photo displays, toggle switches

**Steps**:
1. Read current `resume-preview.tsx` — capture exact DOM structure, class names, inline styles
2. Create `src/components/templates/classic-template.tsx`
3. Move the render output (header, summary, work, projects, education, skills) into ClassicTemplate
4. Extract shared sub-components to `templates/shared/` only if used by ClassicTemplate
5. Refactor `ResumePreview` to render `<ClassicTemplate resume={...} showOptimized={...} />`
6. Keep zoom logic, toggle, and `data-theme` / `data-template` attribute in ResumePreview wrapper
7. Add `templateId` field to store alongside `theme`

**Exit criteria (ALL must pass)**:
- [ ] Preview renders identically to before
- [ ] PDF export produces identical output
- [ ] Photo displays in same position and size
- [ ] Optimized/original toggle works
- [ ] AI optimization flow works end-to-end
- [ ] Content editing in left panel reflects in preview
- [ ] Import resume flow works
- [ ] `data-theme="minimal"` maps to `templateId="classic"` in the fallback

**Verification method**: Side-by-side visual comparison of current vs. refactored.
Take a screenshot of current; take a screenshot after refactoring; compare.

---

### Phase 2: SidebarTemplate

**Goal**: Build the first multi-column template — left dark sidebar + right main content.

**Entry criteria**: Phase 1 exit criteria all pass.

**Steps**:
1. Create `sidebar-template.tsx`
2. Layout: left 30% (dark bg, photo, contact, skills, certifications) + right 70% (name, title, summary, work, projects, education)
3. Photo: prominent at top of sidebar, circular or rounded
4. Skills: compact list in sidebar
5. Work/Education: timeline-style in right column
6. Add `"sidebar"` to TemplateId union in `templates.ts`
7. Wire into ResumePreview switch

**Exit criteria**:
- [ ] Sidebar layout renders correctly with sample data
- [ ] PDF export renders the two-column layout
- [ ] Switching classic ↔ sidebar preserves all content
- [ ] Photo renders in sidebar position
- [ ] No horizontal overflow on A4 width
- [ ] Zoom auto-fit works with two-column layout
- [ ] All existing features unaffected (editing, AI, toggle, import)

---

### Phase 3: BusinessTemplate

**Goal**: Professional single-column layout with centered name, thick dividers, compact density.

**Entry criteria**: Phase 2 exit criteria all pass.

**Steps**:
1. Create `business-template.tsx`
2. Layout: single column, name centered at top, contact row below
3. Photo: left of name in header area, moderate size
4. Skills: compact horizontal list below summary
5. Dividers: thick (2px+) horizontal rules between sections
6. Typography: larger name, uppercase section headings, tighter leading
7. Add `"business"` to TemplateId union
8. Wire into ResumePreview switch

**Exit criteria**:
- [ ] Business layout renders correctly
- [ ] PDF export renders correctly
- [ ] Switching between all 3 templates preserves content
- [ ] Photo position correct
- [ ] Compact density looks professional, not cramped

---

### Phase 4: TechTemplate

**Goal**: Modern tech resume with blue accent, card-based sections, skill tags, project emphasis.

**Entry criteria**: Phase 3 exit criteria all pass.

**Steps**:
1. Create `tech-template.tsx`
2. Layout: single column, modern header with accent bar
3. Photo: top-right corner, optional
4. Skills: rendered as colored tag/badge chips
5. Sections: card-style with subtle background and border
6. Project experience: given visual prominence (larger cards, accent border)
7. Blue accent: headings, icons, skill tags, dividers
8. Add `"tech"` to TemplateId union
9. Wire into ResumePreview switch

**Exit criteria**:
- [ ] Tech layout renders correctly
- [ ] PDF export renders correctly
- [ ] Switching between all 4 templates preserves content
- [ ] Skill tags render as styled chips
- [ ] Card sections have correct background/border
- [ ] Blue accent consistent throughout

---

### Phase 5: Template Selector Dialog

**Goal**: Users can see template differences instantly before switching.

**Entry criteria**: Phase 4 exit criteria all pass.

**Steps**:
1. Create `template-preview-card.tsx` — individual card component
2. Upgrade `template-selector-dialog.tsx` — grid of cards
3. Each card shows: CSS-drawn static thumbnail, name, suitable roles, feature tags
4. Active template highlighted with accent border + checkmark
5. Selection calls `setTemplateId()` in store
6. Remove or repurpose old `theme-switcher.tsx`

**Exit criteria**:
- [ ] Dialog opens with all 4 template cards
- [ ] Each card shows visually distinct thumbnail
- [ ] Suitable roles displayed per template
- [ ] Feature tags displayed per template
- [ ] Active template clearly indicated
- [ ] Clicking a card switches template immediately
- [ ] Dialog closes on selection

---

### Phase 6: Integration Verification & Cleanup

**Goal**: Full system verification. Remove old theme field if safe.

**Entry criteria**: Phase 5 exit criteria all pass.

**Steps**:
1. Full test matrix: all 4 templates × (preview, PDF, photo, toggle, AI, import, edit)
2. Content preservation test: switch templates, verify all fields intact
3. Remove `theme` field and `themes.ts`
4. Remove old CSS `[data-theme]` blocks from globals.css (keep shared tokens)
5. Remove old `theme-switcher.tsx`
6. Final commit

**Exit criteria**:
- [ ] All 4 × 7 test matrix passes
- [ ] Content preserved across all template switches
- [ ] Old theme system fully removed
- [ ] No dead code remaining

---

## File Change Matrix

### New Files (10)

| File | Purpose | Phase |
|------|---------|-------|
| `src/components/templates/classic-template.tsx` | Classic single-column template | 1 |
| `src/components/templates/sidebar-template.tsx` | Left sidebar + right main template | 2 |
| `src/components/templates/business-template.tsx` | Professional centered-name template | 3 |
| `src/components/templates/tech-template.tsx` | Blue accent card-based template | 4 |
| `src/components/templates/shared/section-heading.tsx` | Reusable section heading | 1 |
| `src/components/templates/shared/date-badge.tsx` | Date range display | 1 |
| `src/components/templates/shared/skill-tag.tsx` | Skill chip/tag | 4 |
| `src/components/templates/shared/photo-display.tsx` | Conditional photo rendering | 1 |
| `src/components/templates/shared/contact-row.tsx` | Email/phone/location row | 1 |
| `src/components/templates/shared/divider.tsx` | Horizontal divider variants | 1 |
| `src/lib/templates.ts` | Template definitions, TemplateId type | 1 |
| `src/components/template-preview-card.tsx` | Template card for dialog | 5 |
| `src/components/template-selector-dialog.tsx` | Upgraded template selection dialog | 5 |

### Modified Files (4)

| File | Change | Phase |
|------|--------|-------|
| `src/components/resume-preview.tsx` | Refactor to thin wrapper; delegate to templates | 1 |
| `src/lib/store.ts` | Add `templateId` field + `setTemplateId()` action | 1 |
| `src/app/editor/page.tsx` | Wire new template selector, keep old theme fallback | 1 |
| `src/app/globals.css` | Add `[data-template]` shared tokens; keep `[data-theme]` temporarily | 1–6 |

### Deferred Deletion (Phase 6, after verification)

| File | Reason |
|------|--------|
| `src/lib/themes.ts` | Replaced by `templates.ts` |
| `src/components/theme-switcher.tsx` | Replaced by `template-selector-dialog.tsx` |
| `[data-theme]` CSS blocks in globals.css | Replaced by `[data-template]` + per-template styling |

---

## Exact Migration Mapping

### Old ThemeId → New TemplateId

| Old `theme` | New `templateId` | Notes |
|------------|-----------------|-------|
| `"minimal"` | `"classic"` | Direct mapping — same visual identity |
| `"business"` | `"business"` | Same ID, upgraded layout |
| `"tech"` | `"tech"` | Same ID, upgraded layout |
| `"creative"` | `"creative"` | Reserved for Phase 2 |

### Transition Logic

```typescript
// In ResumePreview or store
function getEffectiveTemplateId(theme?: ThemeId, templateId?: TemplateId): TemplateId {
  if (templateId) return templateId
  // Fallback: map old theme to new template
  const mapping: Record<ThemeId, TemplateId> = {
    minimal: "classic",
    business: "business",
    tech: "tech",
    creative: "creative",
  }
  return mapping[theme ?? "minimal"]
}
```

### Removal Timeline

1. Phases 1–5: both `theme` and `templateId` coexist
2. Phase 6: after full verification, remove `theme` field, `ThemeId` type, and `themes.ts`
3. The fallback mapping exists only during transition — no permanent legacy code

---

## Risk Analysis & Rollback Strategy

### Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PDF export breaks with new DOM | Medium | High | Test PDF after every template; popup-based export is DOM-agnostic as long as `data-template` attribute is preserved |
| Content appears lost on switch | Low | Critical | Templates read-only from props; store never mutated on switch; verify after each phase |
| Zoom auto-fit miscalculates for multi-column | Medium | Medium | Test with different content lengths; sidebar template is the riskiest — test first |
| CSS conflicts between templates | Low | Medium | Each template scopes its own styles; shared tokens only for fonts/spacing |
| Old theme consumers break | Low | Low | Both fields coexist; fallback mapping handles old code |
| Photo rendering inconsistent | Low | Medium | Shared `PhotoDisplay` component used by all templates |

### Failure Scenarios & Recovery

**Scenario 1: ClassicTemplate extraction changes visual output**

Rollback: Revert `resume-preview.tsx` to original. ClassicTemplate is new code —
if it's wrong, the wrapper can fall back to the old inline render until fixed.

**Scenario 2: Sidebar template two-column layout breaks PDF**

Rollback: Wrap SidebarTemplate rendering in a feature-guard. If PDF breaks,
disable sidebar template in production until fixed. Classic stays available.

**Scenario 3: Content field missing after template switch**

Recovery: Template switching only changes which component is rendered, not
store data. If a field is missing in preview, it's a template rendering bug,
not data loss. Fix the template component.

**Scenario 4: Auto-zoom over-scales multi-column layouts**

Rollback: The zoom logic in ResumePreview is unchanged. If a template causes
overflow, adjust the template's max-width or font sizes, not the zoom.

### Quick Revert Plan

To revert to the current system at any point before Phase 6:

1. Revert `resume-preview.tsx` to original (keep a backup copy)
2. Switch store back to reading `theme` instead of `templateId`
3. Revert `editor/page.tsx` to use old `ThemeSwitcher`
4. All new template files are additive — they can stay on disk unused

Revert cost: < 5 minutes, 3 files to revert.

### Safety Nets

- **Phase 1 backup**: Before refactoring, copy `resume-preview.tsx` to `resume-preview.backup.tsx`
- **Each template is additive**: New files only — no existing file is deleted until Phase 6
- **Two-field coexistence**: Old `theme` path works throughout transition
- **Git checkpoint after each phase**: Commit with verification notes

---

## PDF Export Compatibility Strategy

### How PDF Export Currently Works

1. `export-pdf.tsx` clones `#resume-preview` DOM element
2. Clones all `<style>` and `<link>` elements into popup
3. Opens popup, waits for images, calls `window.print()`
4. `data-theme` attribute is preserved in the clone

### Why It Stays Compatible

The new system uses the same mechanism:

1. `ResumePreview` wrapper maintains the `#resume-preview` ID on the outer container
2. The wrapper sets `data-template={templateId}` on the same container
3. Template components render *inside* `#resume-preview`
4. `export-pdf.tsx` clones `#resume-preview` → gets the full template DOM
5. All styles (Tailwind classes + CSS custom properties) are already in the document
6. `data-template` attribute is preserved in the clone, so CSS var scoping works

### Template-Specific Considerations

| Template | Risk | Mitigation |
|----------|------|------------|
| Classic | None | Same single-column DOM; identical to current |
| Sidebar | Two columns may overflow A4 | Use `max-width` constraints; test with long content |
| Business | Thick borders may not print | Use `print-color-adjust: exact` (already in globals.css) |
| Tech | Card backgrounds may not print | Card backgrounds use CSS vars with print-safe fallbacks |

### Verification Per Template

After each template is built, run this PDF checklist:
- [ ] Open print popup
- [ ] Popup content matches preview
- [ ] Print to PDF (save as file)
- [ ] Open PDF — layout intact, no overflow, no missing sections
- [ ] Photo renders in PDF if present
- [ ] Chinese text renders correctly

---

## Template Selector Specification

### Dialog Layout

```
┌──────────────────────────────────────────────┐
│  Choose Resume Template                   ✕  │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────┐  ┌──────────┐                 │
│  │ Thumbnail│  │ Thumbnail│                 │
│  │          │  │          │                 │
│  │ Classic  │  │ Sidebar  │                 │
│  │ 通用/实习 │  │ 运营/市场 │                 │
│  │ 单栏·黑白│  │ 双栏·照片 │                 │
│  └──────────┘  └──────────┘                 │
│                                              │
│  ┌──────────┐  ┌──────────┐                 │
│  │ Thumbnail│  │ Thumbnail│                 │
│  │          │  │          │                 │
│  │ Business │  │   Tech   │                 │
│  │ 金融/咨询 │  │ AI/技术  │                 │
│  │ 稳重·紧凑│  │ 标签·蓝色 │                 │
│  └──────────┘  └──────────┘                 │
│                                              │
└──────────────────────────────────────────────┘
```

### Card Structure

Each `TemplatePreviewCard` receives:

```typescript
interface TemplateCardProps {
  template: TemplateMeta
  isActive: boolean
  onSelect: (id: TemplateId) => void
}

interface TemplateMeta {
  id: TemplateId
  name: string              // "经典黑白风" / "左侧栏风" / "商务风" / "科技风"
  suitableRoles: string     // "通用岗位 / AI产品 / 运营 / 实习"
  tags: string[]            // ["单栏", "黑白", "ATS友好"]
  thumbnail: {
    headerColor: string     // Bar color for header area in thumbnail
    accentColor: string     // Accent dots/lines color
    bgColor: string         // Background color
    layout: "single" | "sidebar" | "centered" | "modern"
  }
}
```

### Static Thumbnail Strategy

Each card renders a CSS-drawn miniature resume preview (~120×160px):

- **Classic**: Single column, horizontal lines in gray, black header bar
- **Sidebar**: Left 30% dark rectangle + right 70% white with horizontal lines
- **Business**: Centered thick bar at top, thin lines below, compact spacing
- **Tech**: Blue accent bar at top, rounded rectangles for sections, small colored dots for tags

No images, no canvas — pure CSS rectangles and lines that evoke the layout
pattern. This is lightweight and instantly communicates structural differences.

### Template Card Metadata

| Template  | Name (CN)  | Suitable Roles                     | Tags                    |
|-----------|------------|------------------------------------|-------------------------|
| classic   | 经典黑白风  | 通用 / AI产品 / 运营 / 实习          | 单栏 · 黑白 · ATS友好    |
| sidebar   | 左侧栏风    | 销售 / 运营 / 市场 / 应届生          | 双栏 · 照片 · 视觉突出    |
| business  | 商务风      | 金融 / 咨询 / 管培 / 企业            | 稳重 · 紧凑 · 专业       |
| tech      | 科技风      | AI产品 / 数据 / 开发 / 技术运营       | 标签 · 蓝色 · 项目突出    |

---

## Hard Constraints

1. Template switching must not affect resume content
2. All templates must support photos (ATS is Phase 2 — hides by default)
3. All templates must support PDF export with consistent output
4. No content loss on template switch
5. No layout breakage on template switch
6. Existing features must not regress (editing, AI optimization, toggle, import, export)

## Rejected Alternatives

- **Layout Config + Generic Renderer**: Too constrained — would produce the same
  "different colors" problem at scale. Complex layouts like sidebar require
  fundamentally different DOM.
- **Slot System**: Over-engineered for 7 templates. Slot abstraction creates
  indirection without benefit when layouts diverge enough.

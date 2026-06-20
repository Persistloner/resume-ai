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

## Migration Plan

### Safe Two-Field Transition

1. Add `templateId: TemplateId` to store alongside existing `theme: ThemeId`
2. Both fields coexist; template selector writes to `templateId`
3. `ResumePreview` reads `templateId` first, falls back to mapping `theme` → `templateId`
4. After all templates stable and verified, remove `theme` field and `themes.ts`

### Phase 1: ClassicTemplate Extraction

1. Extract current `ResumePreview` render output into `ClassicTemplate`
2. `ResumePreview` renders `<ClassicTemplate>` internally
3. Verify: preview, PDF export, photo, toggle — all unchanged
4. This is the safety baseline

### Phase 2–4: Build Remaining Templates

One template at a time: build, verify preview, verify PDF, verify switching.

### Phase 5: Template Selector Dialog

Upgrade the dialog with:
- Template card grid
- Static thumbnail preview (CSS-drawn, not screenshots)
- Template name, suitable roles, feature tags
- Clear visual differentiation between templates

### Phase 6: Integration Verification

Full test: switch all templates, verify content preserved, PDF matches preview, no regressions.

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

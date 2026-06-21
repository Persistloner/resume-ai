export type ThemeId = "business" | "minimal" | "tech" | "creative"

export interface ThemeMeta {
  id: ThemeId
  name: string
  description: string
  /** Longer description of the visual style */
  styleNotes: string
  /** Density: compact | normal | spacious */
  density: "compact" | "normal" | "spacious"
  /** Layout mode: classic | card | airy */
  layoutMode: "classic" | "card" | "airy"
  preview: {
    headingColor: string
    accentColor: string
    borderColor: string
    surfaceBg: string
    textColor: string
  }
}

export const THEMES: Record<ThemeId, ThemeMeta> = {
  minimal: {
    id: "minimal",
    name: "简约风",
    description: "适合通用岗位",
    styleNotes: "大量留白、柔和灰色字体、清晰分区、轻薄边框",
    density: "normal",
    layoutMode: "airy",
    preview: {
      headingColor: "#374151",
      accentColor: "#6b7280",
      borderColor: "#e5e7eb",
      surfaceBg: "transparent",
      textColor: "#9ca3af",
    },
  },
  business: {
    id: "business",
    name: "商务风",
    description: "适合金融/咨询",
    styleNotes: "高对比度黑白灰、紧凑布局、强标题层级、粗边框",
    density: "compact",
    layoutMode: "classic",
    preview: {
      headingColor: "#1a1a1a",
      accentColor: "#2c2c2c",
      borderColor: "#333333",
      surfaceBg: "transparent",
      textColor: "#666666",
    },
  },
  tech: {
    id: "tech",
    name: "科技风",
    description: "适合工程师/AI",
    styleNotes: "蓝色强调色、卡片分区、现代感UI、模块化呈现",
    density: "normal",
    layoutMode: "card",
    preview: {
      headingColor: "#1e3a5f",
      accentColor: "#2563eb",
      borderColor: "#93c5fd",
      surfaceBg: "#f8fafc",
      textColor: "#64748b",
    },
  },
  creative: {
    id: "creative",
    name: "创意风",
    description: "适合设计/市场",
    styleNotes: "紫色标题、粉色点缀、章节强调线、大间距视觉呼吸",
    density: "spacious",
    layoutMode: "airy",
    preview: {
      headingColor: "#7c3aed",
      accentColor: "#db2777",
      borderColor: "#e9d5ff",
      surfaceBg: "transparent",
      textColor: "#a1a1aa",
    },
  },
}

export const DEFAULT_THEME: ThemeId = "minimal"

export const THEME_LIST: ThemeMeta[] = [
  THEMES.minimal,
  THEMES.business,
  THEMES.tech,
  THEMES.creative,
]

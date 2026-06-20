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

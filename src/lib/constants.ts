export const TASK_TYPES = {
  RESUME_PARSE: "resume_parse",
  JD_ANALYSIS: "jd_analysis",
  MATCH_ANALYSIS: "match_analysis",
  OPTIMIZE_WORK: "optimize_work",
  OPTIMIZE_PROJECT: "optimize_project",
  OPTIMIZE_SKILL: "optimize_skill",
} as const

export type TaskType = (typeof TASK_TYPES)[keyof typeof TASK_TYPES]

export const TASK_LABELS: Record<TaskType, string> = {
  resume_parse: "简历解析",
  jd_analysis: "JD分析",
  match_analysis: "匹配分析",
  optimize_work: "优化工作经历",
  optimize_project: "优化项目经历",
  optimize_skill: "优化技能",
}

export const FREE_QUOTA_DEFAULT = 3

export const SESSION_COOKIE = "rb_session"
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

export const RATE_LIMIT = {
  FREE: { maxRequests: 10, windowMs: 60_000 },
  USER_KEY: { maxRequests: 30, windowMs: 60_000 },
} as const

export const QUOTA_EXHAUSTED_CODE = "QUOTA_EXHAUSTED"

/**
 * AI Resume Optimization — Bad Output Examples
 *
 * A curated collection of erroneous outputs for regression testing.
 * Each entry captures WHAT went wrong and WHY.
 *
 * Used to:
 *  - Test that prompt changes don't reintroduce known failure modes
 *  - Train evaluators on what to flag
 *  - Build automated pattern-detection rules
 */

export interface BadOutputExample {
  id: string
  category: BadOutputCategory
  originalDescription: string
  targetJD: string
  badOutput: string
  whyBad: string[]
  whatShouldBe: string
}

export type BadOutputCategory =
  | "fabrication"       // 编造不存在的内容
  | "exaggeration"      // 夸大规模/级别
  | "buzzwords"         // 互联网黑话
  | "role-inflation"    // 岗位级别夸大
  | "data-fabrication"  // 编造数据
  | "template-speak"    // HR 模板化语言

export const badOutputExamples: BadOutputExample[] = [

  // ─── Category: Fabrication ────────────────────────────────────
  {
    id: "bad-01-fabrication",
    category: "fabrication",
    originalDescription: "负责公众号内容撰写与排版，每周发布3篇文章。",
    targetJD: "新媒体运营",
    badOutput: "主导公司新媒体内容策略规划，搭建内容矩阵体系，统筹选题策划与多平台分发。",
    whyBad: [
      "原文只是'撰写排版'，没有'策略规划'",
      "原文没有提到'内容矩阵'或'多平台'",
      "'主导'一词严重夸大了实际职责",
      "'统筹选题策划'完全编造",
    ],
    whatShouldBe: "负责公众号日常内容撰写与视觉排版，每周稳定产出3篇文章。",
  },

  // ─── Category: Exaggeration ───────────────────────────────────
  {
    id: "bad-02-exaggeration",
    category: "exaggeration",
    originalDescription: "协助主管整理部门考勤数据与办公物资领用记录。",
    targetJD: "",
    badOutput: "统筹管理部门行政事务，建立并优化考勤与物资管理体系，推动行政流程标准化。",
    whyBad: [
      "'协助'被夸大为'统筹管理'",
      "'整理记录'被夸大为'建立并优化管理体系'",
      "'行政流程标准化'完全编造",
      "单个执行工作被包装成了管理层面的职能",
    ],
    whatShouldBe: "负责部门考勤数据整理与办公物资领用记录维护，确保信息准确。",
  },

  // ─── Category: Buzzwords ──────────────────────────────────────
  {
    id: "bad-03-buzzwords",
    category: "buzzwords",
    originalDescription: "回复用户评论，整理用户反馈。",
    targetJD: "用户运营",
    badOutput: "通过用户反馈闭环持续沉淀用户洞察，赋能内容策略迭代，拉通用户诉求与产品优化链路。",
    whyBad: [
      "满屏互联网黑话：'闭环''沉淀''赋能''拉通''链路'",
      "原文只是简单的'回复评论+整理反馈'",
      "读起来像大厂周报模板，不像真实求职者",
      "没有任何具体内容，全是空洞术语",
    ],
    whatShouldBe: "每日回复用户评论并整理反馈要点，逐步积累了对用户关注点的理解。",
  },

  // ─── Category: Role Inflation ─────────────────────────────────
  {
    id: "bad-04-role-inflation",
    category: "role-inflation",
    originalDescription: "在餐厅兼职，负责点单、上菜、收银。",
    targetJD: "",
    badOutput: "负责餐厅运营管理，协调前厅服务流程，处理客户关系并推动服务体验优化。",
    whyBad: [
      "兼职被包装成管理岗",
      "'点单上菜'变成了'运营管理'和'协调流程'",
      "'推动服务体验优化'完全编造",
      "层次严重不匹配——从执行到管理的跨越是编造",
    ],
    whatShouldBe: "负责顾客点单、菜品送达及收银，日均接待约50位顾客。",
  },

  // ─── Category: Data Fabrication ───────────────────────────────
  {
    id: "bad-05-data-fabrication",
    category: "data-fabrication",
    originalDescription: "在社交平台发布产品推广内容。",
    targetJD: "市场推广",
    badOutput: "策划并执行社交媒体推广活动，实现粉丝增长35%、互动率提升28%，内容触达超10万用户。",
    whyBad: [
      "原文没有任何数据，所有数字都是编造的",
      "'35%''28%''10万'都是从训练数据中'借'来的典型数字",
      "'策划并执行'夸大了'发布内容'",
      "这是最危险的编造类型——数据看起来很真实",
    ],
    whatShouldBe: "负责产品推广内容的日常发布与维护。",
  },

  // ─── Category: Template Speak ─────────────────────────────────
  {
    id: "bad-06-template-speak",
    category: "template-speak",
    originalDescription: "在学生会负责活动海报设计。",
    targetJD: "",
    badOutput: "具备优秀的设计审美与视觉表达能力，综合素质突出，在校期间积累了丰富的设计实践经验，得到领导一致好评。",
    whyBad: [
      "'具备优秀的'——空洞形容词堆砌",
      "'综合素质突出'——说不清具体什么素质",
      "'领导一致好评'——模板化套话",
      "完全没有具体内容，读起来像 HR 系统自动生成的",
    ],
    whatShouldBe: "负责学生会活动海报的视觉设计，根据活动主题完成多款宣传物料的制作。",
  },

  // ─── Category: Buzzwords + Fabrication ────────────────────────
  {
    id: "bad-07-combined",
    category: "buzzwords",
    originalDescription: "帮助老师整理课程资料，协助课堂设备调试。",
    targetJD: "",
    badOutput: "主导教学资源体系化梳理，从0到1搭建课程资料管理框架，赋能教研团队知识沉淀，推动教学流程数字化转型。",
    whyBad: [
      "帮老师干活被包装成'主导体系化梳理'",
      "'从0到1'——经典互联网话术，且编造",
      "'赋能教研团队'——编造了团队管理",
      "'数字化转型'——完全虚构",
      "几乎每一句都是黑话+编造的组合",
    ],
    whatShouldBe: "协助教师整理课程资料并完成课堂多媒体设备调试。",
  },

]

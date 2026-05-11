/**
 * AI Resume Optimization — Evaluation Rules
 *
 * Defines quality criteria for judging AI output.
 * Each rule is independently scorable (1–5) to enable
 * structured evaluation and prompt regression testing.
 */

// ─── Dimension Definitions ──────────────────────────────────────

export interface EvaluationDimension {
  id: string
  label: string
  description: string
  weight: number // 0–1, sum of all weights = 1
  scoringGuide: Record<number, string> // score → description
}

export const evaluationDimensions: EvaluationDimension[] = [
  {
    id: "faithfulness",
    label: "真实性 / 不编造",
    description: "输出是否100%忠于原始经历，没有编造原文不存在的工作内容、成果、数据或职责。",
    weight: 0.30,
    scoringGuide: {
      1: "大量编造：添加了原文不存在的工作职责、项目、数据或成果",
      2: "明显编造：至少1处虚构职责或数据，或夸大了工作性质",
      3: "轻微偏差：整体忠实，但有1-2处轻微夸大（如'参与'写成'负责'）",
      4: "基本真实：所有事实均可在原文中找到依据，动词级别基本准确",
      5: "完全真实：所有内容严格忠于原文，动词级别精确，无任何添加或夸大",
    },
  },
  {
    id: "jd-relevance",
    label: "岗位相关性（仅 JD 模式）",
    description: "当有目标 JD 时，输出是否合理地将真实经历与目标岗位需求进行了关联。无 JD 时此项跳过。",
    weight: 0.20,
    scoringGuide: {
      1: "完全无关：输出与 JD 方向毫无关联",
      2: "关联薄弱：仅有形式上的关联，未体现对 JD 的理解",
      3: "部分关联：部分表达能看出 JD 的影响，但不稳定",
      4: "较好关联：在多个维度上将经历与 JD 需求自然对齐",
      5: "精准关联：表达自然地将可迁移能力与 JD 核心需求对齐，不刻意",
    },
  },
  {
    id: "transferable-skills",
    label: "可迁移能力提炼",
    description: "是否从具体任务中合理提取了可迁移的通用职业能力，而非停留在表面任务描述。",
    weight: 0.20,
    scoringGuide: {
      1: "无提炼：只是原文的简单改写或直接复述",
      2: "弱提炼：仅有笼统形容词（如'认真负责'），缺乏具体能力指向",
      3: "部分提炼：识别了部分可迁移能力，但表达不够清晰",
      4: "较好提炼：准确识别了多个可迁移能力，并自然嵌入表达",
      5: "优秀提炼：精准识别核心可迁移能力，表达极具说服力且克制",
    },
  },
  {
    id: "professional-language",
    label: "语言专业度",
    description: "表达是否职业化、自然，不使用模板化语言、互联网黑话或空洞形容词。",
    weight: 0.15,
    scoringGuide: {
      1: "严重黑话：使用了大量互联网黑话和空洞术语",
      2: "模板化：有明显的 HR 软件模板痕迹，语言僵硬",
      3: "基本合格：语言基本通顺，但有些生硬或模板感",
      4: "自然专业：表达自然流畅，读起来像真实求职者写的",
      5: "优秀表达：语言精准、克制、有个人特色，完全不像 AI 生成",
    },
  },
  {
    id: "conservatism",
    label: "保守克制度",
    description: "在信息不足时是否保持克制，不强行推断或'补齐'信息。这是防幻觉的关键维度。",
    weight: 0.15,
    scoringGuide: {
      1: "严重过度推断：原文信息极少，但输出了大量臆测内容",
      2: "明显过度推断：在多个地方填补了原文没有的信息",
      3: "基本克制：整体克制，但有个别过度推断的地方",
      4: "较好克制：只在原文有明确支撑的地方进行提炼",
      5: "完美克制：信息不足时保持简洁，宁可短也不编造",
    },
  },
]

// ─── Blacklist Check ────────────────────────────────────────────

/** Words/phrases that must NOT appear in output */
export const BLACKLIST = [
  // Internet jargon
  "赋能",
  "闭环",
  "抓手",
  "倒逼",
  "沉淀",
  "拉通",
  "对齐",
  "颗粒度",
  // Inflated terms
  "核心业务",
  "技术方案",
  "底层架构",
  "中台",
  "打法",
  "全链路",
  "端到端",
  // Template clichés
  "具备优秀的",
  "综合素质突出",
  "综合能力强",
  "在XX方面表现优异",
  "得到领导一致好评",
  "受到客户广泛认可",
  // Role inflation
  "主导",
  "战略",
  "体系搭建",
  "从0到1",
  "体系化",
]

/**
 * Check output against blacklist. Returns list of violations found.
 */
export function checkBlacklist(text: string): string[] {
  return BLACKLIST.filter((word) => text.includes(word))
}

// ─── Aggregate Scoring ──────────────────────────────────────────

export interface EvalScore {
  dimensionId: string
  score: number
  note: string
}

export interface EvalResult {
  scores: EvalScore[]
  weightedTotal: number
  blacklistViolations: string[]
  passed: boolean
  summary: string
}

/**
 * Calculate weighted score from individual dimension scores.
 * Pass threshold: weightedTotal >= 3.5 AND no blacklist violations.
 */
export function calculateResult(
  scores: EvalScore[],
  output: string,
  hasJD: boolean
): EvalResult {
  const blacklistViolations = checkBlacklist(output)

  let weightedTotal = 0
  for (const s of scores) {
    const dim = evaluationDimensions.find((d) => d.id === s.dimensionId)
    if (!dim) continue

    // Skip JD-relevance if no JD
    if (dim.id === "jd-relevance" && !hasJD) continue

    weightedTotal += s.score * dim.weight
  }

  // Normalize if JD-relevance was skipped
  if (!hasJD) {
    const applicableWeight = evaluationDimensions
      .filter((d) => d.id !== "jd-relevance")
      .reduce((sum, d) => sum + d.weight, 0)
    weightedTotal = weightedTotal / applicableWeight
  }

  const passed = weightedTotal >= 3.5 && blacklistViolations.length === 0

  return {
    scores,
    weightedTotal: Math.round(weightedTotal * 100) / 100,
    blacklistViolations,
    passed,
    summary: passed
      ? `通过 (加权分: ${weightedTotal.toFixed(2)})`
      : `未通过 (加权分: ${weightedTotal.toFixed(2)}, 黑名单命中: ${blacklistViolations.join(", ") || "无"})`,
  }
}

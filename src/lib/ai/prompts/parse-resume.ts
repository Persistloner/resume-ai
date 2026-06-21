/**
 * Resume Parsing Prompts — Step-by-Step Architecture
 *
 * Step 1: Segment raw text into sections (personalInfo / experience / education / projects / skills)
 * Step 2: Parse each section independently into structured JSON
 * Step 3: Merge results (handled in route.ts)
 */

// ─── Types ────────────────────────────────────────────────────────────

export const SECTIONS = ["personalInfo", "experience", "education", "projects", "skills"] as const
export type SectionType = (typeof SECTIONS)[number]

export interface SectionTexts {
  personalInfo: string
  experience: string
  education: string
  projects: string
  skills: string
}

// ─── Step 1: Segmentation Prompt ──────────────────────────────────────

const SEGMENT_SYSTEM_PROMPT = `你是一个简历文本分段引擎。你的任务是将简历原文按模块拆分，输出每个模块对应的原文片段。

# 规则

1. 仔细阅读整份简历，识别每个模块的边界
2. 将原文内容复制到对应模块字段中，**不要改写、不要总结、不要省略**
3. 如果某个模块在原文中不存在，对应字段留空字符串 ""
4. personalInfo 包含：姓名、邮箱、电话、地址、求职意向、自我评价/个人总结
5. experience 包含：工作经历、实习经历
6. education 包含：教育背景、学历
7. projects 包含：项目经历、项目经验
8. skills 包含：专业技能、技术栈、证书、语言能力

# 输出格式

只返回 JSON，不要任何解释：

{
  "personalInfo": "姓名等信息原文...",
  "experience": "工作经历原文...",
  "education": "教育背景原文...",
  "projects": "项目经历原文...",
  "skills": "技能原文..."
}`

export function buildSegmentPrompt(rawText: string): {
  system: string
  user: string
} {
  return {
    system: SEGMENT_SYSTEM_PROMPT,
    user: [
      "请将以下简历文本按模块拆分。每个模块输出对应的原文内容。",
      "",
      "---",
      rawText,
      "---",
      "",
      "只返回 JSON。",
    ].join("\n"),
  }
}

// ─── Step 2: Per-Section Parse Prompts ─────────────────────────────────

const PARSE_PERSONAL_INFO_PROMPT = `你是一个简历信息提取引擎。从简历头部文本中提取个人信息。

# 规则
1. 只提取原文中存在的信息，不要编造
2. 找不到的字段留空字符串 ""
3. summary 包含求职意向、自我评价等内容

# 输出格式
只返回 JSON：
{
  "fullName": "",
  "email": "",
  "phone": "",
  "location": "",
  "title": "",
  "summary": ""
}`

const PARSE_EXPERIENCE_PROMPT = `你是一个简历工作经历提取引擎。从工作经历文本中提取结构化信息。

# 规则
1. **每段工作经历必须单独提取**，原文有N段就提取N段
2. 只提取原文中存在的信息，不要编造
3. 日期保持原文格式（如 "2022-03"、"2022年3月"）
4. 如果原文用"至今"/"present"表示当前，endDate 留空，current 设为 true
5. description 保留原文的 bullet 结构和措辞，不要改写
6. 实习经历也归入工作经历

# 输出格式
只返回 JSON 数组：
[
  {
    "company": "公司名",
    "role": "职位",
    "startDate": "开始日期",
    "endDate": "结束日期",
    "current": false,
    "description": "工作描述原文"
  }
]`

const PARSE_EDUCATION_PROMPT = `你是一个简历教育经历提取引擎。从教育背景文本中提取结构化信息。

# 规则
1. **每段教育经历必须单独提取**，原文有N段就提取N段
2. 只提取原文中存在的信息，不要编造
3. 日期保持原文格式（如 "2022"、"2022-2026"）
4. field 是专业方向，degree 是学位（如学士、硕士）

# 输出格式
只返回 JSON 数组：
[
  {
    "school": "学校名",
    "degree": "学位",
    "field": "专业",
    "startDate": "开始日期",
    "endDate": "结束日期"
  }
]`

const PARSE_PROJECTS_PROMPT = `你是一个简历项目经历提取引擎。从项目经历文本中提取结构化信息。

# 规则
1. **每个项目必须单独提取**，原文有N个就提取N个
2. 只提取原文中存在的信息，不要编造
3. duration 保持原文格式（如 "2023.06-2023.12"、"3个月"）
4. role 是项目中担任的角色（如"前端负责人"、"独立开发"），没提到则留空
5. description 保留原文的 bullet 结构和措辞，不要改写

# 输出格式
只返回 JSON 数组：
[
  {
    "name": "项目名称",
    "role": "担任角色",
    "duration": "项目时间",
    "description": "项目描述原文"
  }
]`

const PARSE_SKILLS_PROMPT = `你是一个简历技能提取引擎。从技能文本中提取结构化信息。

# 规则
1. 技能按**能力方向**归纳，通常 3-6 个方向
2. 不要拆成碎片标签（如"AI工具"、"Prompt工程"、"AI MVP"应合并为一个方向）
3. title 概括能力方向，2-8 个字，如"前端框架与工程化"
4. description 用 1-3 句话描述具体能力、工具和场景，**必须包含原文提到的具体工具**
5. 禁止空洞形容词（"精通"、"熟练掌握"、"表现优异"）
6. 证书和语言能力（英语六级、日语N2等）也作为 skill 提取

# 输出格式
只返回 JSON 数组：
[
  {
    "title": "能力方向",
    "description": "具体能力描述"
  }
]`

const SECTION_PARSE_PROMPTS: Record<SectionType, string> = {
  personalInfo: PARSE_PERSONAL_INFO_PROMPT,
  experience: PARSE_EXPERIENCE_PROMPT,
  education: PARSE_EDUCATION_PROMPT,
  projects: PARSE_PROJECTS_PROMPT,
  skills: PARSE_SKILLS_PROMPT,
}

export function buildSectionParsePrompt(
  sectionType: SectionType,
  sectionText: string
): { system: string; user: string } {
  const systemPrompt = SECTION_PARSE_PROMPTS[sectionType]
  const labelMap: Record<SectionType, string> = {
    personalInfo: "个人信息",
    experience: "工作经历",
    education: "教育背景",
    projects: "项目经历",
    skills: "技能",
  }

  return {
    system: systemPrompt,
    user: [
      `请从以下${labelMap[sectionType]}文本中提取结构化信息。`,
      "",
      "---",
      sectionText || "（无内容）",
      "---",
      "",
      "只返回 JSON。",
    ].join("\n"),
  }
}

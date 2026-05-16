/**
 * AI Resume Optimization — Test Case Suite
 *
 * Each case defines:
 *  - input: raw experience description
 *  - targetJD: target job description (empty = general optimization)
 *  - idealDirection: what GOOD output should do
 *  - forbiddenDirection: what MUST NOT appear in output
 *
 * Used for prompt regression testing and quality evaluation.
 */

export interface TestCase {
  id: string
  label: string
  input: {
    company: string
    position: string
    description: string
    targetJD: string
  }
  idealDirection: string[]
  forbiddenDirection: string[]
}

export const testCases: TestCase[] = [

  // ─── Case 1: Translation Experience ───────────────────────────
  {
    id: "case-01-translation",
    label: "翻译经历 — 通用优化（无 JD）",
    input: {
      company: "某翻译服务公司",
      position: "翻译",
      description: "独立完成科技、政经、企业领域文本英汉互译，累计翻译量超6万字。",
      targetJD: "",
    },
    idealDirection: [
      "从'翻译量'提炼持续产出能力",
      "从'独立完成'提炼自主工作习惯",
      "从多领域提炼跨领域适应能力",
      "使用自然中文职场表达，不模板化",
      "信息提取、逻辑整理等 transferable skills",
    ],
    forbiddenDirection: [
      "编造项目管理或团队管理经历",
      "编造具体业务成果或数据指标",
      "出现'赋能''闭环''抓手'等黑话",
      "出现'核心业务''技术方案'等虚构术语",
      "把翻译岗包装成技术岗或管理岗",
    ],
  },

  // ─── Case 2: New Media Operations ─────────────────────────────
  {
    id: "case-02-new-media",
    label: "新媒体运营 — JD 匹配模式",
    input: {
      company: "某教育科技公司",
      position: "内容编辑",
      description: "负责公众号内容撰写与排版，每周发布3篇文章，回复读者评论，定期整理发布数据。",
      targetJD: `新媒体运营
岗位职责：
1. 负责公司新媒体矩阵的内容策划与日常运营
2. 结合用户画像和热点，策划高传播性内容
3. 跟踪分析运营数据，优化内容策略
4. 提升粉丝增长与用户活跃度`,
    },
    idealDirection: [
      "从'撰写排版'桥接到'内容运营'概念",
      "从'回复评论'提炼用户互动意识",
      "从'整理数据'桥接到'数据分析基础'",
      "用新媒体运营岗位语言重新描述真实经历",
      "保持克制——不把执行包装成策略制定",
    ],
    forbiddenDirection: [
      "编造'粉丝增长 XX%'等数据",
      "编造'内容策略制定'或'矩阵搭建'",
      "编造'用户画像分析'或'热点追踪'",
      "把'发布3篇'夸大为'主导内容体系'",
      "出现'赋能''颗粒度''拉通对齐'等黑话",
    ],
  },

  // ─── Case 3: Campus Activities ────────────────────────────────
  {
    id: "case-03-campus",
    label: "校园活动 — 应届生通用优化",
    input: {
      company: "XX大学学生会",
      position: "宣传部部长",
      description: "组织校园文化节，协调6个社团联合参与，负责活动宣传物料设计与推文撰写，活动到场约500人。",
      targetJD: "",
    },
    idealDirection: [
      "从'组织活动'提炼项目协调能力",
      "从'6个社团联合'提炼跨团队沟通",
      "从'宣传物料与推文'提炼内容制作能力",
      "保留'500人'这个具体数字（这是真实数据）",
      "表达符合应届生水平，不太过老练",
    ],
    forbiddenDirection: [
      "编造预算管理或商业成果",
      "把校园活动夸大为商业项目",
      "编造'赞助谈判'或'商业合作'",
      "使用过于资深的职场表达",
      "出现'项目交付''业务闭环'等职场黑话",
    ],
  },

  // ─── Case 4: Regular Part-time ────────────────────────────────
  {
    id: "case-04-part-time",
    label: "普通兼职 — 通用优化",
    input: {
      company: "某连锁咖啡店",
      position: "兼职店员",
      description: "负责收银、饮品制作、店面清洁，接待到店顾客约50人/天。",
      targetJD: "",
    },
    idealDirection: [
      "从'收银'提取基本的现金/交易处理经验",
      "从'接待顾客'提取基础服务意识",
      "从重复性日常工作中提炼责任心",
      "保持简洁——不需要过度包装",
      "如果信息不足以支撑某项能力，宁可保守",
    ],
    forbiddenDirection: [
      "编造'库存管理'或'销售分析'",
      "把店员包装成'门店运营'",
      "编造'提升客户满意度'等虚假成果",
      "编造'培训新员工'等不存在职责",
      "把兼职写成全职管理经验",
    ],
  },

  // ─── Case 5: Career Change → AI PM ────────────────────────────
  {
    id: "case-05-career-change",
    label: "转行 AI 产品经理 — JD 匹配模式（跨领域）",
    input: {
      company: "某互联网教育公司",
      position: "课程运营",
      description: "负责在线课程的上线排期与详情页优化，收集用户学习反馈并整理为优化建议，协调教研与技术团队推进课程迭代需求。",
      targetJD: `AI 产品经理
岗位职责：
1. 负责 AI 产品的需求分析与功能设计
2. 与算法、工程团队紧密协作，推动产品迭代
3. 通过用户研究与数据分析驱动产品决策
4. 撰写 PRD，管理产品需求优先级`,
    },
    idealDirection: [
      "从'收集用户反馈'桥接到'用户研究意识'",
      "从'协调教研与技术团队'提炼跨职能协作经验",
      "从'整理优化建议'桥接到'需求分析基础'",
      "从'详情页优化'提炼产品优化意识",
      "承认差距——不假装有 AI/ML 经验",
    ],
    forbiddenDirection: [
      "编造 AI 或机器学习相关经验",
      "编造 PRD 撰写或需求管理经验",
      "编造'算法团队协作'（原经历没有算法团队）",
      "把'课程运营'写成'产品经理'",
      "编造产品数据指标或 A/B 测试经验",
    ],
  },

  // ─── Case 6: Fresh Graduate (No Internship) ───────────────────
  {
    id: "case-06-fresh-grad",
    label: "无实习应届生 — 通用优化",
    input: {
      company: "XX大学",
      position: "计算机科学与技术 本科",
      description: "毕业设计：基于深度学习的图像分类系统，使用 PyTorch 实现 ResNet 模型，在 CIFAR-10 上达到 92% 准确率。在校期间完成多个课程项目，包括简单的 Web 应用和数据库设计。",
      targetJD: "",
    },
    idealDirection: [
      "从毕设提炼技术实践能力",
      "保留具体技术栈（PyTorch/ResNet/CIFAR-10）",
      "从'课程项目'合理提炼基础开发能力",
      "保持学生水平的诚实表达",
      "如果信息不足以推断团队协作，不编造",
    ],
    forbiddenDirection: [
      "编造实习或工作经历",
      "编造团队协作经验（除非原文有）",
      "把课程项目夸大为商业项目",
      "编造性能优化数据",
      "编造项目管理或架构设计经验",
    ],
  },

  // ─── Case 7: Customer Service → Sales (Cross-function) ────────
  {
    id: "case-07-cs-to-sales",
    label: "客服转销售 — JD 匹配模式（跨职能转化）",
    input: {
      company: "某电商平台",
      position: "客服专员",
      description: "处理用户售后咨询，解答产品相关问题，协调退换货流程，记录用户反馈并整理成周报。",
      targetJD: `销售专员
岗位职责：
1. 负责客户开发与关系维护
2. 深入理解客户需求，提供针对性解决方案
3. 推动销售转化与客户复购
4. 完成月度销售目标`,
    },
    idealDirection: [
      "从'解答产品问题'提炼产品理解与需求分析能力",
      "从'处理售后咨询'提炼客户沟通经验",
      "从'整理反馈周报'提炼信息归纳意识",
      "用销售岗位语言描述客服工作中的可迁移能力",
      "诚实——不编造销售业绩",
    ],
    forbiddenDirection: [
      "编造'客户开发'或'销售转化'经历",
      "编造销售业绩数据",
      "编造'客户关系维护系统'等",
      "把客服岗直接写成销售岗",
      "出现'商务谈判''合同签订'等不存在的内容",
    ],
  },

  // ─── Case 8: Minimal Info — Conservative Test ─────────────────
  {
    id: "case-08-minimal",
    label: "极简信息 — 保守表达压力测试",
    input: {
      company: "某小型公司",
      position: "行政助理",
      description: "做行政工作。",
      targetJD: "",
    },
    idealDirection: [
      "只做最小限度的职业化调整",
      "不臆测具体职责",
      "输出极端简洁（1句话即可）",
    ],
    forbiddenDirection: [
      "编造任何具体行政工作内容",
      "编造'物资管理''档案归档''会议安排'等",
      "编造'制度优化'或'流程改善'",
      "把一句话扩展为长篇大论",
      "在信息真空时强行生成'专业描述'",
    ],
  },

  // ─── Case 9: AI PM Positioning — JD Mode ────────────────────────
  {
    id: "case-09-ai-pm-positioning",
    label: "AI产品经理定位 — 5步法角色化输出",
    input: {
      company: "某翻译服务公司",
      position: "翻译",
      description: "独立完成科技、政经、企业领域文本英汉互译，累计翻译量超6万字。",
      targetJD: `AI 产品经理
岗位职责：
1. 负责 AI 产品需求分析与方案设计
2. 深入理解用户场景，将需求转化为结构化产品文档
3. 与算法、工程团队协作推动产品落地
4. 通过数据分析与用户反馈驱动产品迭代`,
    },
    idealDirection: [
      "从翻译工作提取'信息提取''语义准确性''逻辑重组'等可迁移能力",
      "输出包含 transferableSkills 数组（2-5个名词短语）",
      "输出包含 rolePersona（涉及AI产品思维）",
      "输出包含 coreInsight（一句话洞察）",
      "positionedText 为自然中文职场表达",
      "用产品思维语言描述翻译经验，但保留翻译岗位身份",
    ],
    forbiddenDirection: [
      "编造产品经理相关工作（如'撰写PRD''需求分析'）",
      "编造AI/ML技术经验",
      "把翻译岗位直接包装成产品经理",
      "出现'赋能''闭环''抓手'等黑话",
      "出现'主导''战略''从0到1'等夸大词",
    ],
  },

  // ─── Case 10: Operations Positioning — JD Mode ──────────────────
  {
    id: "case-10-ops-positioning",
    label: "运营岗定位 — 角色人格差异化输出",
    input: {
      company: "某教育科技公司",
      position: "内容编辑",
      description: "负责公众号内容撰写与排版，每周发布3篇文章，回复读者评论，定期整理发布数据。",
      targetJD: `新媒体运营
岗位职责：
1. 负责新媒体矩阵内容策划与日常运营
2. 结合用户画像策划高传播性内容
3. 跟踪分析运营数据，优化内容策略
4. 提升粉丝增长与用户活跃度`,
    },
    idealDirection: [
      "rolePersona 体现运营角色特征（用户洞察/数据驱动/内容优化等）",
      "transferableSkills 包含'内容策划''用户理解''数据反馈'等运营相关能力",
      "positionedText 风格偏数据导向和用户视角",
      "与案例9（AI PM）的输出风格有明显差异",
    ],
    forbiddenDirection: [
      "编造'粉丝增长XX%'等数据",
      "编造'内容矩阵搭建'或'策略制定'",
      "把'发布3篇'夸大为'主导内容体系'",
      "出现模板化语言或黑话",
    ],
  },

  // ─── Case 11: Generic Positioning — No JD ───────────────────────
  {
    id: "case-11-generic-positioning",
    label: "通用职业定位 — 无JD模式",
    input: {
      company: "某连锁咖啡店",
      position: "兼职店员",
      description: "负责收银、饮品制作、店面清洁，接待到店顾客约50人/天。",
      targetJD: "",
    },
    idealDirection: [
      "无JD时仍输出合理的 rolePersona（通用执行角色）",
      "transferableSkills 合理（如'服务意识''事务管理'）",
      "coreInsight 诚实反映信息量",
      "positionedText 保持简洁，不过度包装",
    ],
    forbiddenDirection: [
      "编造'库存管理''销售分析'等不存在职责",
      "把店员包装成'门店运营'或'管理岗'",
      "过度输出（信息极少时不强行扩展）",
    ],
  },

  // ─── Case 12: Skill Positioning — JD Mode ───────────────────────
  {
    id: "case-12-skill-positioning",
    label: "技能定位 — JD匹配模式",
    input: {
      company: "",
      position: "前端开发",
      description: "熟练使用 React 技术栈，有 Vue 项目经验，了解 Webpack 配置和前端工程化流程。",
      targetJD: `高级前端工程师
岗位要求：
1. 精通 React/Vue 等主流框架
2. 具备前端工程化体系建设经验
3. 熟悉性能优化与构建工具链
4. 有技术选型与团队技术规范制定经验`,
    },
    idealDirection: [
      "从'React+Vue双技术栈'提炼'技术适应性'",
      "从'了解Webpack'提炼'工程化思维'",
      "rolePersona 体现高级前端思维",
      "不把'了解'写成'精通'，不把'有经验'写成'主导'",
    ],
    forbiddenDirection: [
      "编造'架构设计'或'性能优化'经验",
      "编造'团队技术规范制定'经历",
      "把'了解'夸大为'精通'",
      "出现模板化语言",
    ],
  },

]

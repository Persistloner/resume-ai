/**
 * Parse AI response text from the career positioning prompt.
 * Pure text parsing — no API calls.
 */

interface ParseResult {
  positionedText: string
  abilityCards: Array<{ title: string; realExperience: string; abilityExtraction: string; jdMigration: string }>
  transferableSkills: string[]
  rolePersona: string
  coreInsight: string
  sceneMapping: string
  skillType: string
}

export function parsePositioningResponse(text: string): ParseResult {
  const sections = extractSections(text)

  const positionedText = sections.positionedText || text
  const abilityCards = parseAbilityCards(sections.abilityCards || "")
  const transferableSkills = parseList(sections.transferableSkills || "")
  const rolePersona = sections.rolePersona || ""
  const coreInsight = sections.coreInsight || ""
  const sceneMapping = sections.sceneMapping || ""
  const skillType = sections.skillType || ""

  return {
    positionedText,
    abilityCards,
    transferableSkills,
    rolePersona,
    coreInsight,
    sceneMapping,
    skillType,
  }
}

function extractSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const headers = [
    "优化文本", "能力卡片", "迁移能力", "角色画像",
    "核心洞察", "场景映射", "技能类型",
  ]

  let currentSection = ""
  const lines = text.split("\n")

  for (const line of lines) {
    const trimmed = line.trim()
    let matched = false

    for (const header of headers) {
      if (trimmed.startsWith(`## ${header}`) || trimmed.startsWith(`### ${header}`) || trimmed === header) {
        currentSection = header
        matched = true
        break
      }
    }

    if (!matched && currentSection) {
      sections[currentSection] = (sections[currentSection] || "") + line + "\n"
    } else if (!matched && !currentSection && trimmed) {
      sections.positionedText = (sections.positionedText || "") + line + "\n"
    }
  }

  // Clean trailing whitespace
  for (const key of Object.keys(sections)) {
    sections[key] = sections[key].trim()
  }

  return sections
}

function parseAbilityCards(text: string): ParseResult["abilityCards"] {
  if (!text.trim()) return []
  const cards: ParseResult["abilityCards"] = []
  const blocks = text.split(/\n(?=\d+\.\s*\*\*|\n\*\*)/)

  for (const block of blocks) {
    const lines = block.split("\n")
    let title = ""
    let realExperience = ""
    let abilityExtraction = ""
    let jdMigration = ""

    for (const line of lines) {
      const t = line.trim()
      if (t.startsWith("**") || t.match(/^\d+\.\s*\*\*/)) {
        title = t.replace(/^\d+\.\s*\*\*/, "").replace(/\*\*.*$/, "").trim()
      } else if (t.includes("真实经历") || t.includes("real")) {
        realExperience = t.replace(/^[^:：]+[：:]\s*/, "").trim()
      } else if (t.includes("能力提取") || t.includes("ability")) {
        abilityExtraction = t.replace(/^[^:：]+[：:]\s*/, "").trim()
      } else if (t.includes("迁移") || t.includes("migration") || t.includes("匹配")) {
        jdMigration = t.replace(/^[^:：]+[：:]\s*/, "").trim()
      }
    }

    if (title) {
      cards.push({ title, realExperience, abilityExtraction, jdMigration })
    }
  }

  return cards
}

function parseList(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean)
}

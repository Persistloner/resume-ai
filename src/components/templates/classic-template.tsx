"use client"

import { Mail, Phone, MapPin } from "lucide-react"
import { safeDisplayText } from "@/lib/safe-display-text"
import { SemanticParagraph } from "@/components/semantic-paragraph"
import type { Resume, Skill, AbilityCard } from "@/lib/types"

// ═══════════════════════════════════════════════════════════
// Template Props
// ═══════════════════════════════════════════════════════════

export interface ClassicTemplateProps {
  resume: Resume
  showOptimized: boolean
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function displayText(desc: string, optimized: string, showOptimized: boolean): string {
  if (!showOptimized) return safeDisplayText(desc)
  return safeDisplayText(optimized) || safeDisplayText(desc)
}

// ═══════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="resume-section-heading">{children}</h2>
}

function ItemDate({ children }: { children: React.ReactNode }) {
  return <span className="resume-item-date">{children}</span>
}

function ItemHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="font-bold"
      style={{
        fontSize: "var(--resume-item-heading-size)",
        fontWeight: "var(--resume-item-heading-weight)",
        color: "var(--resume-subheading-color)",
      }}
    >
      {children}
    </h3>
  )
}

function ItemContent({ text }: { text: string }) {
  return (
    <div className="resume-item-content text-justify mt-0">
      <SemanticParagraph
        text={text}
        sizeClass="text-[var(--resume-body-size)]"
      />
    </div>
  )
}

function SkillPreviewItem({
  skill,
  showOptimized,
  skillIndex,
}: {
  skill: Skill
  showOptimized: boolean
  skillIndex: number
}) {
  const primaryText = displayText(skill.description, skill.optimizedDescription, showOptimized)
  const hasCards = showOptimized && skill.abilityCards && skill.abilityCards.length > 0

  return (
    <div className="resume-skill-card" data-skill-id={skill.id} data-skill-index={skillIndex}>
      <h3
        className="font-bold"
        style={{
          fontSize: "var(--resume-item-heading-size)",
          fontWeight: "var(--resume-item-heading-weight)",
          color: "var(--resume-subheading-color)",
        }}
      >
        {skill.title}
      </h3>

      {primaryText && (
        <div className="resume-item-content text-justify mt-0">
          <SemanticParagraph
            text={primaryText}
            sizeClass="text-[var(--resume-body-size)]"
          />
        </div>
      )}

      {hasCards && (
        <div className="resume-ability-cards space-y-1.5">
          {skill.abilityCards!.map((card) => (
            <AbilityCardItem key={card.title} card={card} />
          ))}
        </div>
      )}
    </div>
  )
}

function AbilityCardItem({ card }: { card: AbilityCard }) {
  return (
    <div>
      <h4
        className="font-semibold leading-relaxed"
        style={{
          fontSize: "calc(var(--resume-body-size) * 0.85)",
          color: "var(--resume-text-color)",
        }}
      >
        {card.title}
      </h4>
      <p
        className="leading-relaxed mt-0 font-medium"
        style={{
          fontSize: "calc(var(--resume-body-size) * 0.8)",
          color: "var(--resume-text-color)",
        }}
      >
        {card.realExperience}
      </p>
      <p
        className="leading-relaxed mt-0 font-medium"
        style={{
          fontSize: "calc(var(--resume-body-size) * 0.8)",
          color: "var(--resume-text-color)",
        }}
      >
        {card.abilityExtraction}
      </p>
      <p
        className="leading-relaxed mt-0 font-medium"
        style={{
          fontSize: "calc(var(--resume-body-size) * 0.8)",
          color: "var(--resume-muted-color)",
        }}
      >
        {card.jdMigration}
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Template Component
// ═══════════════════════════════════════════════════════════

export function ClassicTemplate({ resume, showOptimized }: ClassicTemplateProps) {
  const { personalInfo, workExperience, projectExperience, education, skills } = resume

  return (
    <>
      {/* ── Header ──────────────────────────────────────── */}
      <div data-preview-anchor="preview-personal" className="resume-header">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="resume-name">
              {personalInfo.fullName || "姓名"}
            </h1>
            <p className="resume-title mt-0">
              {personalInfo.title || "职位"}
            </p>
            <div className="flex flex-wrap items-center resume-contact mt-1.5 font-medium">
              {personalInfo.email && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3 shrink-0" /> {personalInfo.email}
                </span>
              )}
              {personalInfo.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="size-3 shrink-0" /> {personalInfo.phone}
                </span>
              )}
              {personalInfo.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3 shrink-0" /> {personalInfo.location}
                </span>
              )}
            </div>
          </div>
          {personalInfo.photo && (
            <img
              src={personalInfo.photo}
              alt="简历照片"
              className="resume-photo object-cover rounded border shrink-0 ml-3"
            />
          )}
        </div>
      </div>

      {/* ── Summary ─────────────────────────────────────── */}
      {personalInfo.summary && (
        <div data-preview-anchor="preview-summary" className="resume-section">
          <SectionHeading>个人简介</SectionHeading>
          <ItemContent text={personalInfo.summary} />
        </div>
      )}

      {/* ── Work Experience ─────────────────────────────── */}
      {workExperience.length > 0 && (
        <div data-preview-anchor="preview-work" className="resume-section">
          <SectionHeading>工作经历</SectionHeading>
          {workExperience.map((exp) => {
            const text = displayText(exp.description, exp.optimizedDescription, showOptimized)
            return (
              <div key={exp.id} className="resume-item">
                <div className="flex justify-between items-baseline gap-2">
                  <div className="flex-1 min-w-0">
                    <ItemHeading>
                      {exp.company || "公司名称"}
                      {exp.role ? ` — ${exp.role}` : ""}
                    </ItemHeading>
                  </div>
                  <ItemDate>
                    {exp.startDate} — {exp.current ? "至今" : exp.endDate}
                  </ItemDate>
                </div>
                {text && <ItemContent text={text} />}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Project Experience ──────────────────────────── */}
      {projectExperience.length > 0 && (
        <div data-preview-anchor="preview-project" className="resume-section">
          <SectionHeading>项目经历</SectionHeading>
          {projectExperience.map((proj) => {
            const text = displayText(proj.description, proj.optimizedDescription, showOptimized)
            return (
              <div key={proj.id} className="resume-item">
                <div className="flex justify-between items-baseline gap-2">
                  <div className="flex-1 min-w-0">
                    <ItemHeading>
                      {proj.name || "项目名称"}
                      {proj.role ? ` — ${proj.role}` : ""}
                    </ItemHeading>
                  </div>
                  <ItemDate>{proj.duration}</ItemDate>
                </div>
                {text && <ItemContent text={text} />}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Education ───────────────────────────────────── */}
      {education.length > 0 && (
        <div data-preview-anchor="preview-education" className="resume-section">
          <SectionHeading>教育背景</SectionHeading>
          {education.map((edu) => (
            <div key={edu.id} className="resume-item">
              <div className="flex justify-between items-baseline gap-2">
                <div className="flex-1 min-w-0">
                  <ItemHeading>{edu.school || "学校名称"}</ItemHeading>
                </div>
                <ItemDate>
                  {edu.startDate} — {edu.endDate}
                </ItemDate>
              </div>
              <p className="resume-edu-detail font-medium text-justify mt-0">
                {edu.degree} {edu.field && `· ${edu.field}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Skills ──────────────────────────────────────── */}
      {skills.length > 0 && (
        <div data-preview-anchor="preview-skills" className="resume-section">
          <SectionHeading>专业技能</SectionHeading>
          <div className="space-y-1.5">
            {skills.map((skill, idx) => (
              <SkillPreviewItem
                key={skill.id}
                skill={skill}
                showOptimized={showOptimized}
                skillIndex={idx}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

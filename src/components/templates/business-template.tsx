"use client"

import { Mail, Phone, MapPin, User } from "lucide-react"
import { safeDisplayText } from "@/lib/safe-display-text"
import { SemanticParagraph } from "@/components/semantic-paragraph"
import type { Resume, Skill, AbilityCard } from "@/lib/types"

export interface BusinessTemplateProps {
  resume: Resume
  showOptimized: boolean
}

function displayText(desc: string, optimized: string, showOptimized: boolean): string {
  if (!showOptimized) return safeDisplayText(desc)
  return safeDisplayText(optimized) || safeDisplayText(desc)
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-bold tracking-wide"
      style={{
        fontSize: "0.8rem",
        color: "#1a1a1a",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        borderBottom: "2px solid #333333",
        paddingBottom: "2px",
        marginBottom: "5px",
      }}
    >
      {children}
    </h2>
  )
}

function SkillPreviewItem({
  skill,
  showOptimized,
}: {
  skill: Skill
  showOptimized: boolean
}) {
  const primaryText = displayText(skill.description, skill.optimizedDescription, showOptimized)
  const hasCards = showOptimized && skill.abilityCards && skill.abilityCards.length > 0

  return (
    <div style={{ breakInside: "avoid", marginBottom: "2px" }}>
      <h3
        className="font-bold"
        style={{
          fontSize: "0.75rem",
          color: "#1f2937",
        }}
      >
        {skill.title}
      </h3>
      {primaryText && (
        <div
          className="text-justify leading-relaxed"
          style={{
            fontSize: "0.7rem",
            color: "#4b5563",
            paddingLeft: "10px",
          }}
        >
          <SemanticParagraph text={primaryText} sizeClass="text-[0.7rem]" />
        </div>
      )}
      {hasCards && (
        <div
          className="space-y-1 mt-0.5"
          style={{
            paddingLeft: "10px",
            borderLeft: "2px solid #d1d5db",
          }}
        >
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
        style={{ fontSize: "0.62rem", color: "#374151" }}
      >
        {card.title}
      </h4>
      <p
        className="leading-relaxed mt-0 font-medium"
        style={{ fontSize: "0.6rem", color: "#4b5563" }}
      >
        {card.realExperience}
      </p>
      <p
        className="leading-relaxed mt-0 font-medium"
        style={{ fontSize: "0.6rem", color: "#4b5563" }}
      >
        {card.abilityExtraction}
      </p>
      <p
        className="leading-relaxed mt-0 font-medium"
        style={{ fontSize: "0.6rem", color: "#9ca3af" }}
      >
        {card.jdMigration}
      </p>
    </div>
  )
}

export function BusinessTemplate({ resume, showOptimized }: BusinessTemplateProps) {
  const { personalInfo, workExperience, projectExperience, education, skills } = resume

  return (
    <div
      style={{
        paddingLeft: "20px",
        paddingRight: "20px",
        paddingTop: "22px",
        paddingBottom: "22px",
        color: "#333333",
      }}
    >
      {/* ── Header: centered name with photo ──────────────── */}
      <div
        data-preview-anchor="preview-personal"
        style={{
          textAlign: "center",
          marginBottom: "8px",
        }}
      >
        <div className="flex items-center justify-center gap-4">
          {personalInfo.photo ? (
            <img
              src={personalInfo.photo}
              alt="简历照片"
              className="object-cover border border-gray-300 shrink-0"
              style={{ width: "55px", height: "70px" }}
            />
          ) : (
            <div
              className="flex items-center justify-center border border-gray-300 bg-gray-100 shrink-0"
              style={{ width: "55px", height: "70px" }}
            >
              <User className="size-6 text-gray-400" />
            </div>
          )}
          <div>
            <h1
              className="font-extrabold tracking-tight"
              style={{
                fontSize: "1.35rem",
                color: "#0a0a0a",
                fontWeight: 800,
              }}
            >
              {personalInfo.fullName || "姓名"}
            </h1>
            {personalInfo.title && (
              <p
                className="font-bold mt-0.5"
                style={{
                  fontSize: "0.78rem",
                  color: "#2c2c2c",
                }}
              >
                {personalInfo.title}
              </p>
            )}
          </div>
        </div>

        {/* Contact row */}
        <div
          className="flex flex-wrap items-center justify-center gap-3 mt-2 font-medium"
          style={{
            fontSize: "0.62rem",
            color: "#666666",
          }}
        >
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

        {/* Thick divider under header */}
        <div
          style={{
            height: "2px",
            backgroundColor: "#333333",
            marginTop: "8px",
          }}
        />
      </div>

      {/* ── Summary ───────────────────────────────────────── */}
      {personalInfo.summary && (
        <div
          data-preview-anchor="preview-summary"
          style={{ marginBottom: "6px" }}
        >
          <SectionHeading>个人简介</SectionHeading>
          <div
            className="text-justify leading-relaxed"
            style={{
              fontSize: "0.72rem",
              color: "#4b5563",
            }}
          >
            <SemanticParagraph
              text={personalInfo.summary}
              sizeClass="text-[0.72rem]"
            />
          </div>
        </div>
      )}

      {/* ── Work Experience ───────────────────────────────── */}
      {workExperience.length > 0 && (
        <div
          data-preview-anchor="preview-work"
          style={{ marginBottom: "4px" }}
        >
          <SectionHeading>工作经历</SectionHeading>
          <div className="space-y-0.5">
            {workExperience.map((exp) => {
              const text = displayText(
                exp.description,
                exp.optimizedDescription,
                showOptimized
              )
              return (
                <div key={exp.id} style={{ breakInside: "avoid" }}>
                  <div className="flex justify-between items-baseline gap-2">
                    <h3
                      className="font-bold"
                      style={{
                        fontSize: "0.78rem",
                        color: "#1f2937",
                      }}
                    >
                      {exp.company || "公司名称"}
                      {exp.role ? ` — ${exp.role}` : ""}
                    </h3>
                    <span
                      className="shrink-0 text-right"
                      style={{
                        fontSize: "0.6rem",
                        color: "#666666",
                        width: "100px",
                      }}
                    >
                      {exp.startDate} — {exp.current ? "至今" : exp.endDate}
                    </span>
                  </div>
                  {text && (
                    <div
                      className="text-justify mt-0 leading-relaxed"
                      style={{
                        fontSize: "0.72rem",
                        color: "#4b5563",
                        paddingLeft: "12px",
                      }}
                    >
                      <SemanticParagraph
                        text={text}
                        sizeClass="text-[0.72rem]"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Project Experience ────────────────────────────── */}
      {projectExperience.length > 0 && (
        <div
          data-preview-anchor="preview-project"
          style={{ marginBottom: "4px" }}
        >
          <SectionHeading>项目经历</SectionHeading>
          <div className="space-y-0.5">
            {projectExperience.map((proj) => {
              const text = displayText(
                proj.description,
                proj.optimizedDescription,
                showOptimized
              )
              return (
                <div key={proj.id} style={{ breakInside: "avoid" }}>
                  <div className="flex justify-between items-baseline gap-2">
                    <h3
                      className="font-bold"
                      style={{
                        fontSize: "0.78rem",
                        color: "#1f2937",
                      }}
                    >
                      {proj.name || "项目名称"}
                      {proj.role ? ` — ${proj.role}` : ""}
                    </h3>
                    <span
                      className="shrink-0 text-right"
                      style={{
                        fontSize: "0.6rem",
                        color: "#666666",
                        width: "100px",
                      }}
                    >
                      {proj.duration}
                    </span>
                  </div>
                  {text && (
                    <div
                      className="text-justify mt-0 leading-relaxed"
                      style={{
                        fontSize: "0.72rem",
                        color: "#4b5563",
                        paddingLeft: "12px",
                      }}
                    >
                      <SemanticParagraph
                        text={text}
                        sizeClass="text-[0.72rem]"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Education ─────────────────────────────────────── */}
      {education.length > 0 && (
        <div
          data-preview-anchor="preview-education"
          style={{ marginBottom: "4px" }}
        >
          <SectionHeading>教育背景</SectionHeading>
          {education.map((edu) => (
            <div key={edu.id} style={{ breakInside: "avoid" }}>
              <div className="flex justify-between items-baseline gap-2">
                <h3
                  className="font-bold"
                  style={{
                    fontSize: "0.78rem",
                    color: "#1f2937",
                  }}
                >
                  {edu.school || "学校名称"}
                </h3>
                <span
                  className="shrink-0 text-right"
                  style={{
                    fontSize: "0.6rem",
                    color: "#666666",
                    width: "100px",
                  }}
                >
                  {edu.startDate} — {edu.endDate}
                </span>
              </div>
              <p
                className="font-medium mt-0"
                style={{
                  fontSize: "0.72rem",
                  color: "#4b5563",
                  paddingLeft: "12px",
                }}
              >
                {edu.degree}
                {edu.field && ` · ${edu.field}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Skills ────────────────────────────────────────── */}
      {skills.length > 0 && (
        <div
          data-preview-anchor="preview-skills"
          style={{ marginBottom: "4px" }}
        >
          <SectionHeading>专业技能</SectionHeading>
          <div>
            {skills.map((skill) => (
              <SkillPreviewItem
                key={skill.id}
                skill={skill}
                showOptimized={showOptimized}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

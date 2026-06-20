"use client"

import { Mail, Phone, MapPin, Code } from "lucide-react"
import { safeDisplayText } from "@/lib/safe-display-text"
import { SemanticParagraph } from "@/components/semantic-paragraph"
import { SkillsSection } from "@/components/templates/shared/skills-section"
import type { Resume } from "@/lib/types"

export interface TechTemplateProps {
  resume: Resume
  showOptimized: boolean
}

function displayText(desc: string, optimized: string, showOptimized: boolean): string {
  if (!showOptimized) return safeDisplayText(desc)
  return safeDisplayText(optimized) || safeDisplayText(desc)
}

/** Split on sentence-ending punctuation for natural line breaks. Keeps all content. */
function formatSkillDescription(text: string): string[] {
  return text
    .split(/(?<=[；;。.])/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Card wrapper for sections */
function CardSection({
  children,
  style,
  ...rest
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      {...rest}
      style={{
        backgroundColor: "#f8fafc",
        border: "1px solid #bfdbfe",
        borderRadius: "6px",
        padding: "10px",
        marginBottom: "10px",
        breakInside: "auto",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-bold tracking-wide"
      style={{
        fontSize: "0.85rem",
        color: "#1e3a5f",
        borderBottom: "2px solid #2563eb",
        paddingBottom: "3px",
        marginBottom: "6px",
      }}
    >
      {children}
    </h2>
  )
}

export function TechTemplate({ resume, showOptimized }: TechTemplateProps) {
  const { personalInfo, workExperience, projectExperience, education, skills } = resume

  return (
    <div
      style={{
        width: "100%",
        boxSizing: "border-box",
        minHeight: "auto",
        paddingLeft: "22px",
        paddingRight: "22px",
        paddingTop: "24px",
        paddingBottom: "24px",
        color: "#334155",
      }}
    >
      {/* ── Header: accent bar on left ─────────────────────── */}
      <div
        data-preview-anchor="preview-personal"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          marginBottom: "14px",
        }}
      >
        {/* Blue accent bar */}
        <div
          style={{
            width: "4px",
            height: "40px",
            backgroundColor: "#2563eb",
            borderRadius: "2px",
            flexShrink: 0,
            marginTop: "2px",
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            className="font-bold tracking-tight"
            style={{
              fontSize: "1.3rem",
              color: "#0f172a",
            }}
          >
            {personalInfo.fullName || "姓名"}
          </h1>
          {personalInfo.title && (
            <p
              className="font-medium mt-1"
              style={{
                fontSize: "0.78rem",
                color: "#2563eb",
              }}
            >
              {personalInfo.title}
            </p>
          )}
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 font-medium"
            style={{
              fontSize: "0.62rem",
              color: "#64748b",
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
        </div>

        {personalInfo.photo && (
          <img
            src={personalInfo.photo}
            alt="简历照片"
            className="object-cover rounded border border-blue-100 shrink-0"
            style={{ width: "56px", height: "71px" }}
          />
        )}
      </div>

      {/* ── Summary ────────────────────────────────────────── */}
      {personalInfo.summary && (
        <CardSection>
          <SectionHeading>个人简介</SectionHeading>
          <div
            className="text-justify leading-relaxed"
            style={{ fontSize: "0.72rem", color: "#475569" }}
          >
            <SemanticParagraph
              text={personalInfo.summary}
              sizeClass="text-[0.72rem]"
            />
          </div>
        </CardSection>
      )}

      {/* ── Skills ─────────────────────────────────────────── */}
      {skills.length > 0 && (
        <CardSection data-preview-anchor="preview-skills">
          <SectionHeading>技术能力</SectionHeading>
          <SkillsSection
            skills={skills}
            showOptimized={showOptimized}
            renderSkill={({ title, description }) => (
              <div style={{ marginBottom: "8px", minWidth: 0, maxWidth: "100%" }}>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    color: "#1e40af",
                    backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "4px",
                    padding: "1px 8px",
                    marginBottom: "4px",
                  }}
                >
                  {title}
                </span>
                {description &&
                  formatSkillDescription(description).map((line, i) => (
                    <p
                      key={i}
                      style={{
                        display: "block",
                        width: "100%",
                        maxWidth: "100%",
                        minWidth: 0,
                        fontSize: "0.72rem",
                        lineHeight: "1.6",
                        color: "#475569",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        lineBreak: "loose",
                        margin: "0 0 2px 0",
                        paddingLeft: "8px",
                      }}
                    >
                      {line}
                    </p>
                  ))}
              </div>
            )}
          />
        </CardSection>
      )}

      {/* ── Project Experience (emphasized) ────────────────── */}
      {projectExperience.length > 0 && (
        <div data-preview-anchor="preview-project">
          <h2
            className="font-bold tracking-wide"
            style={{
              fontSize: "0.85rem",
              color: "#1e3a5f",
              borderBottom: "2px solid #2563eb",
              paddingBottom: "3px",
              marginBottom: "6px",
            }}
          >
            项目经历
          </h2>
          <div className="space-y-0.5">
            {projectExperience.map((proj) => {
              const text = displayText(
                proj.description,
                proj.optimizedDescription,
                showOptimized
              )
              return (
                <div
                  key={proj.id}
                  style={{
                    backgroundColor: "#f0f9ff",
                    border: "1px solid #bae6fd",
                    borderRadius: "6px",
                    padding: "10px",
                    marginBottom: "6px",
                    borderLeft: "3px solid #2563eb",
                    breakInside: "auto",
                  }}
                >
                  <div className="flex justify-between items-baseline gap-2">
                    <h3
                      className="font-bold"
                      style={{
                        fontSize: "0.8rem",
                        color: "#1e40af",
                      }}
                    >
                      <Code className="size-3 inline mr-1" />
                      {proj.name || "项目名称"}
                      {proj.role ? ` — ${proj.role}` : ""}
                    </h3>
                    <span
                      className="shrink-0 text-right font-medium"
                      style={{
                        fontSize: "0.6rem",
                        color: "#2563eb",
                      }}
                    >
                      {proj.duration}
                    </span>
                  </div>
                  {text && (
                    <div
                      className="text-justify mt-1 leading-relaxed"
                      style={{
                        fontSize: "0.72rem",
                        color: "#334155",
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

      {/* ── Work Experience ────────────────────────────────── */}
      {workExperience.length > 0 && (
        <CardSection
          data-preview-anchor="preview-work"
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
                <div key={exp.id} style={{ breakInside: "auto", marginBottom: "4px" }}>
                  <div className="flex justify-between items-baseline gap-2">
                    <h3
                      className="font-bold"
                      style={{
                        fontSize: "0.78rem",
                        color: "#1e293b",
                      }}
                    >
                      {exp.company || "公司名称"}
                      {exp.role ? ` — ${exp.role}` : ""}
                    </h3>
                    <span
                      className="shrink-0 text-right"
                      style={{
                        fontSize: "0.6rem",
                        color: "#2563eb",
                        width: "105px",
                      }}
                    >
                      {exp.startDate} — {exp.current ? "至今" : exp.endDate}
                    </span>
                  </div>
                  {text && (
                    <div
                      className="text-justify mt-0.5 leading-relaxed"
                      style={{
                        fontSize: "0.72rem",
                        color: "#475569",
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
        </CardSection>
      )}

      {/* ── Education ──────────────────────────────────────── */}
      {education.length > 0 && (
        <CardSection
          data-preview-anchor="preview-education"
        >
          <SectionHeading>教育背景</SectionHeading>
          {education.map((edu) => (
            <div key={edu.id} style={{ breakInside: "avoid" }}>
              <div className="flex justify-between items-baseline gap-2">
                <h3
                  className="font-bold"
                  style={{
                    fontSize: "0.78rem",
                    color: "#1e293b",
                  }}
                >
                  {edu.school || "学校名称"}
                </h3>
                <span
                  className="shrink-0 text-right"
                  style={{
                    fontSize: "0.6rem",
                    color: "#2563eb",
                    width: "105px",
                  }}
                >
                  {edu.startDate} — {edu.endDate}
                </span>
              </div>
              <p
                className="font-medium mt-0"
                style={{
                  fontSize: "0.72rem",
                  color: "#475569",
                  paddingLeft: "12px",
                }}
              >
                {edu.degree}
                {edu.field && ` · ${edu.field}`}
              </p>
            </div>
          ))}
        </CardSection>
      )}
    </div>
  )
}

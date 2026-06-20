"use client"

import { Mail, Phone, MapPin, User } from "lucide-react"
import { safeDisplayText } from "@/lib/safe-display-text"
import { SemanticParagraph } from "@/components/semantic-paragraph"
import type { Resume } from "@/lib/types"

export interface SidebarTemplateProps {
  resume: Resume
  showOptimized: boolean
}

function displayText(desc: string, optimized: string, showOptimized: boolean): string {
  if (!showOptimized) return safeDisplayText(desc)
  return safeDisplayText(optimized) || safeDisplayText(desc)
}

export function SidebarTemplate({ resume, showOptimized }: SidebarTemplateProps) {
  const { personalInfo, workExperience, projectExperience, education, skills } = resume

  return (
    <div className="flex" style={{ minHeight: "297mm" }}>
      {/* ── Left Sidebar ─────────────────────────────────── */}
      <div
        className="w-[30%] shrink-0 text-white flex flex-col gap-5"
        style={{
          backgroundColor: "#1e293b",
          padding: "24px 16px",
        }}
      >
        {/* Photo */}
        {personalInfo.photo ? (
          <div className="flex justify-center">
            <img
              src={personalInfo.photo}
              alt="简历照片"
              className="object-cover rounded-full border-2 border-white/30"
              style={{ width: "90px", height: "114px" }}
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              className="flex items-center justify-center rounded-full bg-white/10"
              style={{ width: "90px", height: "90px" }}
            >
              <User className="size-9 text-white/40" />
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div>
          <h3
            className="font-semibold mb-2 tracking-wide"
            style={{
              fontSize: "0.7rem",
              textTransform: "uppercase",
              color: "#94a3b8",
              letterSpacing: "0.1em",
              borderBottom: "1px solid rgba(148,163,184,0.3)",
              paddingBottom: "4px",
            }}
          >
            联系方式
          </h3>
          <div className="space-y-1.5" style={{ fontSize: "0.65rem" }}>
            {personalInfo.email && (
              <div className="flex items-center gap-1.5 text-slate-300 break-all">
                <Mail className="size-3 shrink-0 text-slate-400" />
                <span>{personalInfo.email}</span>
              </div>
            )}
            {personalInfo.phone && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <Phone className="size-3 shrink-0 text-slate-400" />
                <span>{personalInfo.phone}</span>
              </div>
            )}
            {personalInfo.location && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="size-3 shrink-0 text-slate-400" />
                <span>{personalInfo.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Skills — in sidebar */}
        {skills.length > 0 && (
          <div>
            <h3
              className="font-semibold mb-2 tracking-wide"
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                color: "#94a3b8",
                letterSpacing: "0.1em",
                borderBottom: "1px solid rgba(148,163,184,0.3)",
                paddingBottom: "4px",
              }}
            >
              专业技能
            </h3>
            <div className="space-y-2">
              {skills.map((skill) => (
                <div key={skill.id}>
                  <h4
                    className="font-semibold text-white"
                    style={{ fontSize: "0.68rem" }}
                  >
                    {skill.title}
                  </h4>
                  {showOptimized && skill.optimizedDescription ? (
                    <p
                      className="text-slate-400 leading-relaxed mt-0.5"
                      style={{ fontSize: "0.6rem" }}
                    >
                      {safeDisplayText(skill.optimizedDescription)}
                    </p>
                  ) : skill.description ? (
                    <p
                      className="text-slate-400 leading-relaxed mt-0.5"
                      style={{ fontSize: "0.6rem" }}
                    >
                      {safeDisplayText(skill.description)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education — in sidebar */}
        {education.length > 0 && (
          <div>
            <h3
              className="font-semibold mb-2 tracking-wide"
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                color: "#94a3b8",
                letterSpacing: "0.1em",
                borderBottom: "1px solid rgba(148,163,184,0.3)",
                paddingBottom: "4px",
              }}
            >
              教育背景
            </h3>
            <div className="space-y-2">
              {education.map((edu) => (
                <div key={edu.id}>
                  <h4
                    className="font-semibold text-white"
                    style={{ fontSize: "0.68rem" }}
                  >
                    {edu.school || "学校名称"}
                  </h4>
                  <p
                    className="text-slate-400 leading-relaxed mt-0.5"
                    style={{ fontSize: "0.6rem" }}
                  >
                    {edu.degree}
                    {edu.field && ` · ${edu.field}`}
                  </p>
                  <p
                    className="text-slate-500 mt-0.5"
                    style={{ fontSize: "0.58rem" }}
                  >
                    {edu.startDate} — {edu.endDate}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Right Main Content ────────────────────────────── */}
      <div
        className="flex-1 min-w-0"
        style={{
          padding: "28px 22px",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Name */}
        <div className="mb-4">
          <h1
            className="font-bold tracking-tight"
            style={{
              fontSize: "1.375rem",
              color: "#1e293b",
            }}
          >
            {personalInfo.fullName || "姓名"}
          </h1>
          {personalInfo.title && (
            <p
              className="font-medium mt-1"
              style={{
                fontSize: "0.8rem",
                color: "#475569",
              }}
            >
              {personalInfo.title}
            </p>
          )}
          <div
            style={{
              height: "2px",
              backgroundColor: "#e2e8f0",
              marginTop: "10px",
            }}
          />
        </div>

        {/* Summary */}
        {personalInfo.summary && (
          <div
            className="mb-4"
            data-preview-anchor="preview-summary"
          >
            <h2
              className="font-semibold mb-1.5 tracking-wide"
              style={{
                fontSize: "0.8rem",
                color: "#1e293b",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              个人简介
            </h2>
            <div
              className="text-justify leading-relaxed"
              style={{
                fontSize: "0.72rem",
                color: "#475569",
              }}
            >
              <SemanticParagraph
                text={personalInfo.summary}
                sizeClass="text-[0.72rem]"
              />
            </div>
          </div>
        )}

        {/* Work Experience */}
        {workExperience.length > 0 && (
          <div
            className="mb-3"
            data-preview-anchor="preview-work"
          >
            <h2
              className="font-semibold mb-2 tracking-wide"
              style={{
                fontSize: "0.8rem",
                color: "#1e293b",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                borderBottom: "1.5px solid #e2e8f0",
                paddingBottom: "3px",
              }}
            >
              工作经历
            </h2>
            <div className="space-y-3">
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
                          color: "#334155",
                        }}
                      >
                        {exp.company || "公司名称"}
                        {exp.role ? ` — ${exp.role}` : ""}
                      </h3>
                      <span
                        className="shrink-0 text-right"
                        style={{
                          fontSize: "0.6rem",
                          color: "#94a3b8",
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
          </div>
        )}

        {/* Project Experience */}
        {projectExperience.length > 0 && (
          <div
            className="mb-3"
            data-preview-anchor="preview-project"
          >
            <h2
              className="font-semibold mb-2 tracking-wide"
              style={{
                fontSize: "0.8rem",
                color: "#1e293b",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                borderBottom: "1.5px solid #e2e8f0",
                paddingBottom: "3px",
              }}
            >
              项目经历
            </h2>
            <div className="space-y-3">
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
                          color: "#334155",
                        }}
                      >
                        {proj.name || "项目名称"}
                        {proj.role ? ` — ${proj.role}` : ""}
                      </h3>
                      <span
                        className="shrink-0 text-right"
                        style={{
                          fontSize: "0.6rem",
                          color: "#94a3b8",
                        }}
                      >
                        {proj.duration}
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
          </div>
        )}
      </div>
    </div>
  )
}

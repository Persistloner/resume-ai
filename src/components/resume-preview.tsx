"use client"

import { useResumeStore } from "@/lib/store"
import { Mail, Phone, MapPin } from "lucide-react"

export function ResumePreview() {
  const resume = useResumeStore((s) => s.resume)
  const { personalInfo, experience, education, skills } = resume

  return (
    <div
      id="resume-preview"
      className="bg-white shadow-xl w-[210mm] min-h-[297mm] p-[20mm] text-sm leading-relaxed"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-wide">{personalInfo.fullName || "姓名"}</h1>
        <p className="text-base text-gray-600 mt-1">{personalInfo.title || "职位"}</p>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
          {personalInfo.email && (
            <span className="flex items-center gap-1">
              <Mail className="size-3" /> {personalInfo.email}
            </span>
          )}
          {personalInfo.phone && (
            <span className="flex items-center gap-1">
              <Phone className="size-3" /> {personalInfo.phone}
            </span>
          )}
          {personalInfo.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" /> {personalInfo.location}
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {personalInfo.summary && (
        <div className="mb-5">
          <h2 className="text-base font-bold uppercase tracking-wider border-b pb-1 mb-2">
            个人简介
          </h2>
          <p className="text-gray-700 text-xs leading-relaxed">{personalInfo.summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-base font-bold uppercase tracking-wider border-b pb-1 mb-3">
            工作经历
          </h2>
          {experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold text-sm">{exp.company || "公司名称"}</h3>
                <span className="text-xs text-gray-500">
                  {exp.startDate} — {exp.current ? "至今" : exp.endDate}
                </span>
              </div>
              <p className="text-xs text-gray-600 italic">{exp.position || "职位"}</p>
              {exp.description && (
                <p className="text-xs text-gray-700 mt-1">{exp.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-base font-bold uppercase tracking-wider border-b pb-1 mb-3">
            教育背景
          </h2>
          {education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold text-sm">{edu.school || "学校名称"}</h3>
                <span className="text-xs text-gray-500">
                  {edu.startDate} — {edu.endDate}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {edu.degree} {edu.field && `· ${edu.field}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div>
          <h2 className="text-base font-bold uppercase tracking-wider border-b pb-1 mb-2">
            技能
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill.id}
                className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

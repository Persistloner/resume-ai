"use client"

import { PersonalInfoForm } from "./personal-info-form"
import { ExperienceForm } from "./experience-form"
import { ProjectExperienceForm } from "./project-experience-form"
import { EducationForm } from "./education-form"
import { SkillsForm } from "./skills-form"
import { User, Briefcase, FolderKanban, GraduationCap, Wrench, Eye, ChevronDown } from "lucide-react"

type SectionId = "personal" | "work" | "project" | "education" | "skills"

interface SectionDef {
  id: SectionId
  label: string
  icon: React.ReactNode
  component: React.ReactNode
}

interface ResumeFormProps {
  activeSection: SectionId | null
  onSectionChange: (id: SectionId | null) => void
  onScrollPreview: (id: SectionId) => void
}

export function ResumeForm({ activeSection, onSectionChange, onScrollPreview }: ResumeFormProps) {
  const sections: SectionDef[] = [
    {
      id: "personal",
      label: "基本信息",
      icon: <User className="size-3.5" />,
      component: <PersonalInfoForm />,
    },
    {
      id: "work",
      label: "工作经历",
      icon: <Briefcase className="size-3.5" />,
      component: <ExperienceForm />,
    },
    {
      id: "project",
      label: "项目经历",
      icon: <FolderKanban className="size-3.5" />,
      component: <ProjectExperienceForm />,
    },
    {
      id: "education",
      label: "教育背景",
      icon: <GraduationCap className="size-3.5" />,
      component: <EducationForm />,
    },
    {
      id: "skills",
      label: "专业技能",
      icon: <Wrench className="size-3.5" />,
      component: <SkillsForm />,
    },
  ]

  return (
    <div className="space-y-1.5">
      {sections.map((section) => {
        const isOpen = activeSection === section.id

        const handleToggle = () => {
          // Click open section → close it; click closed section → open it
          onSectionChange(isOpen ? null : section.id)
        }

        return (
          <div
            key={section.id}
            id={`editor-section-${section.id}`}
            className="border rounded-lg overflow-hidden"
          >
            {/* Section Header */}
            <button
              onClick={handleToggle}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{section.icon}</span>
                <span>{section.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    onScrollPreview(section.id)
                  }}
                  className="p-0.5 rounded hover:bg-primary/10 hover:text-primary transition-colors"
                  title="在预览中定位此模块"
                  role="button"
                  tabIndex={0}
                >
                  <Eye className="size-3" />
                </span>
                <ChevronDown
                  className={`size-3.5 text-muted-foreground transition-transform duration-200 ${
                    isOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </div>
            </button>

            {/* Section Content — with collapse animation */}
            <div
              className={`grid transition-all duration-200 ease-in-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-3 pb-3 pt-0 border-t">
                  <div className="pt-3">{section.component}</div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

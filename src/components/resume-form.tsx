"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PersonalInfoForm } from "./personal-info-form"
import { ExperienceForm } from "./experience-form"
import { EducationForm } from "./education-form"
import { SkillsForm } from "./skills-form"
import { User, Briefcase, GraduationCap, Wrench } from "lucide-react"

export function ResumeForm() {
  return (
    <Tabs defaultValue="personal">
      <TabsList className="w-full mb-6">
        <TabsTrigger value="personal">
          <User className="size-3.5" />
          基本信息
        </TabsTrigger>
        <TabsTrigger value="experience">
          <Briefcase className="size-3.5" />
          经历
        </TabsTrigger>
        <TabsTrigger value="education">
          <GraduationCap className="size-3.5" />
          教育
        </TabsTrigger>
        <TabsTrigger value="skills">
          <Wrench className="size-3.5" />
          技能
        </TabsTrigger>
      </TabsList>

      <TabsContent value="personal">
        <PersonalInfoForm />
      </TabsContent>
      <TabsContent value="experience">
        <ExperienceForm />
      </TabsContent>
      <TabsContent value="education">
        <EducationForm />
      </TabsContent>
      <TabsContent value="skills">
        <SkillsForm />
      </TabsContent>
    </Tabs>
  )
}

import { create } from "zustand"
import { Resume, Experience, Education, Skill } from "./types"
import { mockResume } from "./mock-data"
import { v4 as uuid } from "uuid"

interface ResumeStore {
  resume: Resume

  // Personal Info
  setPersonalInfo: (info: Partial<Resume["personalInfo"]>) => void

  // Experience
  addExperience: () => void
  updateExperience: (id: string, data: Partial<Experience>) => void
  removeExperience: (id: string) => void

  // Education
  addEducation: () => void
  updateEducation: (id: string, data: Partial<Education>) => void
  removeEducation: (id: string) => void

  // Skills
  addSkill: (name: string) => void
  removeSkill: (id: string) => void

  // AI Optimization
  optimizingId: string | null
  setOptimizingId: (id: string | null) => void

  // Target JD
  targetJD: string
  setTargetJD: (jd: string) => void

  // Batch import
  setResume: (resume: Resume) => void

  // ─── ATS Analysis ──────────────────────────────────────
  atsLoading: boolean
  atsError: string | null
  atsScore: number | null
  jdKeywords: string[]
  roleType: string
  coreRequirements: string[]
  matchedSkills: string[]
  missingSkills: string[]
  aiSuggestions: string[]

  setATSAnalysis: (data: {
    atsScore: number
    jdKeywords: string[]
    roleType: string
    coreRequirements: string[]
    matchedSkills: string[]
    missingSkills: string[]
    suggestions: string[]
  }) => void
  setATSLoading: (loading: boolean) => void
  setATSError: (error: string | null) => void
  clearATSAnalysis: () => void
}

export const useResumeStore = create<ResumeStore>((set) => ({
  resume: { ...mockResume },

  optimizingId: null,
  setOptimizingId: (id) => set({ optimizingId: id }),

  targetJD: "",
  setTargetJD: (jd) => set({ targetJD: jd }),

  setResume: (resume) => set({ resume }),

  // ─── ATS Analysis defaults ─────────────────────────────
  atsLoading: false,
  atsError: null,
  atsScore: null,
  jdKeywords: [],
  roleType: "",
  coreRequirements: [],
  matchedSkills: [],
  missingSkills: [],
  aiSuggestions: [],

  setATSAnalysis: (data) =>
    set({
      atsScore: data.atsScore,
      jdKeywords: data.jdKeywords,
      roleType: data.roleType,
      coreRequirements: data.coreRequirements,
      matchedSkills: data.matchedSkills,
      missingSkills: data.missingSkills,
      aiSuggestions: data.suggestions,
      atsLoading: false,
      atsError: null,
    }),

  setATSLoading: (loading) => set({ atsLoading: loading, atsError: null }),
  setATSError: (error) => set({ atsError: error, atsLoading: false }),

  clearATSAnalysis: () =>
    set({
      atsScore: null,
      jdKeywords: [],
      roleType: "",
      coreRequirements: [],
      matchedSkills: [],
      missingSkills: [],
      aiSuggestions: [],
      atsLoading: false,
      atsError: null,
    }),

  setPersonalInfo: (info) =>
    set((state) => ({
      resume: { ...state.resume, personalInfo: { ...state.resume.personalInfo, ...info } },
    })),

  addExperience: () =>
    set((state) => ({
      resume: {
        ...state.resume,
        experience: [
          ...state.resume.experience,
          {
            id: uuid(),
            company: "",
            position: "",
            startDate: "",
            endDate: "",
            current: false,
            description: "",
          },
        ],
      },
    })),

  updateExperience: (id, data) =>
    set((state) => ({
      resume: {
        ...state.resume,
        experience: state.resume.experience.map((exp) =>
          exp.id === id ? { ...exp, ...data } : exp
        ),
      },
    })),

  removeExperience: (id) =>
    set((state) => ({
      resume: {
        ...state.resume,
        experience: state.resume.experience.filter((exp) => exp.id !== id),
      },
    })),

  addEducation: () =>
    set((state) => ({
      resume: {
        ...state.resume,
        education: [
          ...state.resume.education,
          { id: uuid(), school: "", degree: "", field: "", startDate: "", endDate: "" },
        ],
      },
    })),

  updateEducation: (id, data) =>
    set((state) => ({
      resume: {
        ...state.resume,
        education: state.resume.education.map((edu) =>
          edu.id === id ? { ...edu, ...data } : edu
        ),
      },
    })),

  removeEducation: (id) =>
    set((state) => ({
      resume: {
        ...state.resume,
        education: state.resume.education.filter((edu) => edu.id !== id),
      },
    })),

  addSkill: (name) =>
    set((state) => ({
      resume: {
        ...state.resume,
        skills: [...state.resume.skills, { id: uuid(), name }],
      },
    })),

  removeSkill: (id) =>
    set((state) => ({
      resume: {
        ...state.resume,
        skills: state.resume.skills.filter((s) => s.id !== id),
      },
    })),
}))

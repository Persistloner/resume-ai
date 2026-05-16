import { create } from "zustand"
import { Resume, WorkExperience, ProjectExperience, Education, Skill } from "./types"
import type { PositioningMetadata, OptimizationHistoryEntry, AbilityCard } from "./types"
import { mockResume } from "./mock-data"
import { v4 as uuid } from "uuid"

type EntityType = "work" | "project" | "skill"

type Entity = WorkExperience | ProjectExperience | Skill

interface ResumeStore {
  resume: Resume

  // Personal Info
  setPersonalInfo: (info: Partial<Resume["personalInfo"]>) => void
  /** Set photo from data URL (base64). Pass empty string to remove. */
  setPhoto: (dataUrl: string) => void
  /** Toggle ATS-friendly mode (hide photo in export) */
  setHidePhotoInExport: (hide: boolean) => void

  // Work Experience
  addWorkExperience: () => void
  updateWorkExperience: (id: string, data: Partial<WorkExperience>) => void
  removeWorkExperience: (id: string) => void

  // Project Experience
  addProjectExperience: () => void
  updateProjectExperience: (id: string, data: Partial<ProjectExperience>) => void
  removeProjectExperience: (id: string) => void

  // Education
  addEducation: () => void
  updateEducation: (id: string, data: Partial<Education>) => void
  removeEducation: (id: string) => void

  // Skills
  addSkill: (title: string, description: string) => void
  updateSkill: (id: string, data: Partial<Skill>) => void
  removeSkill: (id: string) => void

  // AI Optimization
  optimizingId: string | null
  setOptimizingId: (id: string | null) => void

  // Target JD
  targetJD: string
  setTargetJD: (jd: string) => void

  // Batch import
  setResume: (resume: Resume) => void

  // Career Positioning
  setPositioningResult: (
    entityType: EntityType,
    id: string,
    positionedText: string,
    metadata: PositioningMetadata,
    abilityCards?: AbilityCard[]
  ) => void
  /** Dedicated per-skill optimization with debug logging & validation */
  optimizeSkill: (
    skillId: string,
    positionedText: string,
    metadata: PositioningMetadata,
    abilityCards?: AbilityCard[]
  ) => void
  undoOptimization: (entityType: EntityType, id: string) => void
  clearOptimization: (entityType: EntityType, id: string) => void

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

// ─── Helpers ──────────────────────────────────────────────

/** Deep-clone ability cards to guarantee zero reference sharing between skills */
function cloneAbilityCards(cards?: AbilityCard[]): AbilityCard[] {
  if (!cards || cards.length === 0) return []
  return cards.map((c) => ({
    title: String(c.title ?? ""),
    realExperience: String(c.realExperience ?? ""),
    abilityExtraction: String(c.abilityExtraction ?? ""),
    jdMigration: String(c.jdMigration ?? ""),
  }))
}

/** Check if any two skills have identical optimized content (indicates a sharing bug) */
function detectContentDuplication(skills: Skill[], changedId: string): boolean {
  const optimized = skills.filter(
    (s) => s.optimizedDescription && s.abilityCards && s.abilityCards.length > 0
  )
  for (let i = 0; i < optimized.length; i++) {
    for (let j = i + 1; j < optimized.length; j++) {
      if (optimized[i].id === optimized[j].id) {
        console.error(
          `[store] DUPLICATE ID detected: ${optimized[i].id} appears twice in skills array`
        )
        return true
      }
      if (
        optimized[i].optimizedDescription === optimized[j].optimizedDescription &&
        optimized[i].optimizedDescription !== ""
      ) {
        console.error(
          `[store] CONTENT DUPLICATION: skill "${optimized[i].id}" and "${optimized[j].id}" have identical optimizedDescription after optimizing "${changedId}"`
        )
        return true
      }
    }
  }
  return false
}

function blankWorkExperience(): WorkExperience {
  return {
    id: uuid(),
    company: "",
    role: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
    optimizedDescription: "",
  }
}

function blankProjectExperience(): ProjectExperience {
  return {
    id: uuid(),
    name: "",
    role: "",
    duration: "",
    description: "",
    optimizedDescription: "",
  }
}

function blankEducation(): Education {
  return { id: uuid(), school: "", degree: "", field: "", startDate: "", endDate: "" }
}

function getEntityArray(
  resume: Resume,
  entityType: EntityType
): Entity[] {
  if (entityType === "work") return resume.workExperience
  if (entityType === "project") return resume.projectExperience
  return resume.skills
}

function setEntityArray(
  resume: Resume,
  entityType: EntityType,
  items: Entity[]
): Resume {
  if (entityType === "work") return { ...resume, workExperience: items as WorkExperience[] }
  if (entityType === "project") return { ...resume, projectExperience: items as ProjectExperience[] }
  return { ...resume, skills: items as Skill[] }
}

// ─── Store ────────────────────────────────────────────────

export const useResumeStore = create<ResumeStore>((set) => ({
  resume: { ...mockResume },

  optimizingId: null,
  setOptimizingId: (id) => set({ optimizingId: id }),

  targetJD: "",
  setTargetJD: (jd) => set({ targetJD: jd }),

  setResume: (resume) =>
    set({
      resume: {
        ...resume,
        // Ensure all entities have unique IDs (imported data may lack them)
        workExperience: resume.workExperience.map((e) => ({
          ...e,
          id: e.id || uuid(),
          optimizedDescription: e.optimizedDescription || "",
        })),
        projectExperience: resume.projectExperience.map((p) => ({
          ...p,
          id: p.id || uuid(),
          optimizedDescription: p.optimizedDescription || "",
        })),
        education: resume.education.map((e) => ({
          ...e,
          id: e.id || uuid(),
        })),
        skills: resume.skills.map((s) => ({
          ...s,
          id: s.id || uuid(),
          optimizedDescription: s.optimizedDescription || "",
          abilityCards: s.abilityCards || [],
        })),
      },
    }),

  // ─── Career Positioning ─────────────────────────────────

  setPositioningResult: (entityType, id, positionedText, metadata, abilityCards) =>
    set((state) => {
      const items = getEntityArray(state.resume, entityType).map((item) => {
        if (item.id !== id) return item

        const historyEntry: OptimizationHistoryEntry = {
          previousText: item.optimizedDescription || "",
          previousAbilityCards: cloneAbilityCards(item.abilityCards),
          previousMetadata: item.positioningMetadata || null,
          replacedAt: new Date().toISOString(),
        }

        return {
          ...item,
          optimizedDescription: positionedText,
          abilityCards: cloneAbilityCards(abilityCards),
          positioningMetadata: metadata,
          optimizationHistory: [
            historyEntry,
            ...(item.optimizationHistory || []),
          ].slice(0, 10),
        }
      })

      return {
        resume: setEntityArray(state.resume, entityType, items),
      }
    }),

  // ─── Per-skill optimization (explicit, logged, validated) ─────

  optimizeSkill: (skillId, positionedText, metadata, abilityCards) =>
    set((state) => {
      // Deep-clone to guarantee zero reference sharing between skills
      const clonedCards = cloneAbilityCards(abilityCards)

      const before = state.resume.skills.map((s) => ({
        id: s.id,
        title: s.title,
        hasOptimized: !!s.optimizedDescription,
        cardsCount: s.abilityCards?.length || 0,
      }))

      console.log("[optimizeSkill] targeting:", skillId)
      console.log("[optimizeSkill] before:", JSON.stringify(before))

      let updatedCount = 0
      const updated = state.resume.skills.map((skill) => {
        if (skill.id !== skillId) return skill
        updatedCount++

        const historyEntry: OptimizationHistoryEntry = {
          previousText: skill.optimizedDescription || "",
          previousAbilityCards: cloneAbilityCards(skill.abilityCards),
          previousMetadata: skill.positioningMetadata || null,
          replacedAt: new Date().toISOString(),
        }

        return {
          ...skill,
          optimizedDescription: positionedText,
          abilityCards: clonedCards,
          positioningMetadata: metadata,
          optimizationHistory: [
            historyEntry,
            ...(skill.optimizationHistory || []),
          ].slice(0, 10),
        }
      })

      const after = updated.map((s) => ({
        id: s.id,
        title: s.title,
        hasOptimized: !!s.optimizedDescription,
        cardsCount: s.abilityCards?.length || 0,
      }))

      console.log("[optimizeSkill] updated count (must be 1):", updatedCount)
      console.log("[optimizeSkill] after:", JSON.stringify(after))

      if (updatedCount !== 1) {
        console.error(
          `[optimizeSkill] BUG: expected exactly 1 skill updated, got ${updatedCount}. skillId=${skillId}`
        )
      }

      // Verify no other skills were mutated (reference identity check)
      for (let i = 0; i < updated.length; i++) {
        if (updated[i].id !== skillId) {
          if (updated[i] !== state.resume.skills[i]) {
            console.error(
              `[optimizeSkill] BUG: skill ${updated[i].id} reference changed — was ${typeof state.resume.skills[i]}, now new object`
            )
          }
          if (
            updated[i].optimizedDescription !== state.resume.skills[i].optimizedDescription ||
            updated[i].abilityCards !== state.resume.skills[i].abilityCards
          ) {
            console.error(
              `[optimizeSkill] BUG: skill ${updated[i].id} content was mutated during optimizeSkill(${skillId})`
            )
          }
        }
      }

      // Detect if any two skills now share the same optimized content
      const final = updated as Skill[]
      if (detectContentDuplication(final, skillId)) {
        console.error(
          `[optimizeSkill] CONTENT DUPLICATION DETECTED — two skills have identical optimized content`
        )
      }

      return {
        resume: { ...state.resume, skills: final },
      }
    }),

  undoOptimization: (entityType, id) =>
    set((state) => {
      const items = getEntityArray(state.resume, entityType).map((item) => {
        if (item.id !== id) return item

        const history = item.optimizationHistory || []
        if (history.length === 0) return item

        const [restored, ...remaining] = history
        return {
          ...item,
          optimizedDescription: restored.previousText,
          abilityCards: cloneAbilityCards(restored.previousAbilityCards),
          positioningMetadata: restored.previousMetadata ?? undefined,
          optimizationHistory: remaining,
        }
      })

      return {
        resume: setEntityArray(state.resume, entityType, items),
      }
    }),

  clearOptimization: (entityType, id) =>
    set((state) => {
      const items = getEntityArray(state.resume, entityType).map((item) => {
        if (item.id !== id) return item
        return {
          ...item,
          optimizedDescription: "",
          positioningMetadata: undefined,
          optimizationHistory: [],
        }
      })

      return {
        resume: setEntityArray(state.resume, entityType, items),
      }
    }),

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

  setPhoto: (dataUrl) =>
    set((state) => ({
      resume: {
        ...state.resume,
        personalInfo: { ...state.resume.personalInfo, photo: dataUrl },
      },
    })),

  setHidePhotoInExport: (hide) =>
    set((state) => ({
      resume: {
        ...state.resume,
        personalInfo: { ...state.resume.personalInfo, hidePhotoInExport: hide },
      },
    })),

  // ─── Work Experience ────────────────────────────────────

  addWorkExperience: () =>
    set((state) => ({
      resume: {
        ...state.resume,
        workExperience: [...state.resume.workExperience, blankWorkExperience()],
      },
    })),

  updateWorkExperience: (id, data) =>
    set((state) => ({
      resume: {
        ...state.resume,
        workExperience: state.resume.workExperience.map((exp) =>
          exp.id === id ? { ...exp, ...data } : exp
        ),
      },
    })),

  removeWorkExperience: (id) =>
    set((state) => ({
      resume: {
        ...state.resume,
        workExperience: state.resume.workExperience.filter((exp) => exp.id !== id),
      },
    })),

  // ─── Project Experience ─────────────────────────────────

  addProjectExperience: () =>
    set((state) => ({
      resume: {
        ...state.resume,
        projectExperience: [...state.resume.projectExperience, blankProjectExperience()],
      },
    })),

  updateProjectExperience: (id, data) =>
    set((state) => ({
      resume: {
        ...state.resume,
        projectExperience: state.resume.projectExperience.map((proj) =>
          proj.id === id ? { ...proj, ...data } : proj
        ),
      },
    })),

  removeProjectExperience: (id) =>
    set((state) => ({
      resume: {
        ...state.resume,
        projectExperience: state.resume.projectExperience.filter((proj) => proj.id !== id),
      },
    })),

  // ─── Education ──────────────────────────────────────────

  addEducation: () =>
    set((state) => ({
      resume: {
        ...state.resume,
        education: [...state.resume.education, blankEducation()],
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

  // ─── Skills ─────────────────────────────────────────────

  addSkill: (title, description) =>
    set((state) => ({
      resume: {
        ...state.resume,
        skills: [...state.resume.skills, { id: uuid(), title, description, optimizedDescription: "", abilityCards: [] }],
      },
    })),

  updateSkill: (id, data) =>
    set((state) => ({
      resume: {
        ...state.resume,
        skills: state.resume.skills.map((s) =>
          s.id === id ? { ...s, ...data } : s
        ),
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

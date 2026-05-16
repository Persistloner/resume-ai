/**
 * @deprecated v3 uses implicit capability fusion — ability cards are no longer
 * generated. This type remains for backward compat with old cached results.
 */
export interface AbilityCard {
  title: string
  /** 真实经历 — what the user ACTUALLY did, facts only */
  realExperience: string
  /** 能力提炼 — what capabilities were developed from this experience */
  abilityExtraction: string
  /** JD迁移 — how these capabilities transfer to the target role */
  jdMigration: string
}

export interface PersonalInfo {
  fullName: string
  email: string
  phone: string
  location: string
  title: string
  summary: string
  /** Data URL (base64) of the uploaded photo. Empty string if no photo. */
  photo: string
  /** When true, photo is hidden in PDF export (ATS-friendly mode) */
  hidePhotoInExport: boolean
}

/**
 * Positioning metadata — stored for undo/redo and backward compat.
 *
 * In v3 (implicit capability fusion), most fields are empty since the AI
 * outputs a single natural paragraph instead of structured analysis.
 */
export interface PositioningMetadata {
  /** @deprecated v3 no longer generates role persona text */
  rolePersona: string
  /** @deprecated v3 no longer generates explicit transferable skill lists */
  transferableSkills: string[]
  /** @deprecated v3 no longer generates core insight text */
  coreInsight: string
  /** @deprecated v3 no longer generates scene mapping text */
  sceneMapping: string
  /** @deprecated v3 no longer generates skill type label */
  skillType: string
  /** ISO timestamp of when this positioning was generated */
  positionedAt: string
  /** Whether this positioning was generated with a target JD */
  jdMode: boolean
}

export interface OptimizationHistoryEntry {
  /** The previous optimizedDescription value (for undo) */
  previousText: string
  /** The previous ability cards (for undo) */
  previousAbilityCards?: AbilityCard[]
  /** The previous positioning metadata (for undo) */
  previousMetadata: PositioningMetadata | null
  /** ISO timestamp of when this entry was superseded */
  replacedAt: string
}

export interface WorkExperience {
  id: string
  company: string
  role: string
  startDate: string
  endDate: string
  current: boolean
  description: string
  optimizedDescription: string
  abilityCards?: AbilityCard[]
  positioningMetadata?: PositioningMetadata
  optimizationHistory?: OptimizationHistoryEntry[]
}

export interface ProjectExperience {
  id: string
  name: string
  role: string
  duration: string
  description: string
  optimizedDescription: string
  abilityCards?: AbilityCard[]
  positioningMetadata?: PositioningMetadata
  optimizationHistory?: OptimizationHistoryEntry[]
}

export interface Education {
  id: string
  school: string
  degree: string
  field: string
  startDate: string
  endDate: string
}

export interface Skill {
  id: string
  title: string
  description: string
  optimizedDescription: string
  abilityCards?: AbilityCard[]
  positioningMetadata?: PositioningMetadata
  optimizationHistory?: OptimizationHistoryEntry[]
}

export interface Resume {
  personalInfo: PersonalInfo
  workExperience: WorkExperience[]
  projectExperience: ProjectExperience[]
  education: Education[]
  skills: Skill[]
}

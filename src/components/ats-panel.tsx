"use client"

import { useCallback } from "react"
import { useResumeStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Target,
  Search,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

// ─── Score Ring ─────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 75
      ? "#22c55e" // green-500
      : score >= 50
        ? "#f59e0b" // amber-500
        : "#ef4444" // red-500

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="6"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{score}</span>
      </div>
    </div>
  )
}

// ─── Flatten Resume Helper ──────────────────────────────────────

function flattenResumeToText(): string {
  const store = useResumeStore.getState()
  const r = store.resume

  const parts: string[] = []

  if (r.personalInfo.title) parts.push(`职位：${r.personalInfo.title}`)
  if (r.personalInfo.summary) parts.push(`简介：${r.personalInfo.summary}`)

  for (const exp of r.experience) {
    if (exp.company || exp.position || exp.description) {
      parts.push(
        `工作经历：${exp.company} ${exp.position} ${exp.description}`.trim()
      )
    }
  }

  for (const edu of r.education) {
    if (edu.school || edu.field) {
      parts.push(`教育：${edu.school} ${edu.degree} ${edu.field}`.trim())
    }
  }

  if (r.skills.length > 0) {
    parts.push(`技能：${r.skills.map((s) => s.name).join("、")}`)
  }

  return parts.join("\n").trim()
}

// ─── Main Component ─────────────────────────────────────────────

export function ATSPanel() {
  const targetJD = useResumeStore((s) => s.targetJD)
  const atsLoading = useResumeStore((s) => s.atsLoading)
  const atsError = useResumeStore((s) => s.atsError)
  const atsScore = useResumeStore((s) => s.atsScore)
  const jdKeywords = useResumeStore((s) => s.jdKeywords)
  const roleType = useResumeStore((s) => s.roleType)
  const coreRequirements = useResumeStore((s) => s.coreRequirements)
  const matchedSkills = useResumeStore((s) => s.matchedSkills)
  const missingSkills = useResumeStore((s) => s.missingSkills)
  const aiSuggestions = useResumeStore((s) => s.aiSuggestions)
  const setATSAnalysis = useResumeStore((s) => s.setATSAnalysis)
  const setATSLoading = useResumeStore((s) => s.setATSLoading)
  const setATSError = useResumeStore((s) => s.setATSError)

  const hasJD = targetJD.trim().length > 0
  const hasAnalysis = atsScore !== null

  const handleAnalyze = useCallback(async () => {
    if (!hasJD) {
      toast.warning("请先填写目标岗位 JD")
      return
    }

    const resumeSummary = flattenResumeToText()
    if (!resumeSummary) {
      toast.warning("请先完善简历内容")
      return
    }

    setATSLoading(true)

    try {
      const res = await fetch("/api/analyze-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetJD, resumeSummary }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "分析失败")
      }

      setATSAnalysis(data)
      toast.success("ATS 分析完成")
    } catch (error) {
      const msg = error instanceof Error ? error.message : "分析失败"
      setATSError(msg)
      toast.error(msg)
    }
  }, [hasJD, targetJD, setATSLoading, setATSAnalysis, setATSError])

  // ── Shared wrapper for all states ──────────────────────────────
  const PanelWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="border rounded-lg mt-4 overflow-hidden">
      {children}
    </div>
  )

  const PanelHeader = ({
    icon,
    title,
    action,
  }: {
    icon: React.ReactNode
    title: string
    action?: React.ReactNode
  }) => (
    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-tight">
        {icon}
        {title}
      </div>
      {action}
    </div>
  )

  // ── Empty state (no JD) ─────────────────────────────────────
  if (!hasJD) {
    return (
      <PanelWrapper>
        <PanelHeader icon={<Target className="size-3.5" />} title="ATS 匹配分析" />
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            填写目标岗位 JD 后，可进行匹配度分析
          </p>
        </div>
      </PanelWrapper>
    )
  }

  // ── Loading state ───────────────────────────────────────────
  if (atsLoading) {
    return (
      <PanelWrapper>
        <PanelHeader
          icon={<Loader2 className="size-3.5 animate-spin text-primary" />}
          title="ATS 匹配分析"
        />
        <div className="px-4 py-8 flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">
            分析 JD 要求与简历匹配度...
          </p>
        </div>
      </PanelWrapper>
    )
  }

  // ── Error state ─────────────────────────────────────────────
  if (atsError && !hasAnalysis) {
    return (
      <PanelWrapper>
        <PanelHeader
          icon={<AlertCircle className="size-3.5 text-destructive" />}
          title="ATS 匹配分析"
        />
        <div className="px-4 py-6 flex flex-col items-center gap-3">
          <p className="text-xs text-destructive text-center">{atsError}</p>
          <Button variant="outline" size="sm" onClick={handleAnalyze} className="gap-1.5 text-xs">
            <RefreshCw className="size-3" />
            重试
          </Button>
        </div>
      </PanelWrapper>
    )
  }

  // ── No analysis yet (JD exists but not analyzed) ────────────
  if (!hasAnalysis) {
    return (
      <PanelWrapper>
        <PanelHeader
          icon={<Target className="size-3.5" />}
          title="ATS 匹配分析"
          action={
            <Button
              variant="outline"
              size="xs"
              onClick={handleAnalyze}
              className="gap-1.5 text-[11px] h-7"
            >
              <Sparkles className="size-3" />
              分析
            </Button>
          }
        />
        <div className="px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            分析简历与目标岗位的匹配度
          </p>
        </div>
      </PanelWrapper>
    )
  }

  // ── Full Analysis ───────────────────────────────────────────
  return (
    <PanelWrapper>
      <PanelHeader
        icon={<Target className="size-3.5" />}
        title="ATS 匹配分析"
        action={
          <Button
            variant="ghost"
            size="xs"
            onClick={handleAnalyze}
            disabled={atsLoading}
            className="gap-1 text-[11px] h-7"
          >
            <RefreshCw className="size-3" />
          </Button>
        }
      />

      <div className="px-4 py-4 space-y-3.5">
        {/* Score + Role */}
        <div className="bg-muted/20 rounded-lg py-3 px-4">
          <ScoreRing score={atsScore!} />
          <p className="text-xs text-center text-muted-foreground mt-2 font-medium">
            {roleType || "匹配度评分"}
          </p>
        </div>

        {/* JD Keywords */}
        {jdKeywords.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-1.5">
              <Search className="size-3" />
              关键词
            </div>
            <div className="flex flex-wrap gap-1">
              {jdKeywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="text-[11px]">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        {(matchedSkills.length > 0 || missingSkills.length > 0) && (
          <div className="border-t" />
        )}

        {/* Matched Skills */}
        {matchedSkills.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 mb-1.5">
              <CheckCircle2 className="size-3" />
              已匹配 · {matchedSkills.length}
            </div>
            <div className="flex flex-wrap gap-1">
              {matchedSkills.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="text-[11px] border-emerald-200 text-emerald-700 bg-emerald-50/50"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Missing Skills */}
        {missingSkills.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600 mb-1.5">
              <XCircle className="size-3" />
              待补充 · {missingSkills.length}
            </div>
            <div className="flex flex-wrap gap-1">
              {missingSkills.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="text-[11px] border-rose-200 text-rose-700 bg-rose-50/50"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <>
            <div className="border-t" />
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 mb-2">
                <Lightbulb className="size-3" />
                优化建议
              </div>
              <div className="space-y-1.5">
                {aiSuggestions.map((s, i) => (
                  <div
                    key={i}
                    className="bg-muted/30 rounded-md px-2.5 py-2 text-[11px] leading-relaxed"
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Error banner */}
      {atsError && hasAnalysis && (
        <div className="px-4 pb-3">
          <p className="text-[11px] text-destructive flex items-center gap-1">
            <AlertCircle className="size-3" />
            {atsError}
          </p>
        </div>
      )}
    </PanelWrapper>
  )
}

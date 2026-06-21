import Link from "next/link"
import { FileText, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <main className="flex flex-col items-center gap-5 text-center px-6 py-24 max-w-3xl">
        {/* Brand badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-5 py-2 text-sm font-semibold text-primary shadow-sm shadow-primary/[0.06]">
          <Sparkles className="size-4" />
          ResumeAI
        </div>

        {/* H1 */}
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-relaxed">
          打造一份
          <span className="text-primary"> 令人印象深刻的简历</span>
        </h1>

        {/* Subtitle — split into two lines */}
        <p className="text-base text-muted-foreground max-w-lg leading-relaxed">
          支持 JD 分析、AI 优化、实时预览与 PDF 导出，
          <br />
          帮助求职者快速打造更具竞争力的简历。
        </p>

        {/* CTAs */}
        <div className="flex gap-4 mt-3">
          <Button
            render={<Link href="/editor" />}
            nativeButton={false}
            size="lg"
            className="h-11 px-6 text-[0.9rem] shadow-lg shadow-primary/15 hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
          >
            <ArrowRight className="size-4" />
            开始创建
          </Button>
          <Button
            variant="outline"
            render={<Link href="/editor" />}
            nativeButton={false}
            size="lg"
            className="h-11 px-6 text-[0.9rem] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
          >
            <FileText className="size-4" />
            查看示例
          </Button>
        </div>

        {/* Feature hints — lightweight pill tags */}
        <div className="flex gap-3 justify-center flex-wrap">
          <span className="px-3 py-1 rounded-full bg-white text-gray-500 text-sm">JD 智能分析</span>
          <span className="px-3 py-1 rounded-full bg-white text-gray-500 text-sm">AI 简历优化</span>
          <span className="px-3 py-1 rounded-full bg-white text-gray-500 text-sm">实时预览</span>
          <span className="px-3 py-1 rounded-full bg-white text-gray-500 text-sm">PDF 导出</span>
        </div>
      </main>
    </div>
  )
}

import Link from "next/link"
import { FileText, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-8 text-center px-6 py-32 max-w-2xl">
        <div className="flex items-center gap-3 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
          <Sparkles className="size-4" />
          智能简历生成器
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-foreground leading-tight">
          打造一份
          <span className="text-primary block">令人印象深刻的简历</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-md">
          简洁易用的简历编辑器，实时预览、AI 辅助优化，助你快速制作专业简历。
        </p>

        <div className="flex gap-3 mt-4">
          <Button render={<Link href="/editor" />} nativeButton={false}>
            <ArrowRight className="size-4" />
            开始创建
          </Button>
          <Button variant="outline" render={<Link href="/editor" />} nativeButton={false}>
            <FileText className="size-4" />
            查看示例
          </Button>
        </div>
      </main>
    </div>
  )
}

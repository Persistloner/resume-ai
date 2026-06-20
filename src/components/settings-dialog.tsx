"use client"

import { useState, useEffect } from "react"
import { useResumeStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Key, Eye, EyeOff, Trash2, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import { loadAIConfig, saveAIConfig, clearAIConfig, getPresets, type PresetId } from "@/lib/api-key-store"

const PRESETS = getPresets()

export function SettingsDialog() {
  const settingsOpen = useResumeStore((s) => s.settingsOpen)
  const closeSettings = useResumeStore((s) => s.closeSettings)

  const [apiKey, setApiKey] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [model, setModel] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [testing, setTesting] = useState(false)

  // Load existing config when dialog opens
  useEffect(() => {
    if (settingsOpen) {
      const config = loadAIConfig()
      if (config) {
        setApiKey(config.apiKey)
        setBaseUrl(config.baseUrl)
        setModel(config.model)
        setConfigured(true)
      } else {
        setApiKey("")
        setBaseUrl("")
        setModel("")
        setConfigured(false)
      }
      setShowKey(false)
      setTestResult(null)
    }
  }, [settingsOpen])

  const applyPreset = (id: PresetId) => {
    const preset = PRESETS[id]
    setBaseUrl(preset.baseUrl)
    setModel(preset.model)
    setTestResult(null)
  }

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.warning("请输入 API Key")
      return
    }
    if (!baseUrl.trim()) {
      toast.warning("请输入 Base URL")
      return
    }
    if (!model.trim()) {
      toast.warning("请输入 Model")
      return
    }
    saveAIConfig({ apiKey: apiKey.trim(), baseUrl: baseUrl.trim(), model: model.trim() })
    setConfigured(true)
    setTestResult(null)
    toast.success("API 配置已保存到本地")
  }

  const handleClear = () => {
    clearAIConfig()
    setApiKey("")
    setBaseUrl("")
    setModel("")
    setConfigured(false)
    setTestResult(null)
    toast.success("API 配置已清除")
  }

  const handleTest = async () => {
    if (!apiKey.trim() || !baseUrl.trim()) {
      toast.warning("请先填写 API Key 和 Base URL")
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`${baseUrl.trim()}/models`, {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      })
      setTestResult({
        ok: res.ok,
        message: res.ok ? "连接成功" : `连接失败 (${res.status})`,
      })
    } catch {
      setTestResult({ ok: false, message: "网络请求失败，请检查 Base URL" })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Dialog open={settingsOpen} onOpenChange={(open) => { if (!open) closeSettings() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI 设置</DialogTitle>
          <DialogDescription>
            配置你的 OpenAI Compatible API，Key 仅保存在浏览器本地
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status */}
          <div className={`rounded-lg px-4 py-3 flex items-center gap-3 ${
            configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}>
            {configured ? (
              <>
                <CheckCircle2 className="size-4 shrink-0" />
                <span className="text-sm">已配置 API — {model}</span>
              </>
            ) : (
              <>
                <AlertTriangle className="size-4 shrink-0" />
                <span className="text-sm">未配置 API — 请填写你的 API Key</span>
              </>
            )}
          </div>

          {/* Presets */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">快速预设</label>
            <div className="flex gap-2">
              {Object.entries(PRESETS).map(([id, preset]) => (
                <button
                  key={id}
                  onClick={() => applyPreset(id as PresetId)}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium border transition-colors ${
                    baseUrl === preset.baseUrl
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {id === "deepseek" ? "DeepSeek" : "OpenRouter"}
                </button>
              ))}
            </div>
          </div>

          {/* Base URL */}
          <div>
            <label className="text-sm font-medium">Base URL</label>
            <Input
              value={baseUrl}
              onChange={(e) => { setBaseUrl(e.target.value); setTestResult(null) }}
              placeholder="https://api.deepseek.com/v1"
              className="mt-1.5 text-xs font-mono"
            />
          </div>

          {/* Model */}
          <div>
            <label className="text-sm font-medium">Model</label>
            <Input
              value={model}
              onChange={(e) => { setModel(e.target.value); setTestResult(null) }}
              placeholder="deepseek-chat"
              className="mt-1.5 text-xs font-mono"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="text-sm font-medium">API Key</label>
            <div className="relative mt-1.5">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setTestResult(null) }}
                placeholder="sk-..."
                className="pr-10 text-xs font-mono"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`flex items-center gap-2 text-xs rounded-md px-3 py-2 ${
              testResult.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}>
              {testResult.ok ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
              {testResult.message}
            </div>
          )}

          {/* Security notice */}
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <Key className="size-3 inline mr-1" />
            Key 仅保存在你的浏览器本地，不会上传到服务器或数据库。请勿在公共电脑上保存自己的 Key。
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={handleTest}
              disabled={testing || !apiKey.trim() || !baseUrl.trim()}
              className="flex-1 text-xs gap-1.5"
            >
              {testing ? <Loader2 className="size-3 animate-spin" /> : null}
              测试连接
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!apiKey.trim() || !baseUrl.trim() || !model.trim()}
              className="flex-1 text-xs gap-1.5"
            >
              保存
            </Button>
            {configured && (
              <Button
                variant="ghost" size="sm"
                onClick={handleClear}
                className="text-xs gap-1.5 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

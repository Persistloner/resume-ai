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
import { Key, Eye, EyeOff, Trash2, CheckCircle2, AlertTriangle, Loader2, ExternalLink, ChevronDown } from "lucide-react"
import {
  loadAIConfig, saveAIConfig, clearAIConfig, hasAIConfig,
  maskApiKey, PROVIDERS, type AIConfig,
} from "@/lib/api-key-store"

export function SettingsDialog() {
  const settingsOpen = useResumeStore((s) => s.settingsOpen)
  const closeSettings = useResumeStore((s) => s.closeSettings)

  const [provider, setProvider] = useState("deepseek")
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [advanceOpen, setAdvanceOpen] = useState(false)
  const [customBaseUrl, setCustomBaseUrl] = useState("")
  const [customModel, setCustomModel] = useState("")
  const [configured, setConfigured] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [testing, setTesting] = useState(false)

  // Sync base URL + model when provider changes
  const providerDef = PROVIDERS[provider]

  const effectiveBaseUrl = customBaseUrl || providerDef.baseUrl
  const effectiveModel = customModel || model || providerDef.defaultModel

  // Load existing config
  useEffect(() => {
    if (settingsOpen) {
      const config = loadAIConfig()
      if (config) {
        setApiKey(config.apiKey)
        setModel(config.model)
        // Try to detect provider from base URL
        const matched = Object.entries(PROVIDERS).find(
          ([, def]) => def.baseUrl === config.baseUrl
        )
        if (matched) {
          setProvider(matched[0])
          setCustomBaseUrl("")
          setCustomModel("")
          if (!PROVIDERS[matched[0]].models.includes(config.model)) {
            setCustomModel(config.model)
          } else {
            setModel(config.model)
          }
        } else {
          setCustomBaseUrl(config.baseUrl)
          setCustomModel(config.model)
        }
        setConfigured(true)
      } else {
        resetForm()
      }
      setShowKey(false)
      setTestResult(null)
      setAdvanceOpen(false)
    }
  }, [settingsOpen])

  const resetForm = () => {
    setProvider("deepseek")
    setApiKey("")
    setModel("")
    setShowKey(false)
    setConfigured(false)
    setCustomBaseUrl("")
    setCustomModel("")
  }

  const handleSave = () => {
    if (!apiKey.trim()) { toast.warning("请输入 API Key"); return }
    saveAIConfig({ apiKey: apiKey.trim(), baseUrl: effectiveBaseUrl, model: effectiveModel })
    setConfigured(true)
    setTestResult(null)
    toast.success("配置已保存到本地")
  }

  const handleClear = () => {
    clearAIConfig()
    resetForm()
    toast.success("配置已清除")
  }

  const handleTest = async () => {
    if (!apiKey.trim()) { toast.warning("请先输入 API Key"); return }
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`${effectiveBaseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      })
      setTestResult({
        ok: res.ok,
        message: res.ok ? "连接成功" : `连接失败 (${res.status})`,
      })
    } catch {
      setTestResult({ ok: false, message: "网络请求失败，请检查网络" })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Dialog open={settingsOpen} onOpenChange={(open) => { if (!open) closeSettings() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>模型配置</DialogTitle>
          <DialogDescription>
            配置你的模型服务，用于简历分析和 AI 优化
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
                <span className="text-sm">
                  已配置：{apiKey ? maskApiKey(apiKey) : ""} · {effectiveModel}
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="size-4 shrink-0" />
                <span className="text-sm">未配置模型 — 请选择提供商并填写 API Key</span>
              </>
            )}
          </div>

          {/* Provider */}
          <div>
            <label className="text-sm font-medium">模型提供商</label>
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value)
                setModel("")
                setTestResult(null)
              }}
              className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {Object.entries(PROVIDERS).map(([id, def]) => (
                <option key={id} value={id}>{def.label}</option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="text-sm font-medium">API Key</label>
            <div className="relative mt-1.5">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setTestResult(null) }}
                placeholder={`${providerDef.label} API Key`}
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
            {provider === "openrouter" && (
              <div className="flex items-center gap-2 mt-1.5">
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  获取 OpenRouter API Key <ExternalLink className="size-2.5" />
                </a>
                <span className="text-[10px] text-muted-foreground">
                  Base URL 是程序调用地址，不是网页访问地址
                </span>
              </div>
            )}
          </div>

          {/* Model */}
          <div>
            <label className="text-sm font-medium">模型</label>
            <select
              value={customModel || model || providerDef.defaultModel}
              onChange={(e) => {
                const val = e.target.value
                if (val === "__custom__") {
                  setCustomModel("")
                } else if (providerDef.models.includes(val)) {
                  setModel(val)
                  setCustomModel("")
                } else {
                  setCustomModel(val)
                }
              }}
              className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {providerDef.models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value="__custom__">自定义模型...</option>
            </select>
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

          {/* Advanced */}
          <div>
            <button
              onClick={() => setAdvanceOpen(!advanceOpen)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={`size-3 transition-transform ${advanceOpen ? "rotate-180" : ""}`} />
              高级设置（可选）
            </button>
            {advanceOpen && (
              <div className="mt-2 space-y-3 pl-1">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Base URL</label>
                  <Input
                    value={customBaseUrl || providerDef.baseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    placeholder={providerDef.baseUrl}
                    className="mt-1 text-xs font-mono h-8"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    普通用户无需修改。支持任何 OpenAI Compatible API 地址。
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">自定义 Model</label>
                  <Input
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="如: meta-llama/llama-4-maverick"
                    className="mt-1 text-xs font-mono h-8"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Security */}
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <Key className="size-3 inline mr-1" />
            API Key 仅保存在你的浏览器本地，不会上传到服务器或数据库。请勿在公共电脑上保存自己的 API Key。
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={handleTest}
              disabled={testing || !apiKey.trim()}
              className="flex-1 text-xs gap-1.5"
            >
              {testing ? <Loader2 className="size-3 animate-spin" /> : null}
              测试连接
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!apiKey.trim()}
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

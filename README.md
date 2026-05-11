# Resume Builder — AI 智能简历生成器

AI 驱动的简历编辑与优化工具。支持 JD 匹配分析、ATS 评分、AI 经历优化、PDF/DOCX 导入解析、一键 PDF 导出。

## 功能

### 简历编辑
- **基本信息** — 姓名、职位、联系方式、个人简介
- **工作经历** — 多段经历，支持日期范围、"至今"标记
- **教育背景** — 学校、学位、专业、日期
- **技能标签** — 动态添加/删除技能

### AI 能力
- **经历优化** — 基于真实经历进行职业化提炼，支持通用模式与 JD 匹配模式
- **简历导入** — 上传 PDF/DOCX 自动解析并填充（DeepSeek 结构化提取）
- **ATS 匹配分析** — JD 关键词提取、匹配度评分、缺失能力识别、优化建议生成

### 导出
- **PDF 导出** — 一键导出标准 A4 格式简历，保持排版与中文显示

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router + Turbopack) |
| UI | React 19 + Tailwind CSS 4 + shadcn/ui |
| 状态管理 | Zustand 5 |
| AI | DeepSeek Chat API |
| PDF 解析 | pdf-parse v2 |
| DOCX 解析 | mammoth |
| PDF 导出 | html2pdf.js (html2canvas + jsPDF) |
| 文件上传 | react-dropzone |

## 本地启动

```bash
# 1. 安装依赖
npm install

# 2. 创建环境变量文件
cp .env.example .env.local

# 3. 编辑 .env.local，填入 DeepSeek API Key
# DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx

# 4. 启动开发服务器
npm run dev

# 5. 打开浏览器
# http://localhost:3000
```

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `DEEPSEEK_API_KEY` | 是 | DeepSeek API Key，用于 AI 优化、ATS 分析、简历解析 |

### 获取 DeepSeek API Key

1. 访问 [platform.deepseek.com](https://platform.deepseek.com)
2. 注册/登录账号
3. 进入 API Keys 页面，创建新 Key
4. 复制 Key 到 `.env.local` 中

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── optimize/route.ts      # AI 经历优化
│   │   ├── analyze-jd/route.ts    # ATS 匹配分析
│   │   └── resume/parse/route.ts  # 简历文件解析
│   ├── editor/page.tsx            # 编辑器页面
│   ├── layout.tsx                 # 根布局
│   └── page.tsx                   # 首页
├── components/
│   ├── ats-panel.tsx              # ATS 分析面板
│   ├── experience-form.tsx        # 工作经历表单
│   ├── education-form.tsx         # 教育经历表单
│   ├── personal-info-form.tsx     # 基本信息表单
│   ├── skills-form.tsx            # 技能表单
│   ├── jd-input.tsx               # 目标 JD 输入
│   ├── resume-form.tsx            # 表单容器（Tabs）
│   ├── resume-preview.tsx         # A4 实时预览
│   ├── export-pdf-button.tsx      # PDF 导出按钮
│   ├── import-resume-dialog.tsx   # 简历导入对话框
│   └── ui/                        # shadcn/ui 组件
└── lib/
    ├── ai/
    │   ├── deepseek.ts            # DeepSeek API 客户端
    │   ├── prompts/
    │   │   ├── optimize-resume.ts # 经历优化 Prompt
    │   │   ├── analyze-jd.ts      # JD 分析 Prompt
    │   │   └── parse-resume.ts    # 简历解析 Prompt
    │   └── evals/                 # Prompt 评测系统
    ├── store.ts                   # Zustand 状态管理
    ├── types.ts                   # TypeScript 类型
    ├── export-pdf.ts              # PDF 导出工具
    └── mock-data.ts               # 示例数据
```

## Vercel 部署

### 步骤

1. **Fork/推送项目到 GitHub**

2. **在 Vercel 中导入项目**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project" → 选择 Git 仓库
   - Vercel 会自动识别 Next.js 项目

3. **配置环境变量**
   - 在项目 Settings → Environment Variables 中添加：
     ```
     DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
     ```
   - 部署环境选择：Production + Preview + Development

4. **部署**
   - 点击 "Deploy"
   - Vercel 自动执行 `next build` 并部署

5. **自定义域名（可选）**
   - Settings → Domains → 添加域名

### Vercel 配置注意事项

- **Serverless Function 超时**：Vercel Pro 默认 60s，AI API 调用通常在 5–15s 内完成，无需调整
- **请求体大小限制**：Serverless Function 默认 4.5MB。简历文件上传建议 < 4.5MB（可在 `next.config.ts` 中配置 `maxDuration`）
- **冷启动**：AI API 路由首次调用可能有 1–2s 冷启动延迟
- **环境变量**：务必在 Vercel Dashboard 中配置 `DEEPSEEK_API_KEY`，不要提交到 Git

## 部署检查清单

- [ ] `npm run build` 通过，无错误
- [ ] `.env.local` 中配置了 `DEEPSEEK_API_KEY`
- [ ] Vercel Dashboard 中已添加 `DEEPSEEK_API_KEY` 环境变量
- [ ] API 路由在部署后正常工作（可通过浏览器 DevTools Network 验证）
- [ ] PDF 导出在浏览器中正常触发下载
- [ ] 简历导入支持的文件类型（PDF/DOCX）正常解析
- [ ] 首页 `/` 正常渲染
- [ ] 编辑器 `/editor` 正常渲染
- [ ] ATS 分析功能正常返回结果

## 已知限制

| 限制 | 说明 |
|------|------|
| PDF 导入仅支持文本型 PDF | 扫描件/图片型 PDF 无法提取文字 |
| DOCX 不支持嵌入式图表 | 图表/SmartArt 不会被提取 |
| AI 依赖网络 | 所有 AI 功能需要 DeepSeek API 可访问 |
| Vercel 4.5MB 上传限制 | 简历文件通常 < 1MB，一般不受影响 |

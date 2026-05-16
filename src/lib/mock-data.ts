import { Resume } from "./types"

export const mockResume: Resume = {
  personalInfo: {
    fullName: "张三",
    email: "zhangsan@example.com",
    phone: "138-0000-1234",
    location: "北京",
    title: "高级前端工程师",
    summary:
      "拥有 5 年前端开发经验，深度使用 React、TypeScript 和 Next.js。主导过多个大型企业级项目的前端架构设计与开发，注重代码质量和用户体验。",
    photo: "",
    hidePhotoInExport: false,
  },
  workExperience: [
    {
      id: "we-1",
      company: "字节跳动",
      role: "高级前端工程师",
      startDate: "2022-03",
      endDate: "",
      current: true,
      description:
        "负责抖音电商平台前端架构优化，使用 React + TypeScript 重构核心模块，实现页面加载性能提升 40%。带领 4 人前端小组完成多个迭代交付。",
      optimizedDescription: "",
    },
    {
      id: "we-2",
      company: "阿里巴巴",
      role: "前端工程师",
      startDate: "2019-07",
      endDate: "2022-02",
      current: false,
      description:
        "参与淘宝商家后台管理系统开发，使用 React 和 Ant Design 构建复杂表单和数据展示页面。推动团队引入 TypeScript，提升代码可维护性。",
      optimizedDescription: "",
    },
  ],
  projectExperience: [
    {
      id: "pe-1",
      name: "电商大促活动页",
      role: "前端负责人",
      duration: "2023.10 — 2023.12",
      description:
        "主导双11活动页面开发，基于 Next.js SSG 方案实现秒级首屏加载，承载千万级 PV。负责性能监控与优化，上线后页面性能评分从 65 提升至 92。",
      optimizedDescription: "",
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "清华大学",
      degree: "本科",
      field: "计算机科学与技术",
      startDate: "2015-09",
      endDate: "2019-06",
    },
  ],
  skills: [
    {
      id: "sk-1",
      title: "前端框架与工程化",
      description:
        "深度使用 React 和 Next.js 完成多个大型企业级项目的前端架构与迭代，熟悉 SSR/SSG 方案选型与性能优化。基于 TypeScript 建立团队代码规范，推动项目从 JavaScript 迁移，显著降低线上类型缺陷。",
      optimizedDescription: "",
    },
    {
      id: "sk-2",
      title: "样式与设计系统",
      description:
        "熟练运用 Tailwind CSS 构建响应式界面与设计系统，具备将设计稿高效转化为可维护代码的能力，关注组件化与视觉一致性。",
      optimizedDescription: "",
    },
    {
      id: "sk-3",
      title: "工程构建与部署",
      description:
        "使用 Webpack 和 Vite 完成项目构建配置与优化，熟悉模块拆分、按需加载与构建性能调优。具备 Docker 容器化部署经验，能够完成开发到生产环境的构建链路搭建。",
      optimizedDescription: "",
    },
    {
      id: "sk-4",
      title: "数据层与 API",
      description:
        "基于 GraphQL 设计并实现前后端数据交互方案，在项目中落地查询优化与类型安全的数据层。有 Node.js 服务端开发经验，理解全栈数据流转。",
      optimizedDescription: "",
    },
  ],
}

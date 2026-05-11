import { Resume } from "./types"

export const mockResume: Resume = {
  personalInfo: {
    fullName: "张三",
    email: "zhangsan@example.com",
    phone: "138-0000-1234",
    location: "北京",
    title: "高级前端工程师",
    summary:
      "拥有 5 年前端开发经验，精通 React、TypeScript 和 Next.js。主导过多个大型企业级项目的前端架构设计与开发，注重代码质量和用户体验。",
  },
  experience: [
    {
      id: "exp-1",
      company: "字节跳动",
      position: "高级前端工程师",
      startDate: "2022-03",
      endDate: "",
      current: true,
      description:
        "负责抖音电商平台前端架构优化，使用 React + TypeScript 重构核心模块，实现页面加载性能提升 40%。带领 4 人前端小组完成多个迭代交付。",
    },
    {
      id: "exp-2",
      company: "阿里巴巴",
      position: "前端工程师",
      startDate: "2019-07",
      endDate: "2022-02",
      current: false,
      description:
        "参与淘宝商家后台管理系统开发，使用 React 和 Ant Design 构建复杂表单和数据展示页面。推动团队引入 TypeScript，提升代码可维护性。",
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
    { id: "sk-1", name: "React" },
    { id: "sk-2", name: "TypeScript" },
    { id: "sk-3", name: "Next.js" },
    { id: "sk-4", name: "Node.js" },
    { id: "sk-5", name: "Tailwind CSS" },
    { id: "sk-6", name: "GraphQL" },
    { id: "sk-7", name: "Webpack/Vite" },
    { id: "sk-8", name: "Docker" },
  ],
}

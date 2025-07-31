# 自动签到脚本管理系统

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-16+-green.svg)
![React](https://img.shields.io/badge/react-18+-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5+-blue.svg)

一个基于 React + Node.js 的自动签到脚本管理系统，支持多账号管理、定时签到、状态监控和日志记录。

[功能特性](#-功能特性) • [技术栈](#-技术栈) • [快速开始](#-快速开始) • [项目结构](#-项目结构) • [开发进度](#-开发进度)

</div>

## 🚀 功能特性

- **🔐 多账号Cookie管理** - 支持添加、编辑、删除多个签到账号
- **📚 抓包教程指导** - 内置详细的Cookie获取教程
- **⏰ 定时自动签到** - 基于 node-cron 的灵活定时任务
- **📊 签到状态监控** - 实时监控签到状态和结果
- **📝 执行日志记录** - 完整的操作日志和错误追踪
- **🎨 现代化界面** - 基于 Shadcn/ui 的美观界面设计

## 🛠️ 技术栈

### 前端技术
- **框架**: React 18 + TypeScript + Vite
- **UI组件**: Shadcn/ui + Radix UI
- **样式**: Tailwind CSS
- **状态管理**: React Hooks
- **图表**: Recharts
- **表单**: React Hook Form

### 后端技术
- **运行时**: Node.js + TypeScript
- **框架**: Express.js
- **数据库**: SQLite3
- **定时任务**: node-cron
- **HTTP客户端**: Axios
- **日志**: Winston
- **安全**: Helmet + CORS + Rate Limiting

## 📁 项目结构

```
auto-signin-system/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── controllers/     # 控制器层
│   │   ├── services/        # 业务逻辑层
│   │   ├── routes/          # 路由定义
│   │   ├── models/          # 数据模型
│   │   └── utils/           # 工具函数
│   └── package.json
├── frontend/               # 前端应用
│   └── signin-frontend/
│       ├── src/
│       │   └── components/  # React组件
│       └── package.json
├── logs/                   # 日志文件
├── 启动系统.bat            # 一键启动脚本
└── README.md              # 项目说明文档
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/1150260034/auto-signin-system.git
cd auto-signin-system

# 安装后端依赖
cd backend
npm install

# 安装前端依赖  
cd ../frontend/signin-frontend
npm install
```

### 启动开发环境

#### 方式1: 使用批处理脚本 (Windows)
```bash
# 双击运行
启动系统.bat
```

#### 方式2: 手动启动
```bash
# 启动后端服务 (端口: 3001)
cd backend
npm run dev

# 启动前端服务 (端口: 5173)  
cd frontend/signin-frontend
npm run dev
```

### 访问应用
- 前端界面: http://localhost:5173
- 后端API: http://localhost:3001

## 🎯 开发进度

### ✅ 已完成
- [x] 项目基础架构搭建
- [x] 前端 React + TypeScript + Vite 环境配置
- [x] 后端 Node.js + Express + TypeScript 环境配置
- [x] 数据库 SQLite 初始化和模型设计
- [x] Shadcn/ui 组件库集成
- [x] 主界面布局和导航设计
- [x] Express 服务器基础配置
- [x] 路由系统设计 (accounts, tasks, logs, signin)
- [x] 控制器层和服务层实现

### 🔄 进行中
- [/] 账号管理功能模块
  - [x] 账号CRUD操作API
  - [x] Cookie验证机制
  - [ ] 账号状态监控

### 📋 待开发
- [ ] 签到执行引擎
- [ ] 定时任务调度系统
- [ ] 日志记录和查看功能
- [ ] 系统优化和部署配置

## 🔧 开发脚本

```bash
# 后端开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器

# 前端开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产版本
```

## 📸 界面预览

> 界面截图将在功能完善后添加

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [提交问题](https://github.com/1150260034/auto-signin-system/issues)
- 项目维护者: [@1150260034](https://github.com/1150260034)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个星标支持一下！**

Made with ❤️ by [1150260034](https://github.com/1150260034)

</div>
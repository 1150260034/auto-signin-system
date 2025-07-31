# 自动签到脚本管理系统

一个基于 Node.js + React 的自动签到脚本管理系统，支持多账号管理、定时签到、日志记录等功能。

## 功能特性

- 🔐 **多账号Cookie管理** - 支持添加、编辑、删除多个签到账号
- 📚 **抓包教程指导** - 内置详细的抓包教程，帮助用户获取Cookie
- ⏰ **定时自动签到** - 支持自定义定时任务，自动执行签到
- 📊 **签到状态监控** - 实时监控签到状态和执行结果
- 📝 **执行日志记录** - 详细记录签到执行过程和结果

## 技术栈

### 后端
- **Node.js** + **Express.js** + **TypeScript**
- **SQLite** 数据库
- **node-cron** 定时任务调度
- **axios** HTTP客户端
- **winston** 日志记录

### 前端
- **React** + **TypeScript**
- **shadcn/ui** 组件库
- **Tailwind CSS** 样式框架
- **Vite** 构建工具

## 快速开始

### 方式一：使用启动脚本（推荐）

1. 克隆项目到本地
2. 运行启动脚本：
   ```bash
   # Windows
   启动系统.bat
   
   # 选择对应的功能：
   # 1 - 启动完整系统（前端+后端）
   # 2 - 仅启动后端服务
   # 3 - 仅启动前端服务
   # 4 - 系统状态检查
   # 5 - 退出系统
   ```

### 方式二：手动启动

#### 后端服务
```bash
cd auto-signin-system/backend
npm install
npm run dev
```

#### 前端服务
```bash
cd auto-signin-system/frontend/signin-frontend
npm install
npm run dev
```

### 方式三：Docker部署

```bash
# 复制环境配置文件
cp .env.example .env

# 编辑配置文件
nano .env

# 使用部署脚本
chmod +x deploy.sh
./deploy.sh production
```

## 访问地址

- **前端界面**: http://localhost:5173
- **后端API**: http://localhost:3001
- **API文档**: http://localhost:3001/api-docs

## 系统管理

### 健康检查
```bash
chmod +x health-check.sh
./health-check.sh
```

### 数据备份
```bash
chmod +x backup.sh
./backup.sh
```

### PM2进程管理
```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start pm2.config.js --env production

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启服务
pm2 restart auto-signin-system
```

## 配置说明

### 环境变量配置 (.env)

```bash
# 应用环境
NODE_ENV=development

# 服务器配置
PORT=3001
HOST=localhost

# 数据库配置
DATABASE_PATH=./data/database.sqlite

# 日志配置
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# 安全配置
JWT_SECRET=your-super-secret-jwt-key
BCRYPT_ROUNDS=12

# CORS配置
CORS_ORIGIN=http://localhost:5173

# 签到配置
DEFAULT_TIMEOUT=30000
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY=5000

# 定时任务配置
ENABLE_SCHEDULER=true
DEFAULT_CRON_EXPRESSION=0 8 * * *
```

## 使用指南

### 1. 账号管理
- 点击"账号管理"标签页
- 添加新账号：填写账号名称、签到URL、Cookie等信息
- 编辑账号：修改已有账号的配置信息
- 删除账号：移除不需要的账号

### 2. 签到执行
- 点击"签到执行"标签页
- 选择要执行签到的账号
- 点击"执行签到"按钮
- 查看实时执行状态和结果

### 3. 定时任务
- 点击"定时任务"标签页
- 创建新任务：设置任务名称、执行时间、关联账号
- 启用/禁用任务：控制任务的执行状态
- 查看任务历史：查看任务执行记录

### 4. 日志查看
- 点击"执行日志"标签页
- 查看签到日志：查看签到执行的详细记录
- 查看系统日志：查看系统运行日志
- 导出日志：将日志导出为CSV或JSON格式

## 故障排除

### 常见问题

1. **启动脚本选择4闪退**
   - 已修复：更新了启动脚本的错误处理机制
   - 现在可以正常显示系统状态检查结果

2. **端口被占用**
   ```bash
   # 查看端口占用
   netstat -ano | findstr :3001
   netstat -ano | findstr :5173
   
   # 杀死占用进程
   taskkill /PID <进程ID> /F
   ```

3. **数据库连接失败**
   - 检查 `./data` 目录是否存在
   - 确保有足够的磁盘空间
   - 查看日志文件获取详细错误信息

4. **Cookie失效**
   - 重新抓取Cookie
   - 检查Cookie格式是否正确
   - 确认目标网站是否有反爬机制

### 日志文件位置

- **应用日志**: `./logs/app.log`
- **错误日志**: `./logs/error.log`
- **PM2日志**: `./logs/pm2-*.log`

## 开发指南

### 项目结构
```
auto-signin-system/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 业务逻辑
│   │   ├── routes/          # 路由配置
│   │   ├── models/          # 数据模型
│   │   └── utils/           # 工具函数
│   └── package.json
├── frontend/                # 前端应用
│   └── signin-frontend/
│       ├── src/
│       │   ├── components/  # React组件
│       │   └── lib/         # 工具库
│       └── package.json
├── data/                    # 数据文件
├── logs/                    # 日志文件
├── docker-compose.yml       # Docker配置
├── Dockerfile              # Docker镜像
├── deploy.sh               # 部署脚本
├── backup.sh               # 备份脚本
├── health-check.sh         # 健康检查
└── pm2.config.js           # PM2配置
```

### API接口文档

#### 账号管理
- `GET /api/accounts` - 获取账号列表
- `POST /api/accounts` - 创建新账号
- `PUT /api/accounts/:id` - 更新账号信息
- `DELETE /api/accounts/:id` - 删除账号

#### 签到执行
- `POST /api/signin/execute` - 执行单个账号签到
- `POST /api/signin/execute-all` - 执行所有账号签到
- `POST /api/signin/execute-batch` - 批量执行签到

#### 定时任务
- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks` - 创建新任务
- `PUT /api/tasks/:id` - 更新任务
- `DELETE /api/tasks/:id` - 删除任务

#### 日志管理
- `GET /api/logs` - 获取日志列表
- `GET /api/logs/signin` - 获取签到日志
- `GET /api/logs/system` - 获取系统日志
- `POST /api/logs/clear` - 清空日志

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 支持

如果您遇到问题或有建议，请：

1. 查看 [FAQ](docs/FAQ.md)
2. 搜索 [Issues](https://github.com/your-username/auto-signin-system/issues)
3. 创建新的 Issue

## 更新日志

### v1.0.0 (2024-01-31)
- ✅ 完成基础架构搭建
- ✅ 实现账号管理功能
- ✅ 实现签到执行引擎
- ✅ 实现定时任务调度
- ✅ 实现日志记录和查看
- ✅ 完成系统优化和部署配置
- ✅ 修复启动脚本问题

---

**注意**: 本系统仅供学习和研究使用，请遵守相关网站的使用条款和法律法规。
# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache sqlite

# 复制package.json文件
COPY backend/package*.json ./backend/
COPY frontend/signin-frontend/package*.json ./frontend/signin-frontend/

# 安装后端依赖
WORKDIR /app/backend
RUN npm ci --only=production

# 安装前端依赖并构建
WORKDIR /app/frontend/signin-frontend
RUN npm ci
COPY frontend/signin-frontend/ .
RUN npm run build

# 复制后端源代码
WORKDIR /app/backend
COPY backend/ .

# 编译TypeScript
RUN npm run build

# 创建必要的目录
RUN mkdir -p /app/data /app/logs

# 复制前端构建文件到后端静态目录
RUN mkdir -p /app/backend/dist/public
RUN cp -r /app/frontend/signin-frontend/dist/* /app/backend/dist/public/

# 暴露端口
EXPOSE 3001

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/app/data/database.sqlite
ENV LOG_FILE_PATH=/app/logs

# 启动应用
CMD ["npm", "start"]
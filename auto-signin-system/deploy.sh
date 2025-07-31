#!/bin/bash

# 自动签到系统部署脚本
# 使用方法: ./deploy.sh [development|production]

set -e

# 获取部署环境参数
ENVIRONMENT=${1:-development}

echo "========================================="
echo "  自动签到系统部署脚本"
echo "  环境: $ENVIRONMENT"
echo "========================================="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 创建必要的目录
echo "创建必要的目录..."
mkdir -p data logs ssl

# 检查环境配置文件
if [ ! -f .env ]; then
    echo "创建环境配置文件..."
    cp .env.example .env
    echo "请编辑 .env 文件配置您的环境变量"
fi

# 构建和启动服务
echo "构建Docker镜像..."
docker-compose build

echo "启动服务..."
if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose up -d
    echo "生产环境服务已启动"
    echo "访问地址: http://localhost"
    echo "API地址: http://localhost/api"
else
    docker-compose up -d auto-signin-app
    echo "开发环境服务已启动"
    echo "访问地址: http://localhost:3001"
    echo "API地址: http://localhost:3001/api"
fi

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 健康检查
echo "执行健康检查..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ 服务启动成功！"
else
    echo "❌ 服务启动失败，请检查日志"
    docker-compose logs
    exit 1
fi

echo "========================================="
echo "  部署完成！"
echo "========================================="
echo "管理命令:"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo "  查看状态: docker-compose ps"
echo "========================================="
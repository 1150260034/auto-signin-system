#!/bin/bash

# 自动签到系统健康检查脚本
# 使用方法: ./health-check.sh

set -e

echo "========================================="
echo "  自动签到系统健康检查"
echo "  检查时间: $(date)"
echo "========================================="

# 检查服务状态
check_service() {
    local service_name=$1
    local url=$2
    
    echo "检查 $service_name..."
    
    if curl -f -s "$url" > /dev/null; then
        echo "✅ $service_name 运行正常"
        return 0
    else
        echo "❌ $service_name 运行异常"
        return 1
    fi
}

# 检查端口占用
check_port() {
    local port=$1
    local service_name=$2
    
    echo "检查端口 $port ($service_name)..."
    
    if netstat -tuln | grep ":$port " > /dev/null; then
        echo "✅ 端口 $port 正在监听"
        return 0
    else
        echo "❌ 端口 $port 未被占用"
        return 1
    fi
}

# 检查磁盘空间
check_disk_space() {
    echo "检查磁盘空间..."
    
    local usage=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$usage" -lt 80 ]; then
        echo "✅ 磁盘空间充足 (使用率: ${usage}%)"
        return 0
    elif [ "$usage" -lt 90 ]; then
        echo "⚠️  磁盘空间不足 (使用率: ${usage}%)"
        return 1
    else
        echo "❌ 磁盘空间严重不足 (使用率: ${usage}%)"
        return 1
    fi
}

# 检查数据库文件
check_database() {
    echo "检查数据库文件..."
    
    if [ -f "./data/database.sqlite" ]; then
        local size=$(stat -f%z "./data/database.sqlite" 2>/dev/null || stat -c%s "./data/database.sqlite" 2>/dev/null)
        echo "✅ 数据库文件存在 (大小: ${size} bytes)"
        return 0
    else
        echo "❌ 数据库文件不存在"
        return 1
    fi
}

# 检查日志文件
check_logs() {
    echo "检查日志文件..."
    
    if [ -d "./logs" ]; then
        local log_count=$(find ./logs -name "*.log" | wc -l)
        echo "✅ 日志目录存在 (日志文件数: $log_count)"
        return 0
    else
        echo "⚠️  日志目录不存在"
        return 1
    fi
}

# 检查Docker容器状态
check_docker() {
    echo "检查Docker容器状态..."
    
    if command -v docker &> /dev/null; then
        local running_containers=$(docker ps --filter "name=auto-signin" --format "table {{.Names}}\t{{.Status}}" | tail -n +2)
        
        if [ -n "$running_containers" ]; then
            echo "✅ Docker容器运行状态:"
            echo "$running_containers"
            return 0
        else
            echo "⚠️  未发现运行中的Docker容器"
            return 1
        fi
    else
        echo "⚠️  Docker未安装或不可用"
        return 1
    fi
}

# 执行健康检查
echo "开始系统健康检查..."
echo ""

# 初始化检查结果
total_checks=0
passed_checks=0

# 执行各项检查
checks=(
    "check_port 3001 后端服务"
    "check_service 后端API http://localhost:3001/api/health"
    "check_database"
    "check_logs"
    "check_disk_space"
    "check_docker"
)

for check in "${checks[@]}"; do
    total_checks=$((total_checks + 1))
    if eval "$check"; then
        passed_checks=$((passed_checks + 1))
    fi
    echo ""
done

# 输出检查结果
echo "========================================="
echo "  健康检查完成"
echo "========================================="
echo "检查项目: $total_checks"
echo "通过项目: $passed_checks"
echo "失败项目: $((total_checks - passed_checks))"

if [ $passed_checks -eq $total_checks ]; then
    echo "🎉 系统运行状态良好！"
    exit 0
elif [ $passed_checks -gt $((total_checks / 2)) ]; then
    echo "⚠️  系统运行基本正常，但存在一些问题"
    exit 1
else
    echo "❌ 系统存在严重问题，请立即检查"
    exit 2
fi
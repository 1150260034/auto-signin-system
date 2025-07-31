#!/bin/bash

# 自动签到系统备份脚本
# 使用方法: ./backup.sh

set -e

# 配置
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="auto-signin-backup_$DATE"

echo "========================================="
echo "  自动签到系统备份脚本"
echo "  备份时间: $(date)"
echo "========================================="

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 创建临时备份目录
TEMP_BACKUP_DIR="$BACKUP_DIR/$BACKUP_NAME"
mkdir -p "$TEMP_BACKUP_DIR"

echo "开始备份..."

# 备份数据库
if [ -f "./data/database.sqlite" ]; then
    echo "备份数据库..."
    cp "./data/database.sqlite" "$TEMP_BACKUP_DIR/"
    echo "✅ 数据库备份完成"
else
    echo "⚠️  数据库文件不存在"
fi

# 备份日志文件
if [ -d "./logs" ]; then
    echo "备份日志文件..."
    cp -r "./logs" "$TEMP_BACKUP_DIR/"
    echo "✅ 日志备份完成"
else
    echo "⚠️  日志目录不存在"
fi

# 备份配置文件
echo "备份配置文件..."
[ -f "./.env" ] && cp "./.env" "$TEMP_BACKUP_DIR/"
[ -f "./docker-compose.yml" ] && cp "./docker-compose.yml" "$TEMP_BACKUP_DIR/"
[ -f "./nginx.conf" ] && cp "./nginx.conf" "$TEMP_BACKUP_DIR/"
[ -f "./pm2.config.js" ] && cp "./pm2.config.js" "$TEMP_BACKUP_DIR/"
echo "✅ 配置文件备份完成"

# 创建备份信息文件
cat > "$TEMP_BACKUP_DIR/backup_info.txt" << EOF
备份信息
========================================
备份时间: $(date)
系统版本: $(cat package.json 2>/dev/null | grep version || echo "未知")
备份内容:
- 数据库文件 (database.sqlite)
- 日志文件 (logs/)
- 配置文件 (.env, docker-compose.yml, nginx.conf, pm2.config.js)

恢复说明:
1. 停止当前服务
2. 将database.sqlite复制到./data/目录
3. 将logs/目录复制到项目根目录
4. 将配置文件复制到项目根目录
5. 重启服务
========================================
EOF

# 压缩备份
echo "压缩备份文件..."
cd "$BACKUP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"
cd ..

echo "✅ 备份完成: $BACKUP_DIR/$BACKUP_NAME.tar.gz"

# 清理旧备份（保留最近7天）
echo "清理旧备份文件..."
find "$BACKUP_DIR" -name "auto-signin-backup_*.tar.gz" -mtime +7 -delete
echo "✅ 旧备份清理完成"

echo "========================================="
echo "  备份任务完成！"
echo "  备份文件: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "========================================="
@echo off
chcp 65001 >nul
echo 启动自动签到管理系统...

echo.
echo 正在启动后端服务器...
cd /d "%~dp0backend"
start "后端服务器" cmd /k "npm run dev"

echo.
echo 等待后端服务器启动...
timeout /t 3 /nobreak >nul

echo.
echo 正在启动前端开发服务器...
cd /d "%~dp0frontend\signin-frontend"
start "前端开发服务器" cmd /k "npm run dev"

echo.
echo 服务启动完成！
echo 后端服务器: http://localhost:3001
echo 前端开发服务器: http://localhost:5173
echo API文档: http://localhost:3001/api-docs
echo.
echo 按任意键关闭此窗口...
pause >nul
@echo off
chcp 65001 >nul
title 系统状态检查

echo ========================================
echo    系统状态检查
echo ========================================
echo.

echo 正在检查系统状态，请稍候...
echo.

REM 检查后端服务 (端口3001)
echo [1] 检查后端服务 (端口3001)
timeout /t 1 /nobreak >nul
tasklist /fi "imagename eq node.exe" 2>nul | find "node.exe" >nul
if errorlevel 1 (
    echo    ✗ 未发现Node.js进程
) else (
    echo    ✓ 发现Node.js进程运行中
)

REM 检查前端服务 (可能是npm或node进程)
echo [2] 检查前端开发服务
timeout /t 1 /nobreak >nul
tasklist /fi "imagename eq npm.exe" 2>nul | find "npm.exe" >nul
if errorlevel 1 (
    echo    ✗ 未发现npm进程
) else (
    echo    ✓ 发现npm进程运行中
)

echo.
echo [3] 尝试简单连接测试
echo 测试后端连接...
ping -n 1 127.0.0.1 >nul 2>&1
if errorlevel 1 (
    echo    ✗ 本地网络连接异常
) else (
    echo    ✓ 本地网络连接正常
)

echo.
echo ========================================
echo 检查完成！
echo.
echo 服务地址:
echo - 后端服务: http://localhost:3001
echo - 前端界面: http://localhost:5173
echo - API文档: http://localhost:3001/api-docs
echo.
echo 如果进程显示运行但无法访问，请检查:
echo 1. 防火墙设置
echo 2. 端口是否被其他程序占用
echo 3. 服务是否正确启动
echo ========================================
echo.
pause
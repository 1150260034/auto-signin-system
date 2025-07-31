@echo off
chcp 65001 >nul
title 自动签到管理系统启动器

echo ========================================
echo    自动签到脚本管理系统启动器
echo ========================================
echo.

echo [1] 启动完整系统 (前端+后端)
echo [2] 仅启动后端服务
echo [3] 仅启动前端服务
echo [4] 查看系统状态
echo [5] 退出
echo.

set /p choice=请选择操作 (1-5): 

if "%choice%"=="1" goto start_all
if "%choice%"=="2" goto start_backend
if "%choice%"=="3" goto start_frontend
if "%choice%"=="4" goto check_status
if "%choice%"=="5" goto exit
goto invalid

:start_all
echo.
echo 正在启动完整系统...
echo.
echo 启动后端服务器...
cd /d "%~dp0backend"
start "自动签到-后端服务" cmd /k "echo 后端服务启动中... && npm run dev"

echo 等待后端服务启动...
timeout /t 5 /nobreak >nul

echo 启动前端开发服务器...
cd /d "%~dp0frontend\signin-frontend"
start "自动签到-前端服务" cmd /k "echo 前端服务启动中... && npm run dev"

echo.
echo ========================================
echo 系统启动完成！
echo ========================================
echo 后端服务: http://localhost:3001
echo 前端界面: http://localhost:5173
echo API文档: http://localhost:3001/api-docs
echo ========================================
echo.
goto menu

:start_backend
echo.
echo 启动后端服务器...
cd /d "%~dp0backend"
start "自动签到-后端服务" cmd /k "echo 后端服务启动中... && npm run dev"
echo 后端服务已启动: http://localhost:3001
echo.
goto menu

:start_frontend
echo.
echo 启动前端开发服务器...
cd /d "%~dp0frontend\signin-frontend"
start "自动签到-前端服务" cmd /k "echo 前端服务启动中... && npm run dev"
echo 前端服务已启动: http://localhost:5173
echo.
goto menu

:check_status
echo.
echo 检查系统状态...
echo.
netstat -an | findstr ":3001" >nul
if %errorlevel%==0 (
    echo ✓ 后端服务 (端口3001): 运行中
) else (
    echo ✗ 后端服务 (端口3001): 未运行
)

netstat -an | findstr ":5173" >nul
if %errorlevel%==0 (
    echo ✓ 前端服务 (端口5173): 运行中
) else (
    echo ✗ 前端服务 (端口5173): 未运行
)
echo.
goto menu

:invalid
echo.
echo 无效选择，请重新输入！
echo.
goto menu

:menu
echo.
echo 按任意键返回主菜单...
pause >nul
cls
goto start

:exit
echo.
echo 感谢使用自动签到管理系统！
echo.
pause
exit

:start
echo ========================================
echo    自动签到脚本管理系统启动器
echo ========================================
echo.

echo [1] 启动完整系统 (前端+后端)
echo [2] 仅启动后端服务
echo [3] 仅启动前端服务
echo [4] 查看系统状态
echo [5] 退出
echo.

set /p choice=请选择操作 (1-5): 

if "%choice%"=="1" goto start_all
if "%choice%"=="2" goto start_backend
if "%choice%"=="3" goto start_frontend
if "%choice%"=="4" goto check_status
if "%choice%"=="5" goto exit
goto invalid

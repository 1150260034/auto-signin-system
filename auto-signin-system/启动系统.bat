@echo off
chcp 65001 >nul 2>&1
title 自动签到管理系统启动器

:main_menu
cls
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
if "%choice%"=="5" goto exit_program
echo.
echo 无效选择，请重新输入！
echo.
pause
goto main_menu

:start_all
cls
echo ========================================
echo    启动完整系统
echo ========================================
echo.
echo 正在启动后端服务器...
cd /d "%~dp0backend"
if not exist "package.json" (
    echo 错误: 后端目录不存在或配置文件缺失
    pause
    goto main_menu
)
start "自动签到-后端服务" cmd /k "echo 后端服务启动中... && npm run dev"

echo 等待后端服务启动...
timeout /t 5 /nobreak >nul

echo 正在启动前端开发服务器...
cd /d "%~dp0frontend\signin-frontend"
if not exist "package.json" (
    echo 错误: 前端目录不存在或配置文件缺失
    pause
    goto main_menu
)
start "自动签到-前端服务" cmd /k "echo 前端服务启动中... && npm run dev"

echo.
echo ========================================
echo 系统启动完成！
echo ========================================
echo.
echo 服务地址:
echo - 后端服务: http://localhost:3001
echo - 前端界面: http://localhost:5173
echo - API文档: http://localhost:3001/api-docs
echo.
echo 注意: 请等待服务完全启动后再访问
echo ========================================
echo.
pause
goto main_menu

:start_backend
cls
echo ========================================
echo    启动后端服务
echo ========================================
echo.
echo 正在启动后端服务器...
cd /d "%~dp0backend"
if not exist "package.json" (
    echo 错误: 后端目录不存在或配置文件缺失
    pause
    goto main_menu
)
start "自动签到-后端服务" cmd /k "echo 后端服务启动中... && npm run dev"
echo.
echo 后端服务已启动: http://localhost:3001
echo API文档: http://localhost:3001/api-docs
echo.
pause
goto main_menu

:start_frontend
cls
echo ========================================
echo    启动前端服务
echo ========================================
echo.
echo 正在启动前端开发服务器...
cd /d "%~dp0frontend\signin-frontend"
if not exist "package.json" (
    echo 错误: 前端目录不存在或配置文件缺失
    pause
    goto main_menu
)
start "自动签到-前端服务" cmd /k "echo 前端服务启动中... && npm run dev"
echo.
echo 前端服务已启动: http://localhost:5173
echo.
pause
goto main_menu

:check_status
cls
echo ========================================
echo    系统状态检查
echo ========================================
echo.
echo 正在检查系统状态，请稍候...
echo.

REM 检查Node.js进程
echo [1] 检查Node.js进程状态
tasklist /fi "imagename eq node.exe" 2>nul | find "node.exe" >nul
if errorlevel 1 (
    echo    ✗ 未发现Node.js进程运行
) else (
    echo    ✓ 发现Node.js进程正在运行
)

REM 检查npm进程
echo [2] 检查npm进程状态
tasklist /fi "imagename eq npm.exe" 2>nul | find "npm.exe" >nul
if errorlevel 1 (
    echo    ✗ 未发现npm进程运行
) else (
    echo    ✓ 发现npm进程正在运行
)

echo.
echo [3] 检查端口占用情况
echo 检查端口3001 (后端服务)...
netstat -an 2>nul | find ":3001" >nul
if errorlevel 1 (
    echo    ✗ 端口3001未被占用
) else (
    echo    ✓ 端口3001已被占用
)

echo 检查端口5173 (前端服务)...
netstat -an 2>nul | find ":5173" >nul
if errorlevel 1 (
    echo    ✗ 端口5173未被占用
) else (
    echo    ✓ 端口5173已被占用
)

echo.
echo ========================================
echo    服务访问地址
echo ========================================
echo - 后端服务: http://localhost:3001
echo - 前端界面: http://localhost:5173
echo - API文档: http://localhost:3001/api-docs
echo.
echo 如果进程显示运行但无法访问服务，请检查:
echo 1. 防火墙设置是否阻止了端口访问
echo 2. 端口是否被其他程序占用
echo 3. 服务是否正确启动完成
echo ========================================
echo.
pause
goto main_menu

:exit_program
cls
echo.
echo ========================================
echo    感谢使用自动签到管理系统！
echo ========================================
echo.
echo 系统即将退出...
timeout /t 2 /nobreak >nul
exit

REM 错误处理
:error
echo.
echo 发生错误，请检查系统配置
pause
goto main_menu
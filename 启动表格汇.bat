@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 表格汇 TableHub

set "PY=C:\Users\win10\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe"
if not exist "%PY%" set "PY=python"

if not exist "dist\index.html" (
  echo [!] 还没有构建产物 dist\ ，请先执行: pnpm build
  pause
  exit /b 1
)

echo.
echo   表格汇 TableHub
echo   起始端口 5180（被占用会自动顺延），浏览器会自动打开
echo   关闭此窗口即可停止服务
echo.

"%PY%" serve.py 5180 --open
pause

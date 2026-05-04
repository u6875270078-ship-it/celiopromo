@echo off
title Celio Italia - Genera Video
echo.
echo ================================================
echo   CELIO ITALIA - Generazione Video
echo ================================================
echo.
cd /d "%~dp0"
node create-video.mjs
pause

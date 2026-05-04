@echo off
title Celio Italia - Autopilota Giornaliero
echo.
echo ================================================
echo   CELIO ITALIA - Autopilota Attivo
echo   Chiudi questa finestra per fermare
echo ================================================
echo.
cd /d "%~dp0"
node autopilot.mjs
pause

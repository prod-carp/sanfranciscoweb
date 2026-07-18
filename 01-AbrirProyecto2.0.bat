@echo off
title Bajar desde GitHub
color 0B
chcp 65001 >nul

echo ====================================
echo     BAJAR CAMBIOS DE GITHUB
echo ====================================
echo.

REM Limpiar referencias corruptas antes de empezar
del /s /q /a:h "%~dp0desktop.ini" >nul 2>&1

echo [1/3] Limpiando repositorio local...
git gc --prune=now 2>nul

echo [2/3] Descargando ultimos cambios...
git fetch origin --prune

if errorlevel 1 (
    echo [ERROR] No se pudo conectar con GitHub.
    pause
    exit /b
)

echo [3/3] Actualizando copia local...
git reset --hard origin/main
if errorlevel 1 (
    echo [ERROR] No se pudo aplicar la actualización.
    pause
    exit /b
)

echo.
echo ====================================
echo     ¡ACTUALIZACION COMPLETADA!
echo ====================================
echo.
pause
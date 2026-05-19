@echo off
title Bajar desde GitHub
color 0B

echo ====================================
echo     BAJAR CAMBIOS DE GITHUB
echo ====================================
echo.

REM Limpiar referencias corruptas antes de empezar
if exist .git\refs\heads\desktop.ini (
    echo [LIMPIANDO] Eliminando referencia corrupta...
    del .git\refs\heads\desktop.ini 2>nul
)

echo [1/4] Limpiando repositorio local...
git gc --prune=now 2>nul

echo [2/4] Descargando ultimos cambios...
git fetch origin --prune

if errorlevel 1 (
    echo [ERROR] Fallo al descargar. Intentando reparar...
    git fetch origin --force
)

echo [3/4] Descargando ultimos cambios...
git fetch origin

echo [4/4] Fusionando cambios locales...
git pull origin main

if errorlevel 1 (
    echo.
    echo [ERROR] Hay conflictos o problemas.
    echo.
    echo Soluciones posibles:
    echo 1. Ejecuta: git reset --hard origin/main
    echo 2. O clona el repositorio de nuevo
    pause
    exit /b 1
)

echo.
echo ====================================
echo     ¡ACTUALIZACION COMPLETADA!
echo ====================================
echo.
pause
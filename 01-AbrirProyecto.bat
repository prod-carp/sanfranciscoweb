@echo off
title Bajar desde GitHub
color 0B
echo Eliminando archivos desktop.ini...
del /s /q /a:h "%~dp0desktop.ini"
cls
echo ====================================
echo     BAJAR CAMBIOS DE GITHUB
echo ====================================
echo.

REM Verificar que estamos en un repositorio git
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [ERROR] No estas en un repositorio Git.
    echo.
    echo Solucion: Ejecuta primero:
    echo   git clone URL_DEL_REPOSITORIO
    echo.
    pause
    exit /b 1
)



echo [1/2] Descargando ultimos cambios...
git fetch origin

echo [2/2] Fusionando cambios locales...
git pull origin main

echo.
echo ====================================
echo     ¡ACTUALIZACION COMPLETADA!
echo ====================================
echo.
echo Presiona cualquier tecla para salir...
pause >nul
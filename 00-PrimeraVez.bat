@echo off
title Clonar repositorio por primera vez
color 0E

echo ====================================
echo     CLONAR REPOSITORIO
echo ====================================
echo.
echo Este script se usa SOLO UNA VEZ
echo para descargar el proyecto por primera vez.
echo.

set /p url="https://github.com/prod-carp/sanfranciscoweb.git"

echo.
echo Descargando proyecto...
git clone %url%

if errorlevel 1 (
    echo [ERROR] No se pudo clonar. Verifica la URL.
    pause
    exit /b 1
)

echo.
echo ====================================
echo ¡PROYECTO DESCARGADO CON EXITO!
echo ====================================
echo.
echo Ahora puedes entrar a la carpeta creada
echo y usar AbrirProyecto.bat y subiragithub.bat
echo.
pause
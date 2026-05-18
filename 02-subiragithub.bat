@echo off
echo Eliminando archivos desktop.ini...
del /s /q /a:h "%~dp0desktop.ini"
echo ¡Completado!
cls

title Subir a GitHub - Automatizado
color 0A

echo ====================================
echo     SUBIR CAMBIOS A GITHUB
echo ====================================
echo.

REM Verificar que estamos en un repositorio git
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [ERROR] No estas en un repositorio Git.
    echo Ejecuta primero: git init
    pause
    exit /b 1
)

REM Pedir mensaje del commit
echo Pon el nombre de la actualización:
set /p "nombre=> "
if "%nombre%"=="" (
    echo [ERROR] El nombre no puede estar vacio
    pause
    exit /b 1
)

echo.
echo [1/3] Añadiendo archivos nuevos...
git add .

echo [2/3] Creando commit...
git commit -m "%nombre%"

REM Verificar si el commit falló
if errorlevel 1 (
    echo [ERROR] No hay cambios para subir
    pause
    exit /b 1
)

echo [3/3] Subiendo a GitHub...
git push origin master

echo.
echo ====================================
echo          ¡SUBIDA EXITOSA!
echo ====================================
echo.
echo Presiona cualquier tecla para salir...
pause >nul
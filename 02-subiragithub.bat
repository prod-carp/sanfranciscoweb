@echo off
SetLocal EnableDelayedExpansion
title Subir a GitHub - Automatizado
color 0A

REM ============================================================
REM    SCRIPT DE SUBIDA A GITHUB CON VERIFICACIONES DE SEGURIDAD
REM ============================================================
echo.
echo ========================================
echo    Comprobando conexion con GitHub...
echo ========================================
echo.

set "FALLOS=0"

for /L %%i in (1,1,8) do (
    echo Comprobacion %%i/8...

    curl.exe -s --connect-timeout 5 --max-time 10 -I https://github.com >nul 2>&1

    if errorlevel 1 (
        echo    ERROR
        set /a FALLOS+=1
    ) else (
        echo    OK
    )
)

echo.

if %FALLOS% NEQ 0 (
    echo.
    echo ========================================
    echo    GITHUB NO ESTA DISPONIBLE
    echo ========================================
    echo.
    echo No se ha podido conectar con GitHub.
    echo Intentalo de nuevo mas tarde.
    echo.
    pause
    exit /b 1
)

echo GitHub esta disponible.
echo.
CLS


REM ============================================================
REM PASO 1: LIMPIEZA INICIAL
REM ============================================================
REM Ejecutamos script de limpieza si existe
IF EXIST limpieza.ps1 (
    echo [LIMPIEZA] Ejecutando limpieza.ps1...
    powershell -File "limpieza.ps1"
    echo.
) ELSE (ECHO No se encontró el archivo "limpieza.ps1" necesario & PAUSE & EXIT)

REM ============================================================
REM PASO 2: LIMPIAR ARCHIVOS DE WINDOWS QUE PUEDEN CAUSAR PROBLEMAS
REM ============================================================
REM Eliminamos desktop.ini (archivos de configuración de Windows)
REM que pueden interferir con Git
echo [LIMPIEZA] Eliminando archivos desktop.ini...
del /s /q /a:h "%~dp0desktop.ini" >nul 2>&1
echo.

REM ============================================================
REM PASO 3: MOSTRAR INFORMACIÓN DEL REPOSITORIO
REM ============================================================
echo ============================================================
echo     SUBIR CAMBIOS A GITHUB
echo ============================================================
echo.
echo [INFO] Repositorio: 
git remote get-url origin 2>nul
echo.

REM ============================================================
REM PASO 4: VERIFICAR QUE ESTAMOS EN UN REPOSITORIO GIT
REM ============================================================
echo [VERIFICACION] Comprobando que estamos en un repositorio Git...
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [ERROR] No estas en un repositorio Git.
    echo [SOLUCION] Ejecuta primero: git init
    echo [SOLUCION] Luego conecta con: git remote add origin [URL]
    pause
    exit /b 1
)
echo [OK] Repositorio Git encontrado.
echo.

REM ============================================================
REM PASO 5: VERIFICAR QUE EL REPOSITORIO ESTÁ CONECTADO A REMOTO
REM ============================================================
echo [VERIFICACION] Comprobando conexión con GitHub...
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [ERROR] No hay repositorio remoto configurado.
    echo [SOLUCION] Ejecuta: git remote add origin [URL-del-repositorio]
    pause
    exit /b 1
)
echo [OK] Repositorio remoto configurado.
echo.

REM ============================================================
REM PASO 6: OBTENER CAMBIOS REMOTOS (FETCH) PARA COMPARAR
REM ============================================================
echo [ACTUALIZACION] Obteniendo información de cambios remotos...
git fetch origin 2>nul
if errorlevel 1 (
    echo [ADVERTENCIA] No se pudo conectar con el remoto.
    echo [POSIBLE CAUSA] Problemas de red o autenticación.
    echo [CONTINUAR] Intentando continuar de todas formas...
)
echo.

REM ============================================================
REM PASO 7: COMPARAR VERSION LOCAL VS REMOTA
REM ============================================================
echo [VERIFICACION] Comparando version local con remota...

REM Inicializar variables
set "LOCAL="
set "REMOTO="
set "BRANCH="

REM Obtener hash del commit local
for /f "delims=" %%i in ('git rev-parse HEAD 2^>nul') do set "LOCAL=%%i"

REM Obtener hash del commit remoto
for /f "delims=" %%i in ('git rev-parse origin/main 2^>nul') do set "REMOTO=%%i"

REM Si no se encontró main, probar con master
if "%REMOTO%"=="" (
    for /f "delims=" %%i in ('git rev-parse origin/master 2^>nul') do set "REMOTO=%%i"
)

REM Si aún no hay remoto, obtener la rama actual
if "%REMOTO%"=="" (
    for /f "delims=" %%i in ('git branch --show-current 2^>nul') do set "BRANCH=%%i"
    if not "!BRANCH!"=="" (
        for /f "delims=" %%i in ('git rev-parse origin/!BRANCH! 2^>nul') do set "REMOTO=%%i"
    )
)

REM Mostrar diagnóstico para depuración
echo [INFO] Hash local: %LOCAL%
echo [INFO] Hash remoto: %REMOTO%
echo.

REM Verificar si existe commit local
if "%LOCAL%"=="" (
    echo [ERROR] No hay commits en el repositorio local.
    echo [SOLUCION] Haz tu primer commit antes de continuar.
    pause
    exit /b 1
)

REM Verificar si existe commit remoto
if "%REMOTO%"=="" (
    echo [INFO] No hay commits en el repositorio remoto.
    echo [INFO] Es la primera subida, continuando normalmente...
    echo.
    goto :continuar_subida
)

REM Comparar hashes
if "%LOCAL%"=="%REMOTO%" (
    echo [OK] Tu repositorio está actualizado con el remoto.
    echo.
) else (
    echo.
    echo [ADVERTENCIA] Tu repositorio NO está actualizado con el remoto.
    echo [INFO] Tu version local: %LOCAL%
    echo [INFO] Version remota:    %REMOTO%
    echo.
    echo ============================================================
    echo Hay cambios remotos que no tienes en tu PC.
    echo Si subes ahora, se producirán conflictos.
    echo ============================================================
    echo.
    echo [OPCION] ¿Quieres integrar los cambios remotos?
    echo.
    echo   1. Si, hacer pull e integrar cambios
    echo   2. No, cancelar la operacion
    echo.
    
    set /p "opcion=Elige una opcion 1 o 2: "
    
    if "!opcion!"=="1" (
        echo.
        echo [PULL] Descargando e integrando cambios remotos...
        
        REM Intentar hacer pull de main o master
        git pull origin main --no-edit 2>nul
        if errorlevel 1 (
            git pull origin master --no-edit 2>nul
        )
        
        if errorlevel 1 (
            echo.
            echo [ERROR] Hubo conflictos al hacer pull.
            echo [SOLUCION] Resuelve los conflictos manualmente.
            echo [SOLUCION] Luego ejecuta: git add . y git commit
            echo [SOLUCION] Despues vuelve a ejecutar este script.
            pause
            exit /b 1
        )
        echo [OK] Cambios integrados correctamente.
        echo.
    ) else (
        echo.
        echo [CANCELADO] Operacion cancelada por el usuario.
        echo [INFO] No se subiran los cambios hasta que integres el remoto.
        pause
        exit /b 1
    )
)

:continuar_subida
REM Continuar con el resto del script

REM ============================================================
REM PASO 8: MOSTRAR ESTADO ACTUAL DEL REPOSITORIO
REM ============================================================
REM echo [ESTADO] Archivos modificados o nuevos:
REM git status --short
echo.

REM ============================================================
REM PASO 9: PEDIR MENSAJE DEL COMMIT
REM ============================================================
CLS
echo ============================================================
echo     SUBIR CAMBIOS A GITHUB
echo ============================================================
echo.
echo Pon el nombre de la actualización:
echo [EJEMPLO] "Subida de noticia" o "Corregir errores"
set /p "nombre=> "

REM Verificar que el mensaje no esté vacío
if "%nombre%"=="" (
    echo [ERROR] El nombre no puede estar vacio
    pause
    exit /b 1
)
echo.

REM ============================================================
REM PASO 10: AÑADIR ARCHIVOS NUEVOS/MODIFICADOS
REM ============================================================
echo [1/4] Añadiendo archivos nuevos y modificados...
git add .
echo [OK] Archivos preparados para subida.
echo.

REM ============================================================
REM PASO 11: CREAR EL COMMIT
REM ============================================================
echo [2/4] Creando subida con mensaje: "%nombre%"
git commit -m "%nombre%"

REM Verificar si el commit falló
if errorlevel 1 (
    echo.
    echo [ERROR] No hay cambios para subir.
    echo [POSIBLES CAUSAS:]
    echo   - No hay archivos nuevos o modificados
    echo   - Los cambios ya fueron commitados anteriormente
    echo   - Tienes un repositorio clonado dentro de la carpeta
    pause
    exit /b 1
)
echo [OK] Commit creado correctamente.
echo.

REM ============================================================
REM PASO 12: SUBIR A GITHUB CON SEGURIDAD
REM ============================================================
echo [3/4] Subiendo a GitHub...
git push origin main

REM Verificar si el push falló
if errorlevel 1 (
    echo.
    echo [ERROR] Fallo al subir a GitHub.
    echo [POSIBLES CAUSAS Y SOLUCIONES:]
    echo   1. No estas actualizado con el remoto
    echo      - Solucion: git pull origin main
    echo   2. Problemas de autenticación
    echo      - Solucion: Verifica tus credenciales
    echo   3. Problemas de red
    echo      - Solucion: Verifica tu conexión
    echo.
    echo [RECOMENDACION] Ejecuta git pull y vuelve a intentarlo
    pause
    exit /b 1
)
echo [OK] Subida completada correctamente.
echo.

REM ============================================================
REM PASO 13: MOSTRAR ESTADO FINAL
REM ============================================================
echo [4/4] Verificando estado final...
git status
echo.

REM ============================================================
REM PASO 14: ÉXITO Y FINALIZACIÓN
REM ============================================================
echo ============================================================
echo          ¡SUBIDA EXITOSA A GITHUB!
echo ============================================================
echo.
echo [RESUMEN]
echo   - Commit: %nombre%
echo   - Repositorio remoto: origin/main
echo   - Fecha: %date% %time%
echo.
echo Presiona cualquier tecla para salir...
pause >nul
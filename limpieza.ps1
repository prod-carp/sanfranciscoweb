# guarda como "limpiar_y_canonical.ps1"
# Ejecutar: Botón derecho -> "Ejecutar con PowerShell"

param(
    [string]$baseUrl = $("https://sanfranciscoysantaclara.es")
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LIMPIANDO HTML Y AGREGANDO CANONICAL" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ([string]::IsNullOrWhiteSpace($baseUrl)) {
    Write-Host "ERROR: No se introdujo ninguna URL" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit
}

# Contadores
$total = 0
$canonicalAdded = 0
$mobiriseRemoved = 0

# Recorrer todos los HTML en static/
Get-ChildItem -Path "static" -Recurse -Filter "*.html" | ForEach-Object {
    $total++
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\static\", "").Replace("\", "/")
    Write-Host "Procesando: $relativePath" -ForegroundColor White
    
    # Leer contenido
    $content = Get-Content $_.FullName -Raw -Encoding UTF8
    
    # Variable para controlar cambios
    $changed = $false
    
    # === 1. ELIMINAR CÓDIGO DE MOBIRISE ===
    $pattern = @'
<section class="display-7"[^>]*>.*?<a href="https://mobiri\.se/[^"]+".*?</a>.*?<p[^>]*>.*?</p>.*?<a style="z-index:1" href="https://mobirise[^"]*">.*?</a></section>
'@
    
    if ($content -match $pattern) {
        $content = $content -replace $pattern, ""
        $mobiriseRemoved++
        $changed = $true
        Write-Host "  [OK] Código Mobirise eliminado" -ForegroundColor Green
    }
    
    # 1.2 Comentario de Mobirise -> Robots
    $patterns = @(
        '<!-- Site made with Mobirise Website Builder v[0-9]+\.[0-9]+\.[0-9]+, https://mobirise\.com -->'
        '<!-- Site made with Mobirise v[0-9]+\.[0-9]+\.[0-9]+, https://mobirise\.com -->'
        '<!-- Made with Mobirise Website Builder v[0-9]+\.[0-9]+\.[0-9]+, https://mobirise\.com -->'
   )
    
    foreach ($pattern in $patterns) {
        if ($content -match $pattern) {
            $content = $content -replace $pattern, '<meta name="robots" content="index, follow">'
            $changed = $true
        }
    }

    # 1.3 Generador -> og:type
    $pattern = '<meta name="generator" content="Mobirise.*?">'

    if ($content -match $pattern) {
            $content = $content -replace $pattern, '<meta property="og:type" content="website">'
            }
    # 1.4 Edge -> og:Title
    $pattern = '<meta http-equiv="X-UA-Compatible" content="IE=edge">'

    if ($content -match $pattern) {
            $content = $content -replace $pattern, '<meta property="og:url" content="https://sanfranciscoysantaclara.es">'
            }


    # === 2. AGREGAR CANONICAL SI NO EXISTE ===
    $canonicalTag = '<link rel="canonical" href="' + $baseUrl + '/' + $relativePath + '" />'
    
    if ($content -notmatch '<link rel="canonical"') {
        # Buscar <head> y agregar canonical después
        if ($content -match '(<\s*head[^>]*>)') {
            $content = $content -replace "(<\s*head[^>]*>)", "`$1`n  $canonicalTag"
            $canonicalAdded++
            $changed = $true
            Write-Host "  [OK] Canonical agregado: $canonicalTag" -ForegroundColor Green
            # Read-Host "Presiona Enter para continuar"
        } else {
            Write-Host "  [!] No se encontró <head>, no se agregó canonical" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [i] Canonical ya existe" -ForegroundColor Gray
    }
    
    # Guardar cambios si hubo modificaciones
    if ($changed) {
        Set-Content $_.FullName -Value $content -Encoding UTF8 -NoNewline
    }
    
    Write-Host ""
}

# Mostrar resumen
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMEN FINAL" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Archivos HTML encontrados: $total" -ForegroundColor White
Write-Host "Canonical agregados: $canonicalAdded" -ForegroundColor Green
Write-Host "Código Mobirise eliminado: $mobiriseRemoved" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
# Read-Host "Presiona Enter para salir"
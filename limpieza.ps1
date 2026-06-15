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

    # 1.4 Edge -> og:URL
    $canonicalTag = "$baseUrl/$relativePath"
    $pattern = '<meta http-equiv="X-UA-Compatible" content="IE=edge">'

    if ($content -match $pattern) {
            $content = $content -replace $pattern, "<meta property=`"og:url`" content=`"$canonicalTag`">"
            }

    # 1.5 html -> html-es
    $pattern = '<html  '

    if ($content -match $pattern) {
            $content = $content -replace $pattern, '<html lang="es"'
            }

    # 1.5.1 twitter:image:src
    $pattern = '"twitter:image:src"'

    if ($content -match $pattern) {
            $content = $content -replace $pattern, '"twitter:image"'
            }
    # 1.5.2 URL ABSOLUTAS
    $pattern = 'content="assets'

    if ($content -match $pattern) {
            $content = $content -replace $pattern, 'content="https://sanfranciscoysantaclara.es/assets'
            }
    # 1.5.3 URL ABSOLUTAS 2
    $pattern = 'href="assets'

    if ($content -match $pattern) {
            $content = $content -replace $pattern, 'href="https://sanfranciscoysantaclara.es/assets'
            }

    # 1.6 Buscar la meta description y extraer su contenido
$patternDesc = '<meta name="description" content="(.*?)">'

if ($content -match $patternDesc) {
    # Extraer el contenido capturado
    $descriptionContent = $matches[1]
    
    # Crear la línea og:description
    $ogTitleLine = '<meta property="og:description" content="' + $descriptionContent + '">'
    $twittercontent = '<meta name="twitter:description" content="' + $descriptionContent + '">'
    
    # Buscar la línea específica y hacer el reemplazo
    $patternDescLine = '<meta name="description" content=".*?">'
    $oglocale = '<meta property="og:locale" content="es_ES">'
    $sitename = '<meta property="og:site_name" content="Parroquia San Francisco y Santa Clara de Asís">'
    $autor = '<meta name="author" content="Parroquia San Francisco y Santa Clara de Asís">'
    $codigoesquema = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Church","name":"Parroquia San Francisco y Santa Clara de Asís","url":"https://sanfranciscoysantaclara.es","telephone":"+34 91 615 24 31","email":"sf.sc.de.asis@gmail.com","image":"https://sanfranciscoysantaclara.es/assets/images/index-meta-1200x630.webp","address":{"@type":"PostalAddress","streetAddress":"Calle de Suecia, 2","addressLocality":"Fuenlabrada","addressRegion":"Madrid","postalCode":"28942","addressCountry":"ES"},"sameAs":["https://www.instagram.com/san.franciscoyclara/"]}</script>'
    
    # Método alternativo usando -replace correctamente
    $content = $content -replace "($patternDescLine)", "`$1`n  $ogTitleLine `n  $oglocale `n  $sitename `n  $autor `n  $twittercontent `n  $codigoesquema"
}

    # 1.7 OGTITLE
    $patternDesc = '<title>(.*?)</title>'
    
    if ($content -match $patternDesc) {
    # Extraer el contenido capturado
    $descriptionContent = $matches[1]
    
    # Crear la línea og:title
    $ogTitleLine = '<meta property="og:title" content="' + $descriptionContent + '">'
         
    # Buscar la línea específica y hacer el reemplazo
    $patternDescLine = '<title>.*?</title>'
        
    # Método alternativo usando -replace correctamente
    $content = $content -replace "($patternDescLine)", "`$1`n  $ogTitleLine"
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
Clear-Host
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
    
    # === 1. SUSTITUIR HEAD COMPLETO ===
    $canonicalTag = "$baseUrl/$relativePath"
    # Extraer DESCRIPTION
    $patternDesc = '<meta name="description" content="(.*?)">'
    if ($content -match $patternDesc) {
       $descriptionContent = $matches[1]
    }
    # Extraer TITLE
    $patternDesc = '<title>(.*?)</title>'
    if ($content -match $patternDesc) {
    $titleContent = $matches[1]
    }
    # Extraer IMAGEN
    $patternDesc = '<meta property="og:image" content="(.*?)">'
    if ($content -match $patternDesc) {
    $imageContent = $matches[1]
    }

$newHead = @"
<html lang="es">
<link rel="canonical" href="$canonicalTag">

<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>$titleContent</title>

<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="description" content="$descriptionContent">
<meta name="theme-color" content="#ffffff">
<meta name="author" content="Parroquia San Francisco y Santa Clara de Asís">
<meta name="color-scheme" content="light">
<meta name="referrer" content="strict-origin-when-cross-origin">

<meta property="og:type" content="website">
<meta property="og:site_name" content="Parroquia San Francisco y Santa Clara de Asís">
<meta property="og:title" content="$titleContent">
<meta property="og:description" content="$descriptionContent">
<meta property="og:url" content="$canonicalTag">
<meta property="og:image" content="$baseUrl/$imageContent">
<meta property="og:locale" content="es_ES">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="$titleContent">
<meta name="twitter:description" content="$descriptionContent">
<meta name="twitter:image" content="$baseUrl/$imageContent">

<link rel="icon" type="image/png" sizes="16x16" href="/assets/images/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/assets/images/favicon-48x48.png">
<link rel="icon" type="image/png" sizes="64x64" href="/assets/images/favicon-64x64.png">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/images/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">

<link rel="stylesheet" href="/assets/web/assets/mobirise-icons2/mobirise2.css">
<link rel="stylesheet" href="/assets/bootstrap/css/bootstrap.min.css">
<link rel="stylesheet" href="/assets/animatecss/animate.css">
<link rel="stylesheet" href="/assets/dropdown/css/style.css">
<link rel="stylesheet" href="/assets/socicon/css/styles.css">
<link rel="stylesheet" href="/assets/theme/css/style.css">
<link rel="stylesheet" href="/assets/css/fonts.css">
<link rel="stylesheet" href="/assets/mobirise/css/mbr-additional.css?v=G1za5k" type="text/css">

<script type="application/ld+json">{"@context":"https://schema.org","@type":"Church","name":"Parroquia San Francisco y Santa Clara de Asís","url":"https://sanfranciscoysantaclara.es","telephone":"+34 91 615 24 31","image":"https://sanfranciscoysantaclara.es/assets/images/index-meta-1200x630.webp","address":{"@type":"PostalAddress","streetAddress":"Calle de Suecia, 2","addressLocality":"Fuenlabrada","addressRegion":"Madrid","postalCode":"28942","addressCountry":"ES"},"geo":{"@type":"GeoCoordinates","latitude":40.2896387,"longitude":-3.8060985},"sameAs":["https://www.instagram.com/san.franciscoyclara/"]}</script>

</head>
"@

$content = $content -replace '(?s)<html.*?</head>', $newHead
    
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
        
    # 1.5.4 COOKIES PARA QUE FUNCIONE EL MENU
    $pattern = '<script type="text/plain" data-src="assets/bootstrap/js/bootstrap.bundle.min.js"></script>'
    if ($content -match $pattern) { $content = $content -replace $pattern, '<script src="assets/bootstrap/js/bootstrap.bundle.min.js"></script>' }
    $pattern = '<script type="text/plain" data-src="assets/smoothscroll/smooth-scroll.js"></script>'
    if ($content -match $pattern) { $content = $content -replace $pattern, '<script src="assets/smoothscroll/smooth-scroll.js"></script>' }
    $pattern = '<script type="text/plain" data-src="assets/dropdown/js/navbar-dropdown.js"></script>'
    if ($content -match $pattern) { $content = $content -replace $pattern, '<script src="assets/dropdown/js/navbar-dropdown.js"></script>' }
    $pattern = '<script type="text/plain" data-src="assets/theme/js/script.js"></script>'
    if ($content -match $pattern) { $content = $content -replace $pattern, '<script src="assets/theme/js/script.js"></script>' }
    $pattern = '<script type="text/plain" data-src="assets/parallax/jarallax.js"></script>'
    if ($content -match $pattern) { $content = $content -replace $pattern, '<script src="assets/parallax/jarallax.js"></script>' }

    # 1.5.5 TABLÓN DE ANUNCIOS
    $pattern = '<img src="assets/images/tablondeanuncios.webp" alt="Tablón de anuncios">';
    $replace = '<div id="wakelet-placeholder"><a href="https://wakelet.com/wake/6JqeEx95rM9gslVW8vEAL" target="_blank" rel="noopener"><img src="https://sanfranciscoysantaclara.es/assets/images/tablondeanuncios.webp" alt="Tablón de anuncios parroquial" style="width:100%;height:auto;border-radius:8px;"></a><p style="text-align:center;margin-top:10px;">Pulse sobre la imagen para abrir el tablón de anuncios. Si acepta las cookies de terceros se mostrará integrado en esta página.</p></div><iframe id="wakelet-embed" class="wakeletEmbed" width="100%" height="760" data-src="https://embed.wakelet.com/wakes/6JqeEx95rM9gslVW8vEAL/list?hide-cover=1&hide-description=1&hide-title=1" style="display:none;border:none;" allow="autoplay"></iframe><script type="text/plain" data-src="https://embed-assets.wakelet.com/wakelet-embed.js" charset="UTF-8"></script><script>document.addEventListener("DOMContentLoaded",function(){const accepted=document.cookie.includes("cookiesDirective=1");if(accepted){document.getElementById("wakelet-placeholder").style.display="none";document.getElementById("wakelet-embed").style.display="block";}});</script>';

    if ($content -match $pattern) {
        $content = $content -replace $pattern, $replace;
    }

    # 1.5.6 CALENDAR
    $pattern = '<img src="assets/images/calendario.webp" alt="Calendario">';
    $replace = '<div id="calendar-placeholder"><a href="https://calendar.google.com/calendar/embed?height=600&amp;wkst=2&amp;ctz=Europe%2FMadrid&amp;showPrint=0&amp;showCalendars=0&amp;showTz=0&amp;title=Parroquia%20San%20Francisco%20y%20Santa%20Clara&amp;src=NDc0MGE2OTlkMTIxYzEzYzVmNDc4NDhhNmVmMDkxODIyZWY2NzhhNmRmOWU1NjJiOTc5NDJlNmYxNjhjODczNEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&amp;color=%23c0ca33" target="_blank" rel="noopener"><img src="https://sanfranciscoysantaclara.es/assets/images/calendario.webp" alt="Calendario parroquial" style="width:100%;height:auto;border-radius:8px;"></a><p style="text-align:center;margin-top:10px;">Pulse sobre la imagen para abrir el calendario. Si acepta las cookies de terceros se mostrará integrado en esta página.</p></div><iframe id="calendar-embed" class="calendarEmbed" width="100%" height="600" data-src="https://calendar.google.com/calendar/embed?height=600&amp;wkst=2&amp;ctz=Europe%2FMadrid&amp;showPrint=0&amp;showCalendars=0&amp;showTz=0&amp;title=Parroquia%20San%20Francisco%20y%20Santa%20Clara&amp;src=NDc0MGE2OTlkMTIxYzEzYzVmNDc4NDhhNmVmMDkxODIyZWY2NzhhNmRmOWU1NjJiOTc5NDJlNmYxNjhjODczNEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&amp;color=%23c0ca33" style="display:none;border-width:1px;border-style:solid;border-color:rgb(119,119,119);" frameborder="0" scrolling="no"></iframe><script>document.addEventListener("DOMContentLoaded",function(){const accepted=document.cookie.includes("cookiesDirective=1");if(accepted){document.getElementById("calendar-placeholder").style.display="none";document.getElementById("calendar-embed").style.display="block";var iframe=document.getElementById("calendar-embed");iframe.src=iframe.dataset.src;}});</script>';

    if ($content -match $pattern) {
        $content = $content -replace $pattern, $replace;
    }

    # 1.5.7 alt en imagenes
    $pattern = 'Mobirise Website Builder';
    $replace = 'Parroquia San Francisco y Santa Clara de Asís';


    if ($content -match $pattern) {
        $content = $content -replace $pattern, $replace;
    }

    # 1.5.8 URL ABSOLUTAS
    $pattern = '="assets'
    if ($content -match $pattern) { $content = $content -replace $pattern, '="/assets' }

    # 1.5.9 OPTIMIZACION INSTAGRAM
    $pattern = '<a href="https://www.instagram.com/san.franciscoyclara/" target="_blank"><span class="socicon-instagram socicon" style="font-size: 70px;"></span></a>'
    if ($content -match $pattern) { $content = $content -replace $pattern, '<a href="https://www.instagram.com/san.franciscoyclara/" target="_blank" rel="noopener noreferrer" aria-label="Instagram de la parroquia San Francisco y Santa Clara"><span class="socicon-instagram socicon" style="font-size: 70px;"></span></a>' }

    
    # Guardar cambios si hubo modificaciones
    $changed = $true
    if ($changed) {
        Set-Content $_.FullName -Value $content -Encoding UTF8 -NoNewline
    }
    
    Write-Host ""
    # Read-Host "Hecho"
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

Write-Host "Ejecutando noticias..."
& "$PSScriptRoot\noticias.ps1"

# Read-Host "Presiona Enter para salir"
Clear-Host
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

    # 1.5.7 MAPS
    # $pattern = '<img src="assets/images/mapa.webp" alt="Mapa">';
    # $replace = '<div id=\"google-maps-placeholder\"><a href=\"https://www.google.com/maps?q=Parroquia+de+San+Francisco+y+Santa+Clara+de+As%C3%ADs\" target=\"_blank\" rel=\"noopener\"><img src=\"https://sanfranciscoysantaclara.es/assets/images/mapa.webp\" alt=\"Mapa de la parroquia\" style=\"width:100%;height:auto;border-radius:8px;\"></a><p style=\"text-align:center;margin-top:10px;\">Pulse sobre la imagen para abrir el mapa en Google Maps. Si acepta las cookies de terceros se mostrará integrado en esta página.</p></div><div class=\"google-map\" id=\"google-maps-embed\" style=\"display:none;\"><iframe frameborder=\"0\" style=\"border:0;width:100%;height:450px;\" data-src=\"https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1521.6791911841603!2d-3.8063355!3d40.2900009!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd418b9fa6c0b7e5%3A0x26ac07a3eb1e4365!2sParroquia%20de%20San%20Francisco%20y%20Santa%20Clara%20de%20As%C3%ADs!5e0!3m2!1ses!2ses!4v1775985595189!5m2!1ses!2ses\" allowfullscreen=\"\"></iframe></div><script>document.addEventListener(\"DOMContentLoaded\",function(){const accepted=document.cookie.includes(\"cookiesDirective=1\");if(accepted){const placeholder=document.getElementById(\"google-maps-placeholder\");const embed=document.getElementById(\"google-maps-embed\");if(placeholder)placeholder.style.display=\"none\";if(embed){embed.style.display=\"block\";const iframe=embed.querySelector(\"iframe\");if(iframe&&iframe.dataset.src){iframe.src=iframe.dataset.src;}}}});</script>';


    if ($content -match $pattern) {
        $content = $content -replace $pattern, $replace;
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
    $codigoesquema = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Church","name":"Parroquia San Francisco y Santa Clara de Asís","url":"https://sanfranciscoysantaclara.es","telephone":"+34 91 615 24 31","image":"https://sanfranciscoysantaclara.es/assets/images/index-meta-1200x630.webp","address":{"@type":"PostalAddress","streetAddress":"Calle de Suecia, 2","addressLocality":"Fuenlabrada","addressRegion":"Madrid","postalCode":"28942","addressCountry":"ES"},"geo":{"@type":"GeoCoordinates","latitude":40.2896387,"longitude":-3.8060985},"sameAs":["https://www.instagram.com/san.franciscoyclara/"]}</script>'
    
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
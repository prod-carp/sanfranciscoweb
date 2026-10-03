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

# Recorrer solo los HTML en la carpeta static (sin subcarpetas)
Get-ChildItem -Path "static" -File -Filter "*.html" |
    Where-Object { $_.Name -notin @("404.html", "cuestionario.html") } |
    ForEach-Object {
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

<head>
<link rel="canonical" href="$canonicalTag">
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
    # OLD: <section class="display-7"[^>]*>.*?<a href="https://mobiri\.se/[^"]+".*?</a>.*?<p[^>]*>.*?</p>.*?<a style="z-index:1" href="https://mobirise[^"]*">.*?</a></section>
    $pattern = '(?s)<section class="display-7"[^>]*>.*?mobiri\.se.*?mobirise.*?</section>'

    
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
    $pattern = '<script type="text/plain" data-src="assets/countdown/countdown.js">'
    if ($content -match $pattern) { $content = $content -replace $pattern, '<script data-src="assets/countdown/countdown.js">' }



# 1.5.5 TABLÓN DE ANUNCIOS
# Genera el carrusel directamente en el HTML estático de Mobirise.

$carpetaCarteles = Join-Path $PSScriptRoot "static/carteles"
$pattern = '<img src="assets/images/tablondeanuncios\.webp" alt="Tablón de anuncios horizontal">'

# Obtener imágenes y ordenarlas alfabéticamente por nombre.
$extensiones = @(".webp", ".jpg", ".jpeg", ".png")
$carteles = @(
    Get-ChildItem -LiteralPath $carpetaCarteles -File -ErrorAction SilentlyContinue |
    Where-Object { $extensiones -contains $_.Extension.ToLowerInvariant() } |
    Sort-Object Name
)

# Crear las cuatro primeras tarjetas.
$tarjetas = [System.Text.StringBuilder]::new()
$primerosCarteles = @($carteles | Select-Object -First 4)

foreach ($cartel in $primerosCarteles) {
    $nombre = [System.Uri]::EscapeDataString($cartel.Name)
    $url = "/carteles/$nombre"
    $alt = [System.Net.WebUtility]::HtmlEncode(
        [System.IO.Path]::GetFileNameWithoutExtension($cartel.Name)
    )

    [void]$tarjetas.AppendLine(@"
        <div class="cartel-slide">
            <a href="$url" class="cartel-enlace" data-cartel="$url" aria-label="Ampliar cartel: $alt">
                <img src="$url" alt="$alt" loading="lazy">
            </a>
        </div>
"@)
}

if ($primerosCarteles.Count -eq 0) {
    [void]$tarjetas.AppendLine('<p class="cartel-vacio">Próximamente, nuevos anuncios parroquiales.</p>')
}

# HTML, CSS y JavaScript del carrusel.
$replace = @"
<div id="tablon-anuncios" class="cartel-contenedor">
    <style>
        #tablon-anuncios { width:100%; }
        #tablon-anuncios .cartel-carrusel {
            display:grid;
            grid-template-columns:repeat(4,minmax(0,1fr));
            gap:16px;
            width:100%;
        }
        #tablon-anuncios .cartel-slide { min-width:0; }
        #tablon-anuncios .cartel-enlace {
            display:block;
            overflow:hidden;
            border-radius:8px;
            background:#f4f4f4;
            box-shadow:0 2px 8px rgba(0,0,0,.12);
            transition:transform .2s ease,box-shadow .2s ease;
            cursor:zoom-in;
        }
        #tablon-anuncios .cartel-enlace:hover {
            transform:translateY(-4px);
            box-shadow:0 6px 16px rgba(0,0,0,.2);
        }
        #tablon-anuncios .cartel-slide img {
            display:block;
            width:100%;
            height:auto;
            aspect-ratio:3/4;
            object-fit:contain;
        }
        #tablon-anuncios .cartel-vacio {
            grid-column:1/-1;
            text-align:center;
            padding:24px;
        }
        #tablon-anuncios .cartel-acciones {
            text-align:center;
            margin-top:22px;
        }
        #tablon-anuncios .cartel-boton {
            display:inline-block;
            padding:12px 25px;
            border-radius:30px;
            background:#245b49;
            color:#fff;
            text-decoration:none;
            font-weight:600;
            transition:background .2s ease;
        }
        #tablon-anuncios .cartel-boton:hover {
            background:#183f33;
            color:#fff;
        }
        /* Visor ampliado */
        #cartel-visor {
            display:none;
            position:fixed;
            inset:0;
            z-index:99999;
            background:rgba(0,0,0,.92);
            align-items:center;
            justify-content:center;
            padding:24px;
            cursor:zoom-out;
        }
        #cartel-visor.abierto { display:flex; }
        body.cartel-visor-abierto { overflow: hidden !important; }
        #cartel-visor img {
            max-width:96vw;
            max-height:92vh;
            width:auto;
            height:auto;
            object-fit:contain;
            border-radius:4px;
            transform:scale(.88);
            transition:transform .25s ease;
            cursor:default;
        }
        #cartel-visor.abierto img { transform:scale(1); }
        #cartel-visor-cerrar {
            position:absolute;
            top:12px;
            right:20px;
            border:0;
            background:transparent;
            color:white;
            font-size:38px;
            line-height:1;
            cursor:pointer;
        }
        @media(max-width:767px) {
            #tablon-anuncios .cartel-carrusel {
                display:flex;
                gap:12px;
                overflow-x:auto;
                padding:4px 2px 14px;
                scroll-snap-type:x mandatory;
                -webkit-overflow-scrolling:touch;
                scrollbar-width:none;
            }
            #tablon-anuncios .cartel-carrusel::-webkit-scrollbar { display:none; }
            #tablon-anuncios .cartel-slide {
                flex:0 0 78%;
                scroll-snap-align:start;
            }
            #tablon-anuncios .cartel-enlace:hover { transform:none; }
        }
    </style>

    <div class="cartel-carrusel" aria-label="Últimos anuncios parroquiales">
        $($tarjetas.ToString())
    </div>

    <div class="cartel-acciones">
        <a class="btn btn-primary" href="/tablon/">VER TODOS LOS CARTELES</a>
    </div>
</div>

<div id="cartel-visor" role="dialog" aria-modal="true" aria-label="Cartel ampliado">
    <button id="cartel-visor-cerrar" type="button" aria-label="Cerrar">&times;</button>
    <img src="" alt="Cartel ampliado">
</div>

<script>
(function () {
    var visor = document.getElementById('cartel-visor');
    if (!visor) return;
    var imagen = visor.querySelector('img');
    var cerrar = document.getElementById('cartel-visor-cerrar');

    function abrirVisor(src, alt) {
        imagen.src = src;
        imagen.alt = alt || 'Cartel ampliado';
        visor.classList.add('abierto');
        document.body.classList.add('cartel-visor-abierto');
    }

    function cerrarVisor() {
        visor.classList.remove('abierto');
        imagen.src = '';
        document.body.classList.remove('cartel-visor-abierto');
    }

    document.querySelectorAll('#tablon-anuncios [data-cartel]').forEach(function (enlace) {
        enlace.addEventListener('click', function (e) {
            e.preventDefault();
            var img = enlace.querySelector('img');
            abrirVisor(enlace.getAttribute('data-cartel'), img ? img.alt : '');
        });
    });

    cerrar.addEventListener('click', cerrarVisor);
    visor.addEventListener('click', function (e) {
        if (e.target === visor) cerrarVisor();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && visor.classList.contains('abierto')) {
            cerrarVisor();
        }
    });
})();
</script>
"@

if (Test-Path -LiteralPath $carpetaCarteles) {
    if ($content -match $pattern) {
        $content = [regex]::Replace(
            $content,
            $pattern,
            [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $replace },
            1
        )
        Write-Host "Carrusel de anuncios insertado correctamente."
    }
    else {
        Write-Host "No se encontró la imagen original del tablón en el HTML."
    }
}
else {
    Write-Host "No existe la carpeta de carteles: $carpetaCarteles"
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

   
    # 1.6 PAGINAS NO RASTREABLES
    if ($_.Name -in '404.html', 'cuestionario-grupos-parroquiales.html', 'legal.html', 'cookies.html', 'privacidad.html') {
        $content = $content -replace 'index,follow,max-image-preview:large', 'noindex,follow'
    }
    
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
Write-Host "Ejecutando destacado..."
& "$PSScriptRoot\destacado.ps1"
Write-Host "Actualizando calendario..."
& "$PSScriptRoot\calendario.ps1"

Read-Host "Presiona Enter para salir"
Clear-Host
chcp 65001

# ==========================================
# Configuración
# ==========================================

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

$NoticiasPath = Join-Path $Root "content\noticias"
$IndexPath    = Join-Path $Root "static\index.html"

# ==========================================
# Leer noticias
# ==========================================

$posts = Get-ChildItem $NoticiasPath -Filter "*.md" | ForEach-Object {

    $contenido = [System.IO.File]::ReadAllText(
    $_.FullName,
    [System.Text.Encoding]::UTF8
)

    $title = ""
    $subtitle = ""
    $date = ""
    $image = ""

    if ($contenido -match "title\s*=\s*'(.*?)'") {
        $title = $matches[1]
    }

    if ($contenido -match "subtitle\s*=\s*'(.*?)'") {
        $subtitle = $matches[1]
    }

    if ($contenido -match "date\s*=\s*'(.*?)'") {
        $date = [datetime]$matches[1]
    }

    if ($contenido -match 'image\s*=\s*["''](.*?)["'']') {
    $image = $matches[1]
    }

    [PSCustomObject]@{
        Title    = $title
        Subtitle = $subtitle
        Date     = $date
        Image    = $image
        Slug     = $_.BaseName
    }
}

# ==========================================
# Seleccionar las 4 más recientes
# ==========================================

$ultimas = $posts |
    Sort-Object Date -Descending |
    Select-Object -First 4
    
# ==========================================
# Generar HTML
# ==========================================
# Ancho columna <div class="card-body p-0
# Espacio con la imagen

$htmlNoticias = @'
<div class="row justify-content-center">
'@

foreach ($post in $ultimas) {

    $fecha = $post.Date.ToString("dd/MM/yyyy")

    $resumen = $post.Subtitle

    if ($resumen.Length -gt 130) {
        $resumen = $resumen.Substring(0,130) + "..."
    }

    $htmlNoticias += @"

<div class="col-6 col-lg-3 mb-4">
    <div class="card h-100">

    <a href="/noticias/$($post.Slug)/">
        <img
            src="$($post.Image)"
            class="card-img-top mb-1 noticias-img"
            alt="$($post.Title)">
     </a>

        <div class="card-body p-0 d-flex flex-column">

            <small class="text-muted mb-2">
                $fecha
            </small>

            <h3 class="card-title h5">
                $($post.Title)
            </h3>

            <p class="card-text">
                $resumen
            </p>

            <a
                href="/noticias/$($post.Slug)/"
                class="mt-auto">
                <b>Leer más →</b>
            </a>

        </div>
    </div>
</div>
<style>
.noticias-img {
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
}
</style>
"@
}

$htmlNoticias += "</div>"

# ==========================================
# Reemplazar marcador
# ==========================================

$index = [System.IO.File]::ReadAllText(
    $IndexPath,
    [System.Text.Encoding]::UTF8
)

$index = $index.Replace(
    "<!-- NOTICIAS_AUTOGENERADAS -->",
    $htmlNoticias
)

[System.IO.File]::WriteAllText(
    $IndexPath,
    $index,
    [System.Text.Encoding]::UTF8
)

Write-Host "Últimas noticias insertadas correctamente."

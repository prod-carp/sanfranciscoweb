# Script para crear posts en Hugo con gestión de imágenes
# Guardar como: New-HugoPost.ps1

# Definir rutas base
$basePath = Split-Path -Parent $MyInvocation.MyCommand.Path
$contentPath = Join-Path $basePath "content\noticias\"
$imagesPath = Join-Path $basePath "static\assets\images\blog\"

# Crear carpetas si no existen Read-Host "Hecho"
if (!(Test-Path $contentPath)) { Read-Host "La carpeta $contentPath no existe" }
if (!(Test-Path $imagesPath)) { Read-Host "La carpeta $imagesPath no existe" }


# Función para seleccionar archivo de imagen
function Select-ImageFile {
    Add-Type -AssemblyName System.Windows.Forms
    $openFileDialog = New-Object System.Windows.Forms.OpenFileDialog
    $openFileDialog.Title = "Selecciona la imagen para el post"
    $openFileDialog.Filter = "Imágenes (*.jpg;*.jpeg;*.png;*.webp;*.bmp;*.gif)|*.jpg;*.jpeg;*.png;*.webp;*.bmp;*.gif"
    $openFileDialog.ShowDialog() | Out-Null
    return $openFileDialog.FileName
}

# Función para convertir imagen con ffmpeg
function Convert-ImageToWebP {
    param (
        [string]$inputPath,
        [string]$outputPath,
        [int]$size = 637,
        [int]$quality = 80
    )

    $ffmpegPath = "C:\WINDOWS\System32\ffmpeg.exe"

    if (!(Test-Path $ffmpegPath)) {
        Write-Host "No se encontró ffmpeg" -ForegroundColor Red
        return $false
    }

    try {

        Write-Host "Procesando imagen..." -ForegroundColor Cyan

        & $ffmpegPath `
            -hide_banner `
            -loglevel error `
            -stats `
            -i $inputPath `
            -vf "crop=min(iw\,ih):min(iw\,ih):(iw-min(iw\,ih))/2:(ih-min(iw\,ih))/2,scale=${size}:${size}:flags=lanczos" `
            -c:v libwebp `
            -quality $quality `
            -preset default `
            -y `
            $outputPath

        if ($LASTEXITCODE -eq 0 -and (Test-Path $outputPath)) {
            Write-Host "Imagen convertida correctamente" -ForegroundColor Green
            return $true
        }

        Write-Host "ffmpeg devolvió un error ($LASTEXITCODE)" -ForegroundColor Red
        return $false

    }
    catch {
        Write-Host $_
        return $false
    }
}

function Select-Date {

    Add-Type -AssemblyName System.Windows.Forms

    $datePicker = New-Object System.Windows.Forms.DateTimePicker
    $datePicker.Format = 'Custom'
    $datePicker.CustomFormat = 'yyyy-MM-dd HH:mm:ss'
    $datePicker.ShowUpDown = $true
    $datePicker.Width = 200

    $form = New-Object System.Windows.Forms.Form
    $form.Text = "Selecciona la fecha de publicación"
    $form.Size = New-Object System.Drawing.Size(300,120)
    $form.StartPosition = 'CenterScreen'

    $form.Controls.Add($datePicker)

    $button = New-Object System.Windows.Forms.Button
    $button.Text = "Aceptar"
    $button.Width = 80
    $button.Location = New-Object System.Drawing.Point(105,45)
    $button.Add_Click({ $form.Close() })
    $form.Controls.Add($button)

    $form.ShowDialog() | Out-Null

    $offset = [System.TimeZoneInfo]::Local.GetUtcOffset($datePicker.Value)
    return ([DateTimeOffset]::new($datePicker.Value, $offset)).ToString("yyyy-MM-ddTHH:mm:sszzz")
}

# Función para obtener el título del post (slug)
function Get-SlugFromTitle {
    param (
        [string]$title
    )

    $slug = $title.ToLower().Trim()

    # Sustituir caracteres españoles
    $replacements = @{
        'á' = 'a'
        'à' = 'a'
        'ä' = 'a'
        'â' = 'a'

        'é' = 'e'
        'è' = 'e'
        'ë' = 'e'
        'ê' = 'e'

        'í' = 'i'
        'ì' = 'i'
        'ï' = 'i'
        'î' = 'i'

        'ó' = 'o'
        'ò' = 'o'
        'ö' = 'o'
        'ô' = 'o'

        'ú' = 'u'
        'ù' = 'u'
        'ü' = 'u'
        'û' = 'u'

        'ñ' = 'n'
        'ç' = 'c'
    }

    foreach ($key in $replacements.Keys) {
        $slug = $slug.Replace($key, $replacements[$key])
    }

    # Eliminar cualquier carácter no permitido
    $slug = $slug -replace '[^a-z0-9\s-]', ''

    # Espacios por guiones
    $slug = $slug -replace '\s+', '-'

    # Evitar varios guiones seguidos
    $slug = $slug -replace '-+', '-'

    # Eliminar guiones al principio y final
    $slug = $slug.Trim('-')

    # Limitar longitud del slug sin cortar palabras
    $maxLength = 40

    if ($slug.Length -gt $maxLength) {
        $cut = $slug.Substring(0, $maxLength)

        # Buscar el último guion antes del límite
        $lastDash = $cut.LastIndexOf('-')

        if ($lastDash -gt 0) {
            $slug = $cut.Substring(0, $lastDash)
        }
        else {
            $slug = $cut
        }
    }
    return $slug
}

# MAIN SCRIPT
Clear-Host
Write-Host "=== CREACIÓN DE POST EN HUGO ===" -ForegroundColor Yellow
Write-Host ""

# Solicitar información al usuario
$title = Read-Host "1) Título del post"
Write-Host "Slug generado: $(Get-SlugFromTitle $title)" -ForegroundColor Cyan
$subtitle = Read-Host "2) Subtítulo del post"

# Seleccionar categoría
Write-Host ""
Write-Host "3) Selecciona la categoría:"
Write-Host "   1) Parroquia"
Write-Host "   2) Peregrinaciones"
Write-Host "   3) Testimonios"
Write-Host "   4) Espiritualidad"
Write-Host "   5) Formación"
Write-Host "   6) Exterior"
$categoryChoice = Read-Host "Elige una opción (1-6)"

$categories = @{
    1 = "Parroquia"
    2 = "Peregrinaciones"
    3 = "Testimonios"
    4 = "Espiritualidad"
    5 = "Formación"
    6 = "Exterior"
}

$category = $categories[[int]$categoryChoice]
if (-not $category) {
    Write-Host "Opción no válida. Usando 'Parroquia' por defecto." -ForegroundColor Yellow
    $category = "Parroquia"
}

# Preguntar si es importante
Write-Host ""
$importantChoice = Read-Host "4) ¿Es importante? (S/N)"
$tags = if ($importantChoice.ToUpper() -eq 'S') { @("importante") } else { @() }

# Seleccionar imagen
Write-Host ""
Write-Host "5) Selecciona una imagen" -ForegroundColor Cyan
$imagePath = Select-ImageFile
if (-not $imagePath) {
    Write-Host "No se seleccionó imagen. Continuando sin imagen." -ForegroundColor Yellow
    $imageName = ""
} else {
    # Generar nombre de archivo para la imagen
    $slug = Get-SlugFromTitle -title $title
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $imageName = "${slug}_${timestamp}.webp"
    $outputImagePath = Join-Path $imagesPath $imageName
    
    # Convertir imagen
    Write-Host ""
    Write-Host "Procesando imagen con ffmpeg..." -ForegroundColor Cyan
    if (Convert-ImageToWebP -inputPath $imagePath -outputPath $outputImagePath -size 637 -quality 80) {
        Write-Host "Imagen guardada en: assets/images/blog/$imageName" -ForegroundColor Green
    } else {
        $imageName = ""
        Write-Host "Error al procesar la imagen. Continuando sin ella." -ForegroundColor Yellow
    }
}

# Introducir contenido del post
Write-Host ""
Write-Host "6) Introduce el contenido del post (Markdown):" -ForegroundColor Cyan
Write-Host "(Escribe el contenido. Escribe 'FINAL' en una línea nueva para terminar)" -ForegroundColor Gray
$contentLines = @()
while ($true) {
    $line = Read-Host
    if ($line -eq 'FINAL') { break }
    $contentLines += $line
}
$content = $contentLines -join "`n"

# Seleccionar fecha
Write-Host ""
Write-Host "7) Selecciona la fecha de publicación" -ForegroundColor Cyan
$date = Select-Date
if (-not $date) {
    $date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

# Generar nombre del archivo
$slug = Get-SlugFromTitle -title $title
$dateSlug = (Get-Date -Format "yyyy-MM-dd") + "-" + $slug
$filename = Join-Path $contentPath "$dateSlug.md"

# Construir el contenido del post
$postContent = @"
+++
title = '$title'
subtitle = '$subtitle'
date = '$date'
draft = false
categorias = ["$category"]
tags = [$(if ($tags.Count -gt 0) { '"importante"' } else { '""' })]
weight = 0
image = "/assets/images/blog/$(if ($imageName) { $imageName } else { '' })"
+++

$content
"@

# Guardar el archivo
$postContent | Out-File -FilePath $filename -Encoding UTF8

Write-Host ""
Write-Host "=== POST CREADO EXITOSAMENTE ===" -ForegroundColor Green
Write-Host "Archivo: $filename" -ForegroundColor White
Write-Host "Título: $title" -ForegroundColor White
Write-Host "Categoría: $category" -ForegroundColor White
Write-Host "Fecha: $date" -ForegroundColor White
if ($imageName) {
    Write-Host "Imagen: $imageName" -ForegroundColor White
}
Write-Host ""
Write-Host "¡Listo para publicar!" -ForegroundColor Yellow
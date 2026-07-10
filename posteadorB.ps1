# Introducir contenido del post
Write-Host ""
Write-Host "Introduce el contenido del post (Markdown):" -ForegroundColor Cyan
Write-Host "(Escribe el contenido. Escribe 'FIN' en una línea nueva para terminar)" -ForegroundColor Gray

$contentLines = @()
while ($true) {
    $line = Read-Host
    if ($line -eq 'FIN') { break }
    $contentLines += $line
}

# Obtener el Título
$title = ""
foreach ($line in $contentLines) {
    if ($line.Trim() -match '^#\s+(.+)$') {
        $title = $matches[1].Trim()
        break
    }
}

if ([string]::IsNullOrWhiteSpace($title)) {
    Write-Host ""
    Write-Host "No se ha encontrado un título (# Título)." -ForegroundColor Red
    $title = Read-Host "Introduce el título"
} else {
    Write-Host ""
    Write-Host "✓ Título detectado: $title" -ForegroundColor Green
}

# Comprobar longitud SEO
if ($title.Length -lt 40 -or $title.Length -gt 60) {
    Write-Host ""
    Write-Host "El título tiene $($title.Length) caracteres." -ForegroundColor Yellow
    Write-Host "Para SEO suele recomendarse entre 40 y 60 caracteres." -ForegroundColor Yellow
    Write-Host ""
    $title = Read-Host "Título (modifícalo si lo deseas)"
} else {
    Write-Host "✓ Longitud SEO óptima: $($title.Length) caracteres" -ForegroundColor Green
}

# Obtener el Subtítulo (primer párrafo después del título)
$subtitle = ""
$foundTitle = $false
$foundSubtitle = $false

foreach ($line in $contentLines) {
    # Buscar el título
    if (-not $foundTitle) {
        if ($line.Trim() -match '^#\s+') {
            $foundTitle = $true
        }
        continue
    }
    
    # Después de encontrar el título, buscar el subtítulo
    if ($foundTitle -and -not $foundSubtitle) {
        $text = $line.Trim()
        
        # Saltar líneas vacías
        if ($text -eq "") { continue }
        
        # Saltar otros títulos (##, ###, etc.)
        if ($text.StartsWith("#")) { 
            # Si hay otro título, lo tomamos como subtítulo
            $subtitle = $text -replace '^#+\s+', ''
            $foundSubtitle = $true
            break
        }
        
        # Tomar el primer texto como subtítulo
        $subtitle = $text
        $foundSubtitle = $true
        break
    }
}

# Si no se encontró subtítulo automáticamente, pedir uno
if ([string]::IsNullOrWhiteSpace($subtitle)) {
    Write-Host ""
    Write-Host "No se encontró un subtítulo automáticamente." -ForegroundColor Yellow
    $subtitle = Read-Host "Introduce un subtítulo (opcional, presiona Enter para omitir)"
}

# Recortar a 155 caracteres
if (-not [string]::IsNullOrWhiteSpace($subtitle)) {
    $maxLength = 155
    
    if ($subtitle.Length -gt $maxLength) {
        $cut = $subtitle.Substring(0, $maxLength)
        $lastSpace = $cut.LastIndexOf(" ")
        
        if ($lastSpace -gt 0) {
            $subtitle = $cut.Substring(0, $lastSpace)
        } else {
            $subtitle = $cut
        }
        
        $subtitle += "..."
        Write-Host "✓ Subtítulo recortado a $($subtitle.Length) caracteres" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "✓ Subtítulo: $subtitle" -ForegroundColor Green
}

# Mostrar resumen final
Write-Host ""
Write-Host "===== RESUMEN =====" -ForegroundColor Cyan
Write-Host "Título: $title (Longitud: $($title.Length))" -ForegroundColor White
if (-not [string]::IsNullOrWhiteSpace($subtitle)) {
    Write-Host "Subtítulo: $subtitle (Longitud: $($subtitle.Length))" -ForegroundColor White
} else {
    Write-Host "Subtítulo: (No especificado)" -ForegroundColor Gray
}
Write-Host "==================" -ForegroundColor Cyan
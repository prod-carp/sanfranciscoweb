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
while ($true) {
    $chunk = Read-Host

    if ($chunk -eq "FIN") {
        break
    }

    $content += $chunk + "`n"
}

$contentLines = $content -split "`r?`n"

#Obener el Título

$title = ""

$contentLines | Select-Object -First 5 | ForEach-Object {
    Write-Host "[$_]"
}
foreach ($line in $contentLines) {
    if ($line.Trim() -match '^#\s+(.+)$') {
        $title = $matches[1].Trim()
        break
    }
}

if ([string]::IsNullOrWhiteSpace($title)) {
    Write-Host "No se ha encontrado un título (# Título)." -ForegroundColor Red
    $title = Read-Host "Introduce el título"
}
else {
    Write-Host ""
    Write-Host "✓ Título detectado: $title" -ForegroundColor Green
}

#Comprobar longitud SEO

if ($title.Length -lt 40 -or $title.Length -gt 60) {

    Write-Host ""
    Write-Host "El título tiene $($title.Length) caracteres." -ForegroundColor Yellow
    Write-Host "Para SEO suele recomendarse entre 40 y 60 caracteres." -ForegroundColor Yellow
    Write-Host ""

    $title = Read-Host "Título (modifícalo si lo deseas)"
}
else {
    Write-Host "Título detectado: $title" -ForegroundColor Green
}

# Obener el Subtítulo

$subtitle = ""
$foundTitle = $false

foreach ($line in $contentLines) {

    if (-not $foundTitle) {
        if ($line -match '^#\s+') {
            $foundTitle = $true
        }
        continue
    }

    $text = $line.Trim()

    if ($text -eq "") { continue }

    if ($text.StartsWith("#")) { continue }

    $subtitle = $text
    break
}

# Recortar a 155 caracteres

$maxLength = 155

if ($subtitle.Length -gt $maxLength) {

    $cut = $subtitle.Substring(0, $maxLength)

    $lastSpace = $cut.LastIndexOf(" ")

    if ($lastSpace -gt 0) {
        $subtitle = $cut.Substring(0, $lastSpace)
    }
    else {
        $subtitle = $cut
    }

    $subtitle += "..."
}

Read-Host "$title"
Read-Host "$subtitle"
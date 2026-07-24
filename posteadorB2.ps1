# ============================================
# ANALIZADOR DE CONTENIDO MARKDOWN PARA SEO
# ============================================

function Show-Menu {
    Clear-Host
    Write-Host "📝 ANÁLISIS DE CONTENIDO MARKDOWN" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Selecciona una opción:" -ForegroundColor White
    Write-Host "  1. 📂 Leer archivo .md existente" -ForegroundColor Yellow
    Write-Host "  2. ✍️  Introducir contenido manualmente" -ForegroundColor Yellow
    Write-Host "  3. 📋 Pegar desde portapapeles" -ForegroundColor Yellow
    Write-Host "  0. ❌ Salir" -ForegroundColor Red
    Write-Host ""
}

function Read-MarkdownFile {
    Write-Host ""
    Write-Host "📂 SELECCIONAR ARCHIVO MARKDOWN" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    # Opción 1: Ruta específica
    Write-Host ""
    Write-Host "Opciones:" -ForegroundColor White
    Write-Host "  • Escribe la ruta del archivo .md" -ForegroundColor Gray
    Write-Host "  • Presiona Enter para seleccionar con el explorador" -ForegroundColor Gray
    Write-Host ""
    
    $filePath = Read-Host "Ruta del archivo"
    
    if ([string]::IsNullOrWhiteSpace($filePath)) {
        # Usar el explorador de archivos
        Add-Type -AssemblyName System.Windows.Forms
        $openFileDialog = New-Object System.Windows.Forms.OpenFileDialog
        $openFileDialog.Filter = "Archivos Markdown (*.md)|*.md|Todos los archivos (*.*)|*.*"
        $openFileDialog.Title = "Selecciona un archivo Markdown"
        $openFileDialog.InitialDirectory = [Environment]::GetFolderPath('Desktop')
        
        if ($openFileDialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
            $filePath = $openFileDialog.FileName
        } else {
            Write-Host "❌ No se seleccionó ningún archivo" -ForegroundColor Red
            return $null
        }
    }
    
    # Verificar que el archivo existe
    if (-not (Test-Path $filePath)) {
        Write-Host "❌ El archivo no existe: $filePath" -ForegroundColor Red
        return $null
    }
    
    # Verificar extensión
    if ($filePath -notlike "*.md") {
        Write-Host "⚠️  El archivo no tiene extensión .md" -ForegroundColor Yellow
        $confirm = Read-Host "¿Deseas continuar? (S/N)"
        if ($confirm -ne 'S' -and $confirm -ne 's') {
            return $null
        }
    }
    
    try {
        Write-Host ""
        Write-Host "📖 Leyendo archivo: $filePath" -ForegroundColor Green
        
        # Leer el archivo
        $content = Get-Content -Path $filePath -Raw -Encoding UTF8
        $contentLines = $content -split "`r?`n" | Where-Object { $_ -ne "" }
        
        Write-Host "✅ Archivo leído correctamente ($($contentLines.Count) líneas)" -ForegroundColor Green
        
        # Mostrar preview
        Write-Host ""
        Write-Host "📄 PREVIEW (primeras 5 líneas):" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        $contentLines | Select-Object -First 5 | ForEach-Object {
            if ($_.StartsWith("#")) {
                Write-Host "  $_" -ForegroundColor Yellow
            } else {
                Write-Host "  $_" -ForegroundColor Gray
            }
        }
        if ($contentLines.Count -gt 5) {
            Write-Host "  ... y $($contentLines.Count - 5) líneas más" -ForegroundColor Gray
        }
        Write-Host ""
        
        return $contentLines
    }
    catch {
        Write-Host "❌ Error al leer el archivo: $_" -ForegroundColor Red
        return $null
    }
}

function Read-ManualContent {
    Write-Host ""
    Write-Host "✍️  INTRODUCIR CONTENIDO MANUAL" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Instrucciones:" -ForegroundColor White
    Write-Host "  • Escribe línea por línea" -ForegroundColor Gray
    Write-Host "  • Escribe 'FIN' en una línea nueva para terminar" -ForegroundColor Gray
    Write-Host ""
    
    $contentLines = @()
    while ($true) {
        $line = Read-Host "> "
        if ($line -eq 'FIN') { break }
        if (-not [string]::IsNullOrWhiteSpace($line)) {
            $contentLines += $line
        }
    }
    
    return $contentLines
}

function Read-FromClipboard {
    Write-Host ""
    Write-Host "📋 PEGAR DESDE PORTAPAPELES" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    try {
        $clipboardContent = Get-Clipboard
        if ([string]::IsNullOrWhiteSpace($clipboardContent)) {
            Write-Host "❌ El portapapeles está vacío" -ForegroundColor Red
            return $null
        }
        
        $contentLines = $clipboardContent -split "`r?`n" | Where-Object { $_ -ne "" }
        Write-Host "✅ Se han leído $($contentLines.Count) líneas del portapapeles" -ForegroundColor Green
        
        # Mostrar preview
        Write-Host ""
        Write-Host "📄 PREVIEW (primeras 5 líneas):" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        $contentLines | Select-Object -First 5 | ForEach-Object {
            if ($_.StartsWith("#")) {
                Write-Host "  $_" -ForegroundColor Yellow
            } else {
                Write-Host "  $_" -ForegroundColor Gray
            }
        }
        if ($contentLines.Count -gt 5) {
            Write-Host "  ... y $($contentLines.Count - 5) líneas más" -ForegroundColor Gray
        }
        Write-Host ""
        
        return $contentLines
    }
    catch {
        Write-Host "❌ Error al leer el portapapeles: $_" -ForegroundColor Red
        return $null
    }
}

function Analyze-Content {
    param(
        [string[]]$ContentLines
    )
    
    if ($null -eq $ContentLines -or $ContentLines.Count -eq 0) {
        Write-Host "❌ No hay contenido para analizar" -ForegroundColor Red
        return
    }
    
    # ============================================
    # 1. DETECTAR TÍTULO
    # ============================================
    Write-Host ""
    Write-Host "📊 ANÁLISIS DEL CONTENIDO" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    $title = ""
    $titleLine = $null
    $titleLevel = 0
    
    foreach ($line in $ContentLines) {
        if ($line.Trim() -match '^(#+)\s+(.+)$') {
            $title = $matches[2].Trim()
            $titleLevel = $matches[1].Length
            $titleLine = $line
            break
        }
    }
    
    if ([string]::IsNullOrWhiteSpace($title)) {
        Write-Host ""
        Write-Host "❌ No se ha encontrado un título (# Título)." -ForegroundColor Red
        Write-Host "Buscando en las primeras líneas:" -ForegroundColor Yellow
        $ContentLines | Select-Object -First 3 | ForEach-Object { 
            Write-Host "  '$_'" -ForegroundColor Gray 
        }
        $title = Read-Host "Introduce el título manualmente"
        $titleLevel = 1
    } else {
        Write-Host ""
        Write-Host "✅ Título detectado (Nivel $titleLevel):" -ForegroundColor Green
        Write-Host "   $title" -ForegroundColor White
    }
    
    # ============================================
    # 2. ANÁLISIS SEO DEL TÍTULO
    # ============================================
    Write-Host ""
    Write-Host "🔍 ANÁLISIS SEO" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    $titleLength = $title.Length
    Write-Host "Título: $title" -ForegroundColor White
    Write-Host "Longitud: $titleLength caracteres" -ForegroundColor Gray
    
    if ($titleLength -lt 40) {
        Write-Host "⚠️  Título demasiado corto (< 40 caracteres)" -ForegroundColor Yellow
        Write-Host "   Recomendación: Entre 40 y 60 caracteres" -ForegroundColor Gray
    } elseif ($titleLength -gt 60) {
        Write-Host "⚠️  Título demasiado largo (> 60 caracteres)" -ForegroundColor Yellow
        Write-Host "   Recomendación: Entre 40 y 60 caracteres" -ForegroundColor Gray
    } else {
        Write-Host "✅ Longitud SEO óptima" -ForegroundColor Green
    }
    
    # ============================================
    # 3. DETECTAR SUBTÍTULO
    # ============================================
    $subtitle = ""
    $foundTitle = $false
    $foundSubtitle = $false
    
    foreach ($line in $ContentLines) {
        if (-not $foundTitle) {
            if ($line.Trim() -match '^#+\s+') {
                $foundTitle = $true
            }
            continue
        }
        
        if ($foundTitle -and -not $foundSubtitle) {
            $text = $line.Trim()
            
            if ($text -eq "") { continue }
            
            if ($text.StartsWith("#")) { 
                $subtitle = $text -replace '^#+\s+', ''
                $foundSubtitle = $true
                break
            }
            
            $subtitle = $text
            $foundSubtitle = $true
            break
        }
    }
    
    if ([string]::IsNullOrWhiteSpace($subtitle)) {
        Write-Host ""
        Write-Host "⚠️  No se encontró un subtítulo automáticamente." -ForegroundColor Yellow
        $subtitle = Read-Host "Introduce un subtítulo (opcional)"
    } else {
        Write-Host ""
        Write-Host "✅ Subtítulo detectado:" -ForegroundColor Green
        Write-Host "   $subtitle" -ForegroundColor White
    }
    
    # ============================================
    # 4. RECORTAR SUBTÍTULO
    # ============================================
    if (-not [string]::IsNullOrWhiteSpace($subtitle)) {
        $maxLength = 155
        $originalLength = $subtitle.Length
        
        if ($subtitle.Length -gt $maxLength) {
            $cut = $subtitle.Substring(0, $maxLength)
            $lastSpace = $cut.LastIndexOf(" ")
            
            if ($lastSpace -gt 0) {
                $subtitle = $cut.Substring(0, $lastSpace)
            } else {
                $subtitle = $cut
            }
            
            $subtitle += "..."
            Write-Host ""
            Write-Host "✂️  Subtítulo recortado de $originalLength a $($subtitle.Length) caracteres" -ForegroundColor Yellow
        }
    }
    
    # ============================================
    # 5. ESTADÍSTICAS ADICIONALES
    # ============================================
    Write-Host ""
    Write-Host "📊 ESTADÍSTICAS DEL CONTENIDO" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    $totalLines = $ContentLines.Count
    $totalWords = ($ContentLines -join " ").Split(" ", [StringSplitOptions]::RemoveEmptyEntries).Count
    $totalChars = ($ContentLines -join " ").Length
    
    # Contar títulos y subtítulos
    $h1Count = ($ContentLines | Where-Object { $_ -match '^#\s' }).Count
    $h2Count = ($ContentLines | Where-Object { $_ -match '^##\s' }).Count
    $h3Count = ($ContentLines | Where-Object { $_ -match '^###\s' }).Count
    
    Write-Host "Líneas totales    : $totalLines" -ForegroundColor White
    Write-Host "Palabras totales  : $totalWords" -ForegroundColor White
    Write-Host "Caracteres totales: $totalChars" -ForegroundColor White
    Write-Host "Títulos H1        : $h1Count" -ForegroundColor Gray
    Write-Host "Títulos H2        : $h2Count" -ForegroundColor Gray
    Write-Host "Títulos H3        : $h3Count" -ForegroundColor Gray
    
    # ============================================
    # 6. RESUMEN FINAL
    # ============================================
    Write-Host ""
    Write-Host "📋 RESUMEN FINAL" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Título    : $title" -ForegroundColor White
    Write-Host "Longitud  : $($title.Length) caracteres" -ForegroundColor Gray
    if (-not [string]::IsNullOrWhiteSpace($subtitle)) {
        Write-Host "Subtítulo : $subtitle" -ForegroundColor White
        Write-Host "Longitud  : $($subtitle.Length) caracteres" -ForegroundColor Gray
    } else {
        Write-Host "Subtítulo : (No especificado)" -ForegroundColor Gray
    }
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    # ============================================
    # 7. GUARDAR RESULTADOS (OPCIONAL)
    # ============================================
    Write-Host ""
    $saveOption = Read-Host "¿Deseas guardar el análisis en un archivo? (S/N)"
    if ($saveOption -eq 'S' -or $saveOption -eq 's') {
        $outputPath = Join-Path $PWD.Path "analisis_seo_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
        
        $output = @"
ANÁLISIS SEO DE CONTENIDO MARKDOWN
====================================
Fecha: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')

TÍTULO
-------
$title
Longitud: $($title.Length) caracteres

SUBTÍTULO
----------
$(if ($subtitle) { $subtitle } else { "No especificado" })
Longitud: $(if ($subtitle) { $subtitle.Length } else { "0" }) caracteres

ESTADÍSTICAS
-------------
Líneas totales    : $totalLines
Palabras totales  : $totalWords
Caracteres totales: $totalChars
Títulos H1        : $h1Count
Títulos H2        : $h2Count
Títulos H3        : $h3Count

CONTENIDO COMPLETO
-------------------
$(($ContentLines -join "`n"))
"@
        
        $output | Out-File -FilePath $outputPath -Encoding UTF8
        Write-Host "✅ Análisis guardado en: $outputPath" -ForegroundColor Green
    }
}

# ============================================
# PROGRAMA PRINCIPAL
# ============================================

$contentLines = $null

do {
    Show-Menu
    $option = Read-Host "Opción"
    
    switch ($option) {
        "1" {
            $contentLines = Read-MarkdownFile
            if ($null -ne $contentLines) {
                Analyze-Content -ContentLines $contentLines
                Write-Host ""
                Read-Host "Presiona Enter para continuar"
            }
        }
        "2" {
            $contentLines = Read-ManualContent
            if ($contentLines.Count -gt 0) {
                Analyze-Content -ContentLines $contentLines
                Write-Host ""
                Read-Host "Presiona Enter para continuar"
            }
        }
        "3" {
            $contentLines = Read-FromClipboard
            if ($null -ne $contentLines) {
                Analyze-Content -ContentLines $contentLines
                Write-Host ""
                Read-Host "Presiona Enter para continuar"
            }
        }
        "0" {
            Write-Host "👋 ¡Hasta luego!" -ForegroundColor Cyan
            exit
        }
        default {
            Write-Host "❌ Opción no válida" -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
} while ($option -ne "0")
$baseUrl = "https://sanfranciscoysantaclara.es/"
$count = 0
$modified = 0

Get-ChildItem -Path "static" -Recurse -Filter "*.html" | ForEach-Object {
    $count++
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\static\", "").Replace("\", "/")
    Write-Host "Procesando: $relativePath"
    
    $content = Get-Content $_.FullName -Raw
    if ($content -notmatch '<link rel="canonical"') {
        $newContent = $content -replace "(<head[^>]*>)", "`$1`n    <link rel=`"canonical`" href=`"$baseUrl/$relativePath`" />"
        Set-Content $_.FullName -Value $newContent -NoNewline
        $modified++
        Write-Host "  [OK] Canonical agregado" -ForegroundColor Green
        Read-Host "Primer archivo modificado. Pulsa Enter para continuar"
    } else {
        Write-Host "  [SKIP] Ya tiene canonical" -ForegroundColor Gray
    }
}

Write-Host "`nTotal HTML: $count"
Write-Host "Modificados: $modified"
Read-Host "`nPresiona Enter para salir"
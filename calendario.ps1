# ================================
# Configuración
# ================================
$ErrorActionPreference = "Stop"
$ICS_URL = (Get-Content -Path "enlacecalendar.txt" -Raw).Trim()

# ================================
# 1. Refrescar eventos del calendario
# ================================
Write-Host "Descargando eventos del calendario..." -ForegroundColor Cyan
$env:GCAL_ICS_URL = $ICS_URL
node scripts/fetch-calendar.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Falló la descarga del calendario. Abortando." -ForegroundColor Red
    exit 1
}

Write-Host "Calendario actualizado." -ForegroundColor Green
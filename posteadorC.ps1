#
# PANEL EDITOR DE TEXTO
#

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = "Editor del artículo"
$form.Size = New-Object System.Drawing.Size(900,700)
$form.StartPosition = "CenterScreen"

# Cuadro de texto
$textBox = New-Object System.Windows.Forms.TextBox
$textBox.Multiline = $true
$textBox.AcceptsReturn = $true
$textBox.AcceptsTab = $true
$textBox.ScrollBars = "Vertical"
$textBox.WordWrap = $true
$textBox.Font = New-Object System.Drawing.Font("Consolas",11)
$textBox.Location = New-Object System.Drawing.Point(10,10)
$textBox.Size = New-Object System.Drawing.Size(860,600)

$form.Controls.Add($textBox)

# Botón Aceptar
$btnAceptar = New-Object System.Windows.Forms.Button
$btnAceptar.Text = "Aceptar"
$btnAceptar.Location = New-Object System.Drawing.Point(690,620)
$btnAceptar.Size = New-Object System.Drawing.Size(85,30)
$btnAceptar.Add_Click({
    $form.Tag = $textBox.Text
    $form.Close()
})

$form.Controls.Add($btnAceptar)

# Botón Cancelar
$btnCancelar = New-Object System.Windows.Forms.Button
$btnCancelar.Text = "Cancelar"
$btnCancelar.Location = New-Object System.Drawing.Point(785,620)
$btnCancelar.Size = New-Object System.Drawing.Size(85,30)
$btnCancelar.Add_Click({
    $form.Tag = $null
    $form.Close()
})

$form.Controls.Add($btnCancelar)

$form.ShowDialog() | Out-Null

$content = $form.Tag

if ($null -eq $content) {
    Write-Host "Operación cancelada."
    exit
}

Write-Host ""
Write-Host "Contenido recibido:" -ForegroundColor Green
Write-Host "-----------------------------------"
Write-Host $content
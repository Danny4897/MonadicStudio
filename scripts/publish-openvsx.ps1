param(
  [string]$Pat = $env:OVSX_PAT
)

$ErrorActionPreference = 'Stop'

if (-not $Pat) {
  Write-Host @"
OVSX_PAT non impostato.

1. Login su https://open-vsx.org (GitHub + Eclipse Publisher Agreement)
2. Genera token: https://open-vsx.org/user-settings/tokens
3. Esegui:
   `$env:OVSX_PAT = 'tuo-token'
   .\scripts\publish-openvsx.ps1

Vedi docs/PUBLISHING.md
"@
  exit 1
}

$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host '>> Build VSIX...'
npm run pack:extension

Write-Host '>> Create namespace (ignora errore se esiste)...'
npx ovsx create-namespace monadicleaf -p $Pat 2>$null

$vsix = Get-ChildItem extension\*.vsix | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $vsix) { throw 'VSIX non trovato in extension/' }

Write-Host ">> Publish $($vsix.Name)..."
npx ovsx publish $vsix.FullName -p $Pat

Write-Host ''
Write-Host 'Pubblicato su Open VSX. Verifica:'
Write-Host '  https://open-vsx.org/monadicleaf/monadic-studio'
Write-Host 'In Cursor: Extensions -> cerca MonadicStudio'

# build-apk.ps1 — build an installable Android APK for HazardHub STL via EAS on Windows.
$ErrorActionPreference = "Continue"

$ProjectDir = $PSScriptRoot
Set-Location $ProjectDir
Write-Host "Project directory: $ProjectDir" -ForegroundColor Cyan

# Prepend local Node 20 if present
$Node20Bin = Join-Path $ProjectDir "node_modules\node\bin"
if (Test-Path $Node20Bin) {
    $env:PATH = "$Node20Bin;$env:PATH"
}
Write-Host "Using Node $(node -v)" -ForegroundColor Green

# Check Expo authentication
Write-Host "Checking Expo authentication..." -ForegroundColor Cyan
& npx.cmd --yes eas-cli whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in to Expo. Logging in to Expo (free account at https://expo.dev)..." -ForegroundColor Yellow
    & npx.cmd --yes eas-cli login
} else {
    Write-Host "Logged in to Expo as: $(& npx.cmd --yes eas-cli whoami)" -ForegroundColor Green
}


Write-Host "Submitting Android APK build (preview profile)..." -ForegroundColor Cyan
& npx.cmd --yes eas-cli build --platform android --profile preview

Write-Host "`nWhen done: open the build URL / scan the QR on your Android phone, download the .apk, and tap to install." -ForegroundColor Green

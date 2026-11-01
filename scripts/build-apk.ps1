[CmdletBinding()]
param (
    [switch]$Release
)

$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path "$PSScriptRoot\.."
$AppDir = Join-Path $RootDir "apps\app"
$AndroidDir = Join-Path $AppDir "android"
$DistDir = Join-Path $RootDir "dist"

$BuildVariant = if ($Release) { "Release" } else { "Debug" }
$GradleTask = "assemble$BuildVariant"

Write-Host "Building formulaflash Android $BuildVariant APK..." -ForegroundColor Cyan

# Check Java
if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Error "Java is required on PATH (JDK 17+ recommended for Gradle 8)."
}

# Resolve pnpm
$PnpmCmd = if (Get-Command pnpm -ErrorAction SilentlyContinue) { "pnpm" } else { "npx pnpm" }

Write-Host "`n[1/4] Building web application..." -ForegroundColor Yellow
Push-Location $RootDir
try {
    Invoke-Expression "$PnpmCmd --filter app run build"
} finally {
    Pop-Location
}

Write-Host "`n[2/4] Syncing web assets with Capacitor Android..." -ForegroundColor Yellow
Push-Location $AppDir
try {
    npx cap sync android
} finally {
    Pop-Location
}

Write-Host "`n[3/4] Running Gradle $GradleTask..." -ForegroundColor Yellow
Push-Location $AndroidDir
try {
    .\gradlew.bat $GradleTask
} finally {
    Pop-Location
}

Write-Host "`n[4/4] Locating and copying output APK..." -ForegroundColor Yellow
$ApkSubpath = if ($Release) {
    "app\build\outputs\apk\release\app-release-unsigned.apk"
} else {
    "app\build\outputs\apk\debug\app-debug.apk"
}

$SourceApk = Join-Path $AndroidDir $ApkSubpath
if (-not (Test-Path $SourceApk)) {
    Write-Error "Expected APK not found at: $SourceApk"
}

if (-not (Test-Path $DistDir)) {
    New-Item -ItemType Directory -Path $DistDir -Force | Out-Null
}

$TargetApkName = if ($Release) { "formulaflash-release.apk" } else { "formulaflash-debug.apk" }
$TargetApk = Join-Path $DistDir $TargetApkName
Copy-Item -Path $SourceApk -Destination $TargetApk -Force

$SizeMb = [math]::Round((Get-Item $TargetApk).Length / 1MB, 2)
Write-Host "`nBuild successful!" -ForegroundColor Green
Write-Host "APK generated: $TargetApk ($SizeMb MB)" -ForegroundColor Green

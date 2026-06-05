param(
  [switch]$StartDev
)

$ErrorActionPreference = "Stop"

$PnpmCommand = Get-Command pnpm -ErrorAction SilentlyContinue
$Pnpm = if ($PnpmCommand) {
  $PnpmCommand.Source
} elseif (Test-Path -LiteralPath "C:\nvm4w\nodejs\pnpm.cmd") {
  "C:\nvm4w\nodejs\pnpm.cmd"
} else {
  $null
}

if (-not $Pnpm) {
  Write-Host "pnpm was not found in PATH."
  Write-Host "Enable it with: corepack enable; corepack prepare pnpm@9.15.9 --activate"
  throw "pnpm is required before running init.ps1"
}

function Invoke-Pnpm($Name, [string[]]$PnpmArgs) {
  Write-Host ""
  Write-Host "==> $Name"
  & $Pnpm @PnpmArgs
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE"
  }
}

Invoke-Pnpm "Install dependencies" @("install")
Invoke-Pnpm "Run base verification" @("run", "verify")
Invoke-Pnpm "Install Playwright Chromium" @("exec", "playwright", "install", "chromium")
Invoke-Pnpm "Run UI smoke verification" @("run", "test:ui")

Write-Host ""
Write-Host "Base harness is verified."
Write-Host "Start dev server with: pnpm dev"

if ($StartDev) {
  Invoke-Pnpm "Start dev servers" @("run", "dev")
}

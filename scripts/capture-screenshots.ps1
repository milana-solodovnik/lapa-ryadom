#!/usr/bin/env pwsh
# Capture presentation screenshots from the running dev stack.
#
# Prerequisites (start them detached first):
#   pwsh -NoProfile -File scripts/start-pg-detached.ps1
#   pwsh -NoProfile -File scripts/run-detached.ps1 -Script 'apps\api\src\main.ts' -Name api -WaitPort 4000
#   pwsh -NoProfile -File scripts/run-detached.ps1 -Script 'scripts\dev-web.mjs'      -Name web -WaitPort 5173
#
# Usage:
#   pwsh -NoProfile -File scripts/capture-screenshots.ps1
#
# Output: slides/screenshots/*.png at 1280x900, which slides/slide-04.js embeds.
# Re-run this whenever the UI changes, then rebuild the deck with
#   node slides/compile.js

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $projectRoot 'slides\screenshots'

if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$candidates = @(
  'C:\Program Files\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
)
$browser = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) {
  Write-Error 'No Chromium-based browser found (Chrome or Edge).'
  exit 1
}
Write-Host "[shots] browser: $browser"

# Fail fast if the stack is not up, otherwise every shot comes back blank.
foreach ($p in @(4000, 5173)) {
  $up = Test-NetConnection -ComputerName 127.0.0.1 -Port $p -InformationLevel Quiet -WarningAction SilentlyContinue
  if (-not $up) {
    Write-Error "[shots] port $p is not listening. Start the dev stack first."
    exit 1
  }
}

$shots = @(
  @{ Name = 'needs-catalog';  Path = '/needs' },
  @{ Name = 'need-detail';    Path = '/needs/10000001-0000-4000-a000-000000000001' },
  @{ Name = 'shelters';       Path = '/shelters' },
  @{ Name = 'shelter-detail'; Path = '/shelters/11111111-1111-4111-a111-111111111111' }
)

foreach ($s in $shots) {
  $file = Join-Path $outDir "$($s.Name).png"
  $url = "http://localhost:5173$($s.Path)"
  & $browser --headless=new --disable-gpu --hide-scrollbars `
    --window-size=1280,900 --virtual-time-budget=6000 `
    --screenshot="$file" $url 2>&1 | Out-Null
  if (Test-Path $file) {
    $kb = [math]::Round((Get-Item $file).Length / 1KB)
    Write-Host "[shots] $($s.Name).png  ${kb} KB  <- $url"
  } else {
    Write-Error "[shots] failed to capture $($s.Name)"
    exit 1
  }
}

Write-Host "[shots] done. Now run: node slides/compile.js"
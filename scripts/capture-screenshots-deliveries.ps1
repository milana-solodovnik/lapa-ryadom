#!/usr/bin/env pwsh
# Capture the D1 / D2 screenshots for the live demo.
#
# Adds to the deck canvas alongside the four slides-04 screenshots already
# produced by scripts/capture-screenshots.ps1:
#   - needs-catalog-d1.png         D1 state: 3 offers alive, all reserved
#   - shelter-receive-empty.png    D2 entry: empty form
#   - needs-catalog-d2.png         D2 state: 1 offer converted into a delivery
#
# All snapshots come from the running dev stack on 127.0.0.1:4000 (API) and
# localhost:5173 (web). The database is reset via scripts/reset-demo.mjs at
# the end so a follow-up run starts clean.

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $projectRoot 'slides\screenshots'

if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

foreach ($p in @(4000, 5173)) {
  # Vite on this box listens on 127.0.0.1 (API) and ::1 (web) — both must be probed.
  $up = (Test-NetConnection -ComputerName 127.0.0.1 -Port $p -InformationLevel Quiet -WarningAction SilentlyContinue) `
     -or (Test-NetConnection -ComputerName localhost -Port $p -InformationLevel Quiet -WarningAction SilentlyContinue)
  if (-not $up) {
    Write-Error "[shots-del] port $p is not listening. Start the dev stack first."
    exit 1
  }
}

$candidates = @(
  'C:\Program Files\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
)
$browser = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) {
  Write-Error 'No Chromium-based browser found.'
  exit 1
}
Write-Host "[shots-del] browser: $browser"

$env:DATABASE_URL = 'postgres://db:db@127.0.0.1:55432/db'

function Reset-Demo {
  Push-Location $projectRoot
  try {
    node scripts/reset-demo.mjs | Out-Null
  } finally {
    Pop-Location
  }
}

function Create-Offer([string]$needId, [int]$qty) {
  $key = [guid]::NewGuid().ToString()
  $body = @{ needId = $needId; quantity = $qty; idempotencyKey = $key } | ConvertTo-Json -Compress
  $res = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:4000/api/v1/offers' `
    -ContentType 'application/json' -Body $body -TimeoutSec 10
  return $res
}

function Deliver([string]$code, [int]$qty, [string]$repId) {
  $body = @{ code = $code; receivedQty = $qty; accountId = $repId } | ConvertTo-Json -Compress
  try {
    $res = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:4000/api/v1/deliveries' `
      -ContentType 'application/json' -Body $body -TimeoutSec 10
    return $res
  } catch {
    $msg = $_.Exception.Message
    Write-Warning "[shots-del] delivery failed: $msg"
    return $null
  }
}

function Capture([string]$name, [string]$url) {
  $file = Join-Path $outDir "$name.png"
  & $browser --headless=new --disable-gpu --hide-scrollbars `
    --window-size=1280,900 --virtual-time-budget=6000 `
    --screenshot="$file" $url 2>&1 | Out-Null
  if (Test-Path $file) {
    $kb = [math]::Round((Get-Item $file).Length / 1KB)
    Write-Host "[shots-del] $name.png  ${kb} KB  <- $url"
  } else {
    Write-Warning "[shots-del] failed to capture $name"
  }
}

Write-Host '[shots-del] resetting demo'
Reset-Demo

Write-Host '[shots-del] phase 1: make 3 offers (D1 state)'
$o1 = Create-Offer '10000001-0000-4000-a000-000000000001' 5
$o2 = Create-Offer '10000001-0000-4000-a000-000000000002' 12
$o3 = Create-Offer '10000002-0000-4000-a000-000000000001' 8
Write-Host "[shots-del] offer A code: $($o1.code)"
Write-Host "[shots-del] offer B code: $($o2.code)"
Write-Host "[shots-del] offer C code: $($o3.code)"

Capture 'needs-catalog-d1'     'http://localhost:5173/needs'
Capture 'shelter-receive-empty' 'http://localhost:5173/shelter/receive'

Write-Host '[shots-del] phase 2: convert offer A into a delivery (D2 state)'
$repA = 'aaaaaaaa-bbbb-4ccc-aaaa-aaaaaaaaaa01'
$deliver = Deliver $o1.code 5 $repA
if ($deliver) {
  Write-Host "[shots-del] delivery: needTitle=$($deliver.needTitle), remaining=$($deliver.remaining)"
}

Capture 'needs-catalog-d2' 'http://localhost:5173/needs'

Write-Host '[shots-del] done. Resetting demo so the database is back at D0.'
Reset-Demo
Write-Host '[shots-del] files in slides\screenshots:'
Get-ChildItem $outDir -Filter 'needs-catalog-d*.png' | Format-Table Name, Length
Get-ChildItem $outDir -Filter 'shelter-receive-*.png' | Format-Table Name, Length

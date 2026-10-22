#!/usr/bin/env pwsh
# Capture every presentation screenshot from the app running on the REAL
# Digital Q.DataBase, not from the reference PostgreSQL.
#
# There is no live demo on stage — the deck IS the demonstration. So these
# frames are the primary evidence and they have to be genuine: same app, same
# code, but served by the target database the migration was verified against.
#
# Prerequisites (the dev stack must already point at QDB via .env):
#   pwsh -NoProfile -File scripts/start-pg-detached.ps1   # reference PG, for tests
#   npm run dev                                            # API 4000 + web 5173
#   docker ps  # qdatabase-18 healthy
#
# Usage:
#   pwsh -NoProfile -File scripts/capture-qdb-screenshots.ps1
#
# Produces, at 1280x900:
#   needs-catalog.png        D0 on QDB: nothing promised, nothing received
#   needs-catalog-d1.png     D1 on QDB: three offers alive
#   login-page.png           the shelter-desk login form
#   needs-catalog-d2.png     D2 on QDB: first offer became a delivery
#
# The database is returned to D0 at the end so a rehearsal can start clean.
# Nothing here invents state: every number in the deck comes from these runs.

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $projectRoot 'slides\screenshots'
$qdbUrl = 'postgres://qdbadmin:qdbadmin@127.0.0.1:15432/postgres'

if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

# The API listens on IPv4, the Vite dev server binds localhost (IPv6 on this
# box). Probe both, exactly as the browser does.
foreach ($p in @(4000, 5173)) {
  $up = (Test-NetConnection -ComputerName 127.0.0.1 -Port $p -InformationLevel Quiet -WarningAction SilentlyContinue) `
     -or (Test-NetConnection -ComputerName localhost -Port $p -InformationLevel Quiet -WarningAction SilentlyContinue)
  if (-not $up) {
    Write-Error "[qdb-shots] port $p is not listening. Run: npm run dev"
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
  Write-Error '[qdb-shots] No Chromium-based browser found (Chrome or Edge).'
  exit 1
}
Write-Host "[qdb-shots] browser: $browser"

# Fail loudly if the stack is not actually serving QDB.
$api = Invoke-RestMethod -Uri 'http://127.0.0.1:4000/api/v1/health' -TimeoutSec 10
Write-Host "[qdb-shots] api: $($api.status) / $($api.service)"

$env:DATABASE_URL = $qdbUrl

function Reset-Demo {
  Push-Location $projectRoot
  try {
    node scripts/demo-reset.mjs | Out-Null
  } finally {
    Pop-Location
  }
}

function Create-Offer([string]$needId, [int]$qty) {
  $body = @{ needId = $needId; quantity = $qty; idempotencyKey = [guid]::NewGuid().ToString() } |
    ConvertTo-Json -Compress
  Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:4000/api/v1/offers' `
    -ContentType 'application/json' -Body $body -TimeoutSec 15
}

function Login-Rep {
  # DEV-09: a shelter rep authenticates with a session cookie. The password
  # comes from .env and is never echoed.
  $line = (Get-Content (Join-Path $projectRoot '.env') | Where-Object { $_ -match '^DEMO_REP_A_PASSWORD=' })
  $pw = ($line -replace '^DEMO_REP_A_PASSWORD=', '').Trim('"').Trim("'")
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:4000/api/v1/auth/login' `
    -ContentType 'application/json' -WebSession $session -TimeoutSec 15 `
    -Body (@{ username = 'rep_a'; password = $pw } | ConvertTo-Json -Compress) | Out-Null
  return $session
}

function Accept-Delivery($session, [string]$code, [int]$qty) {
  $body = @{ code = $code; receivedQty = $qty } | ConvertTo-Json -Compress
  Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:4000/api/v1/deliveries' `
    -ContentType 'application/json' -Body $body -WebSession $session -TimeoutSec 15
}

function Capture([string]$name, [string]$url) {
  $file = Join-Path $outDir "$name.png"
  & $browser --headless=new --disable-gpu --hide-scrollbars `
    --window-size=1280,900 --virtual-time-budget=6000 `
    --screenshot="$file" $url 2>&1 | Out-Null
  if (Test-Path $file) {
    $kb = [math]::Round((Get-Item $file).Length / 1KB)
    Write-Host "[qdb-shots] $name.png  ${kb} KB  <- $url"
  } else {
    Write-Error "[qdb-shots] failed to capture $name"
    exit 1
  }
}

Write-Host '[qdb-shots] resetting demo to D0'
Reset-Demo

Write-Host '[qdb-shots] D0 + login form'
Capture 'needs-catalog'    'http://localhost:5173/needs'
Capture 'login-page'       'http://localhost:5173/login'
Capture 'need-detail'      'http://localhost:5173/needs/10000001-0000-4000-a000-000000000001'

Write-Host '[qdb-shots] phase 1 — three offers (D1)'
$o1 = Create-Offer '10000001-0000-4000-a000-000000000001' 5
$o2 = Create-Offer '10000001-0000-4000-a000-000000000002' 12
$o3 = Create-Offer '10000002-0000-4000-a000-000000000001' 8
Write-Host "[qdb-shots] codes: $($o1.code) $($o2.code) $($o3.code)"
Capture 'needs-catalog-d1' 'http://localhost:5173/needs'

Write-Host '[qdb-shots] phase 2 — accept 3 of the 5 promised (D2)'
$session = Login-Rep
# Partial receipt on purpose: it is the case the pitch actually argues about —
# "five promised" must not read as "five received". The two uncollected packs
# go straight back into the free remainder, so D2 is 50 / 0 / 3 / 47.
$delivered = Accept-Delivery $session $o1.code 3
Write-Host "[qdb-shots] accepted: need=$($delivered.needTitle) offered=$($delivered.offerQty) received=$($delivered.receivedQty) remaining=$($delivered.remaining)"
Capture 'needs-catalog-d2' 'http://localhost:5173/needs'

Write-Host '[qdb-shots] returning the database to D0'
Reset-Demo

Write-Host '[qdb-shots] done. Now run: node slides/compile.js'
Get-ChildItem $outDir -Filter '*.png' | Sort-Object Name | Format-Table Name, Length
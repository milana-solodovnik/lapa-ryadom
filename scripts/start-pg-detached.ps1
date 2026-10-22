#!/usr/bin/env pwsh
# Launch the embedded PostgreSQL detached from the calling shell.
#
# Why this exists: running `node scripts/start-pg.mjs` directly makes the
# server a child of the current console or job object. When that parent is
# terminated (tool timeout, closed terminal, Ctrl+C cascade) the server dies
# with it. Win32_Process.Create starts the process outside our job object, so
# the database survives.
#
# Usage:
#   pwsh -File scripts/start-pg-detached.ps1
#
# Environment (optional): PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE PG_RUNTIME_DIR

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $projectRoot '.pg-runtime'
$logFile = Join-Path $logDir 'start-pg.log'
$errFile = Join-Path $logDir 'start-pg.err.log'

if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Force -Path $logDir | Out-Null
}

$pidFile = Join-Path $logDir 'start-pg.pid'
if (Test-Path $pidFile) {
  $existing = (Get-Content $pidFile -Raw -ErrorAction SilentlyContinue)
  if ($null -eq $existing) { $existing = '' }
  $existing = $existing.Trim()
  if ($existing -match '^\d+$' -and [int]$existing -gt 0) {
    $alive = Get-Process -Id ([int]$existing) -ErrorAction SilentlyContinue
    if ($alive) {
      Write-Host "[db:up] already running (pid=$existing)"
      exit 0
    }
  }
}

$env:PG_RUNTIME_DIR   = $logDir
$env:PGHOST           = if ($env:PGHOST)           { $env:PGHOST }           else { '127.0.0.1' }
# 55850 instead of 55432: with Docker Desktop running, Windows reserves
# 55220-55719 for Hyper-V/WSL2 (see: netsh interface ipv4 show excludedportrange),
# and a socket bind there fails with WSAEACCES.
$env:PGPORT           = if ($env:PGPORT)           { $env:PGPORT }           else { '55850' }
$env:PGUSER           = if ($env:PGUSER)           { $env:PGUSER }           else { 'db' }
$env:PGPASSWORD       = if ($env:PGPASSWORD)       { $env:PGPASSWORD }       else { 'db' }
$env:PGDATABASE       = if ($env:PGDATABASE)       { $env:PGDATABASE }       else { 'db' }

$nodeExe = (Get-Command node -ErrorAction Stop).Source
$script  = Join-Path $projectRoot 'scripts\start-pg.mjs'

# Win32_Process.Create runs the process outside this job object.
$cmdLine = '"{0}" "{1}"' -f $nodeExe, $script
$result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
  CommandLine = $cmdLine
  CurrentDirectory = $projectRoot
}

if ($result.ReturnValue -ne 0) {
  Write-Error "[db:up] failed to launch detached process (ReturnValue=$($result.ReturnValue))"
  exit 1
}

Write-Host "[db:up] launched detached, pid=$($result.ProcessId)"
Write-Host "[db:up] log: $logFile"
Write-Host "[db:up] waiting for readiness..."

$ready = $false
for ($i = 0; $i -lt 90; $i++) {
  Start-Sleep -Seconds 1
  try {
    $conn = Test-NetConnection -ComputerName $env:PGHOST -Port ([int]$env:PGPORT) -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($conn) {
      $ready = $true
      Write-Host "[db:up] ready at $($env:PGHOST):$($env:PGPORT) after ${i}s"
      break
    }
  } catch {
    # keep polling
  }
}

if (-not $ready) {
  Write-Error "[db:up] server did not become ready within 90s"
  if (Test-Path $logFile) { Get-Content $logFile -Tail 40 }
  exit 1
}
#!/usr/bin/env pwsh
# Launch any Node script detached from the calling shell or job object.
#
# Why: a process started normally is a child of the current console or job.
# When the parent is terminated (tool timeout, closed terminal), the child dies
# with it. Win32_Process.Create starts outside our job object, so long-running
# dev servers survive.
#
# Usage:
#   pwsh -NoProfile -File scripts/run-detached.ps1 -Script <path-to-mjs-or-ts> -Name <label> -WaitPort <port>
#
# Example:
#   pwsh -NoProfile -File scripts/run-detached.ps1 `
#     -Script apps\api\src\main.ts -Name api -WaitPort 4000

param(
  [Parameter(Mandatory = $true)][string]$Script,
  [Parameter(Mandatory = $true)][string]$Name,
  [int]$WaitPort = 0,
  [int]$WaitSeconds = 60
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $projectRoot '.pg-runtime'
if (-not (Test-Path $runtimeDir)) {
  New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
}

$pidFile = Join-Path $runtimeDir "$Name.pid"
$logFile = Join-Path $runtimeDir "$Name.log"
$errFile = Join-Path $runtimeDir "$Name.err.log"

if (Test-Path $pidFile) {
  $existing = (Get-Content $pidFile -Raw).Trim()
  if ($existing -match '^\d+$') {
    $alive = Get-Process -Id ([int]$existing) -ErrorAction SilentlyContinue
    if ($alive) {
      Write-Host "[$Name] already running (pid=$existing)"
      exit 0
    }
  }
}

# .ts entry points need tsx; .mjs runs on plain node.
$needsTsx = $Script.EndsWith('.ts')
$nodeExe = (Get-Command node -ErrorAction Stop).Source

if ($needsTsx) {
  $cmdLine = '"{0}" "{1}\node_modules\tsx\dist\cli.mjs" "{2}"' -f $nodeExe, $projectRoot, $Script
} else {
  $cmdLine = '"{0}" "{1}"' -f $nodeExe, $Script
}

$result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
  CommandLine     = $cmdLine
  CurrentDirectory = $projectRoot
}

if ($result.ReturnValue -ne 0) {
  Write-Error "[$Name] failed to launch (ReturnValue=$($result.ReturnValue))"
  exit 1
}

Write-Host "[$Name] launched detached, pid=$($result.ProcessId)"
Write-Host "[$Name] stdout log: $logFile"

if ($WaitPort -gt 0) {
  Write-Host "[$Name] waiting for port $WaitPort ..."
  $ready = $false
  for ($i = 0; $i -lt $WaitSeconds; $i++) {
    Start-Sleep -Seconds 1
    $conn = Test-NetConnection -ComputerName 127.0.0.1 -Port $WaitPort -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($conn) {
      $ready = $true
      Write-Host "[$Name] listening on $WaitPort after ${i}s"
      break
    }
  }
  if (-not $ready) {
    Write-Error "[$Name] did not start listening on $WaitPort within ${WaitSeconds}s"
    if (Test-Path $logFile) { Get-Content $logFile -Tail 30 }
    exit 1
  }
}
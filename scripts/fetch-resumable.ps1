#!/usr/bin/env pwsh
# Resumable, retrying downloader built on curl.
#
# Why: the browser restarted the Digital Q.DataBase Docker image from zero every
# time the transfer broke, leaving a few MB in a discarded temp file. curl with
# `-C -` continues from the byte it already has, so an interruption costs
# nothing instead of starting over.
#
# A sing-box proxy is active on 127.0.0.1:12334 and measured 265 KB/s to the
# vendor host versus 965 KB/s directly, so this script bypasses the proxy by
# default. Pass -UseProxy to keep it.
#
# Usage:
#   pwsh -NoProfile -File scripts/fetch-resumable.ps1 -Url <direct-url> -Out <path>
#
# Example:
#   pwsh -NoProfile -File scripts/fetch-resumable.ps1 `
#     -Url 'https://.../docker-digital-q-database64xid-18-....tar.gz' `
#     -Out 'F:\MVP\hakaton\infra\qdb-dist\docker-qdb.tar.gz'

param(
  [Parameter(Mandatory = $true)][string]$Url,
  [Parameter(Mandatory = $true)][string]$Out,
  [int]$MaxAttempts = 40,
  [int]$SleepSeconds = 4,
  [switch]$UseProxy
)

$ErrorActionPreference = 'Stop'

$targetDir = Split-Path -Parent $Out
if ($targetDir -and -not (Test-Path $targetDir)) {
  New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
}

$curl = (Get-Command curl.exe -ErrorAction Stop).Source

function Get-FileSize([string]$p) {
  if (Test-Path $p) { return (Get-Item $p).Length }
  return 0
}

function Format-Size([double]$n) {
  if ($n -le 0) { return '0 B' }
  $u = @('B', 'KB', 'MB', 'GB')
  $i = 0
  while ($n -ge 1024 -and $i -lt 3) { $n /= 1024; $i++ }
  return ('{0:N1} {1}' -f $n, $u[$i])
}

$proxyArgs = @()
if (-not $UseProxy) {
  $proxyArgs = @('--noproxy', '*')
}

Write-Host "[fetch] url  : $Url"
Write-Host "[fetch] out  : $Out"
Write-Host "[fetch] proxy: $(if ($UseProxy) { 'USED' } else { 'BYPASSED (--noproxy *)' })"
Write-Host ''

for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
  $have = Get-FileSize $Out
  Write-Host "[fetch] attempt $attempt/$MaxAttempts, have $(Format-Size $have)"

  # -C - resumes from the current file size; --retry handles transient drops
  # inside a single curl run.
  & $curl @proxyArgs -L -C - --retry 5 --retry-delay 3 --retry-all-errors `
    --connect-timeout 20 --speed-time 60 --speed-limit 10240 `
    -o $Out -s -S -w "[fetch] http=%{http_code} got=%{size_download} avg=%{speed_download}B/s total=%{time_total}s`n" `
    $Url 2>&1 | ForEach-Object { Write-Host $_ }

  if ($LASTEXITCODE -eq 0) {
    $final = Get-FileSize $Out
    Write-Host ''
    Write-Host "[fetch] DONE: $Out ($(Format-Size $final))"
    exit 0
  }

  $now = Get-FileSize $Out
  if ($now -gt $have) {
    Write-Host "[fetch] progressed to $(Format-Size $now), resuming shortly."
  } else {
    Write-Host "[fetch] no progress this attempt."
  }
  Start-Sleep -Seconds ([Math]::Min($SleepSeconds * $attempt, 30))
}

$partial = Get-FileSize $Out
Write-Error "[fetch] gave up after $MaxAttempts attempts. Got $(Format-Size $partial) of the file; rerun the same command to resume."
exit 1
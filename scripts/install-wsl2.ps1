#!/usr/bin/env pwsh
# Install WSL2 features and kernel on Windows 11.
# Must be run elevated. Logs to $LogPath via direct file append.
# Re-runnable: each step only runs if not already done.

param([Parameter(Mandatory=$true)][string]$LogPath)

function Log([string]$msg) {
  $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
  Write-Host $line
  Add-Content -Path $LogPath -Value $line -Encoding UTF8
}

# DISM success codes:
#   0       - operation completed successfully
#   3010    - operation completed successfully, reboot required
#   1641    - operation completed successfully, reboot initiated
$good = @(0, 3010, 1641)
function Is-Dism-Ok([int]$c) { $c -in $good }

if (-not (Test-Path $LogPath)) { New-Item -ItemType File -Force -Path $LogPath | Out-Null }

Log "== install-wsl2.ps1 (idempotent, pid=$PID) =="

# admin check
$pr = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $pr.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
Log "user=$env:USERNAME  isAdmin=$isAdmin"
if (-not $isAdmin) { Log "FATAL: not elevated"; exit 2 }

# feature state via Get-WindowsOptionalFeature (no admin needed for query, but
# we are elevated anyway)
function Get-FeatureState([string]$name) {
  $f = Get-WindowsOptionalFeature -Online -FeatureName $name -ErrorAction SilentlyContinue
  if ($null -eq $f) { return 'unknown' }
  return "$($f.State)"
}

# 1) Subsystem-Linux
$ws = Get-FeatureState 'Microsoft-Windows-Subsystem-Linux'
Log "feature WSL state = $ws"
if ($ws -ne 'Enabled') {
  Log "-- dism enable Subsystem-Linux"
  $out = & dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart 2>&1
  $out | ForEach-Object { Log "  dism: $_" }
  Log "  dism exit: $LASTEXITCODE"
  if (-not (Is-Dism-Ok $LASTEXITCODE)) { Log "FATAL"; exit 3 }
} else {
  Log "  already Enabled — skip"
}

# 2) VirtualMachinePlatform
$vm = Get-FeatureState 'VirtualMachinePlatform'
Log "feature VMP state = $vm"
if ($vm -ne 'Enabled') {
  Log "-- dism enable VirtualMachinePlatform"
  $out = & dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart 2>&1
  $out | ForEach-Object { Log "  dism: $_" }
  Log "  dism exit: $LASTEXITCODE"
  if (-not (Is-Dism-Ok $LASTEXITCODE)) { Log "FATAL"; exit 4 }
} else {
  Log "  already Enabled — skip"
}

# 3) wsl --install --no-distribution — installs kernel; idempotent
Log "-- wsl --install --no-distribution"
$out = & wsl.exe --install --no-distribution 2>&1
$out | ForEach-Object { Log "  wsl: $_" }
Log "  wsl exit: $LASTEXITCODE"

# 4) set default version to 2
Log "-- wsl --set-default-version 2"
$out = & wsl.exe --set-default-version 2 2>&1
$out | ForEach-Object { Log "  wsl: $_" }
Log "  wsl exit: $LASTEXITCODE"

# 5) summary
Log "-- wsl --status"
$out = & wsl.exe --status 2>&1
$out | ForEach-Object { Log "  wsl: $_" }

Log "== DONE =="

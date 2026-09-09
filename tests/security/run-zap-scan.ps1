<#
.SYNOPSIS
  Executes an OWASP ZAP Baseline Security Scan via Docker on Windows.

.DESCRIPTION
  Runs the official OWASP ZAP Docker container against the specified target URL.
  Applies rules from zap-baseline.conf and generates HTML, JSON, and Markdown reports.

.PARAMETER TargetUrl
  The target endpoint URL to scan (e.g., http://localhost:5000 or staging URL).

.PARAMETER ReportDir
  Directory to store the generated security reports. Defaults to tests/security/reports.

.PARAMETER ConfigFile
  Path to the ZAP baseline configuration file. Defaults to tests/security/zap-baseline.conf.

.PARAMETER BearerToken
  Optional Authorization Bearer token for scanning authenticated routes.

.PARAMETER DockerImage
  ZAP Docker image to use. Defaults to ghcr.io/zaproxy/zaproxy:stable.

.PARAMETER FailOnWarn
  If set, exits with code 1 if any warnings are detected.
#>

param(
  [string]$TargetUrl = "http://localhost:5000",
  [string]$ReportDir = "$PSScriptRoot\reports",
  [string]$ConfigFile = "$PSScriptRoot\zap-baseline.conf",
  [string]$BearerToken = "",
  [string]$DockerImage = "ghcr.io/zaproxy/zaproxy:stable",
  [switch]$FailOnWarn
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   OWASP ZAP Baseline Security Scanner (Satvik Swaad)    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check Docker Availability
if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
  Write-Error "Docker executable not found in PATH. Please install Docker Desktop or run in CI with Docker support."
  exit 1
}

try {
  docker info > $null 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker daemon is not running. Please start Docker Desktop before running security scans."
    exit 1
  }
} catch {
  Write-Error "Unable to communicate with Docker daemon."
  exit 1
}

# 2. Resolve and validate directories
if (-not (Test-Path $ConfigFile)) {
  Write-Error "ZAP config file not found at: $ConfigFile"
  exit 1
}

if (-not (Test-Path $ReportDir)) {
  New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
  Write-Host "[+] Created report output directory: $ReportDir" -ForegroundColor Green
}

$AbsReportDir = (Resolve-Path $ReportDir).Path
$AbsConfigDir = (Split-Path -Parent (Resolve-Path $ConfigFile).Path)
$ConfigFileName = (Split-Path -Leaf $ConfigFile)

Write-Host "Target URL:       $TargetUrl" -ForegroundColor Yellow
Write-Host "Docker Image:     $DockerImage" -ForegroundColor Yellow
Write-Host "Config File:      $ConfigFile" -ForegroundColor Yellow
Write-Host "Report Directory: $AbsReportDir" -ForegroundColor Yellow
Write-Host "----------------------------------------------------------"

# 3. Handle Host Networking for localhost targets
$TargetHostUrl = $TargetUrl
if ($TargetUrl -match "localhost|127\.0\.0\.1") {
  # In Docker on Windows/Mac, host.docker.internal resolves to the host machine
  $TargetHostUrl = $TargetUrl -replace "localhost", "host.docker.internal" -replace "127\.0\.0\.1", "host.docker.internal"
  Write-Host "[i] Rewrote localhost target to container host: $TargetHostUrl" -ForegroundColor DarkCyan
}

# 4. Prepare extra options (e.g. Authorization header)
$ExtraZapArgs = @()
if ($BearerToken) {
  $AuthHeaderConfig = "replacer.full_list(0).description=auth&replacer.full_list(0).enabled=true&replacer.full_list(0).matchtype=REQ_HEADER&replacer.full_list(0).matchstr=Authorization&replacer.full_list(0).regex=false&replacer.full_list(0).replacement=Bearer $BearerToken"
  $ExtraZapArgs += @("-z", "-config", $AuthHeaderConfig)
  Write-Host "[i] Injected Bearer authorization token into request scanner." -ForegroundColor DarkCyan
}

# 5. Execute Dockerized ZAP scan
Write-Host "[+] Launching OWASP ZAP baseline scan container..." -ForegroundColor Cyan

$DockerArgs = @(
  "run", "--rm",
  "-v", "${AbsConfigDir}:/zap/conf:ro",
  "-v", "${AbsReportDir}:/zap/wrk:rw",
  $DockerImage,
  "zap-baseline.py",
  "-t", $TargetHostUrl,
  "-c", "/zap/conf/$ConfigFileName",
  "-r", "zap-report.html",
  "-J", "zap-report.json",
  "-w", "zap-report.md"
) + $ExtraZapArgs

& docker @DockerArgs
$ScanExitCode = $LASTEXITCODE

Write-Host "----------------------------------------------------------"
Write-Host "[+] Scan completed with exit code: $ScanExitCode" -ForegroundColor Cyan

# Interpret ZAP Baseline exit codes:
# 0 = All tests passed
# 1 = At least one FAIL rule triggered
# 2 = At least one WARN rule triggered
# 3 = Other failure / could not run

switch ($ScanExitCode) {
  0 {
    Write-Host "SUCCESS: Zero security rule violations detected." -ForegroundColor Green
    exit 0
  }
  1 {
    Write-Host "CRITICAL FAILURE: OWASP ZAP baseline scan detected security policy violations." -ForegroundColor Red
    Write-Host "Review detailed report: $AbsReportDir\zap-report.html" -ForegroundColor Red
    exit 1
  }
  2 {
    if ($FailOnWarn) {
      Write-Host "WARNING FAILURE: Warnings detected and FailOnWarn is active." -ForegroundColor Red
      exit 1
    } else {
      Write-Host "PASSED WITH WARNINGS: Review warning entries in $AbsReportDir\zap-report.html" -ForegroundColor Yellow
      exit 0
    }
  }
  default {
    Write-Host "ERROR: Scan execution failed or target was unreachable." -ForegroundColor Red
    exit $ScanExitCode
  }
}

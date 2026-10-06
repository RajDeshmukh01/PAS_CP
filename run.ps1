# STATX quick launcher — starts immediately in demo mode if ML stack isn't installed
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ApiDir = Join-Path $Root "store-sales-forecasting"

Set-Location $ApiDir

$Mode = $args[0]
if (-not $Mode) { $Mode = "lite" }

Write-Host "STATX launcher mode: $Mode"
Write-Host "Working directory: $ApiDir"

if ($Mode -eq "lite") {
    Write-Host "Installing lightweight API deps (FastAPI only)..."
    python -m pip install -r requirements-lite.txt
    $env:STATX_DEMO = "1"
    Write-Host ""
    Write-Host "Starting STATX (demo forecasts) at http://127.0.0.1:8000/"
    Write-Host "  UI          -> http://127.0.0.1:8000/"
    Write-Host "  Forecasting -> http://127.0.0.1:8000/forecasting.html"
    Write-Host "  Simulator   -> http://127.0.0.1:8000/simulator.html"
    Write-Host "  API health  -> http://127.0.0.1:8000/api/health"
    Write-Host ""
    python -m uvicorn app:app --host 127.0.0.1 --port 8000
    exit $LASTEXITCODE
}

# Full ML mode (needs Python 3.10/3.11 ideally)
$VenvPython = Join-Path $ApiDir ".venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    Write-Host "Creating virtual environment..."
    python -m venv .venv
}
Write-Host "Installing ML dependencies (may take a long time)..."
& $VenvPython -m pip install --upgrade pip
$Req = if (Test-Path "requirements-serve.txt") { "requirements-serve.txt" } else { "requirements.txt" }
& $VenvPython -m pip install -r $Req
Remove-Item Env:STATX_DEMO -ErrorAction SilentlyContinue
Write-Host "Starting STATX (ML mode) at http://127.0.0.1:8000/"
& $VenvPython -m uvicorn app:app --reload --host 127.0.0.1 --port 8000

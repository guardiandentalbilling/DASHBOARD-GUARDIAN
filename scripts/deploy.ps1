Param(
  [string]$AppName = "guardian-dashboard"
)

$ErrorActionPreference = "Stop"

function Log($msg){ Write-Host "[DEPLOY] $msg" }

$RootDir = (Resolve-Path "$PSScriptRoot/..\").Path
$ApiDir  = Join-Path $RootDir "GuardianDashBaordAI"

Log "Starting deploy for $AppName"
Set-Location $RootDir

Log "Fetching latest code"
git fetch --all --prune
& git reset --hard origin/main | Out-Null

Log "Installing production dependencies"
Set-Location $ApiDir
npm install --production --no-audit --no-fund

if (-Not (Test-Path .env)) { Log "WARNING: .env missing. Create from .env.example" }

Log "Syntax check server.js"
node -c server.js

if (Get-Command pm2 -ErrorAction SilentlyContinue) {
  $exists = pm2 list | Select-String $AppName -Quiet
  if ($exists) {
    Log "Reloading PM2 process"
    pm2 reload $AppName --update-env
  } else {
    Log "Starting PM2 process from ecosystem.config.js"
    pm2 start (Join-Path $RootDir 'ecosystem.config.js') --only $AppName --env production
  }
  pm2 save | Out-Null
} else {
  Log "ERROR: pm2 not installed (npm i -g pm2)"; exit 1
}

Start-Sleep -Seconds 4
$port = $env:PORT; if (-not $port) { $port = 5000 }
$healthUrls = @("http://127.0.0.1:$port/health", "http://127.0.0.1:$port/api/health")

$failed = $false
foreach ($u in $healthUrls) {
  try {
    $code = (Invoke-WebRequest -Uri $u -Method GET -UseBasicParsing -TimeoutSec 5).StatusCode.value__
    if ($code -ne 200) { Log "FAILED $u ($code)"; $failed = $true } else { Log "OK $u" }
  } catch { Log "FAILED $u ($_ )"; $failed = $true }
}

if ($failed) { Log "Deployment completed with health errors. Check: pm2 logs $AppName"; exit 2 }

Log "Deployment complete."

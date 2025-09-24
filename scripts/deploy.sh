#!/usr/bin/env bash
# Guardian Dashboard zero/minimal-downtime deploy script
# Usage: ./scripts/deploy.sh [pm2-app-name]
# Default app name: guardian-dashboard
set -euo pipefail
APP_NAME=${1:-guardian-dashboard}
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
API_DIR="$ROOT_DIR/GuardianDashBaordAI"
LOG_PREFIX="[DEPLOY]"

log(){ echo -e "${LOG_PREFIX} $1"; }

log "Starting deploy for $APP_NAME"
cd "$ROOT_DIR"

log "Pulling latest code..."
 git fetch --all --prune
 git reset --hard origin/main

log "Installing dependencies (backend only)..."
 cd "$API_DIR"
 npm install --production --no-audit --no-fund

if [ -f ".env" ]; then
  log ".env present"
else
  log "WARNING: .env not found. Copy .env.example and fill values before deploying."
fi

log "Running lightweight health build check (syntax)..."
 node -c server.js || { echo "Syntax error in server.js"; exit 1; }

if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    log "Reloading existing PM2 process..."
    pm2 reload "$APP_NAME"
  else
    log "Starting new PM2 process..."
    pm2 start "$ROOT_DIR/ecosystem.config.js" --only "$APP_NAME" --env production
  fi
  pm2 save
else
  log "ERROR: pm2 not installed; install with: npm i -g pm2"
  exit 1
fi

log "Waiting 4s before health check..."
 sleep 4

HEALTH_URL="http://127.0.0.1:${PORT:-5000}/health"
API_HEALTH_URL="http://127.0.0.1:${PORT:-5000}/api/health"

fail=0
for url in "$HEALTH_URL" "$API_HEALTH_URL"; do
  if command -v curl >/dev/null 2>&1; then
    log "Checking $url"
    code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo 000)
    if [ "$code" != "200" ]; then
      log "Health check FAILED ($code) for $url"
      fail=1
    else
      log "Health OK ($url)"
    fi
  fi
done

if [ $fail -ne 0 ]; then
  log "Deployment finished with health check errors. See pm2 logs."
  exit 2
fi

log "Deployment complete."

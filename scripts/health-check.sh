#!/usr/bin/env bash
# Simple health check script for cron / external monitoring wrapper
PORT=${PORT:-5000}
BASE="http://127.0.0.1:$PORT"
FAIL=0
for path in /health /api/health; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$path" || echo 000)
  if [ "$code" != "200" ]; then
    echo "[HEALTH] FAIL $path -> $code"
    FAIL=1
  else
    echo "[HEALTH] OK   $path"
  fi
done
exit $FAIL

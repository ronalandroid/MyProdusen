#!/bin/zsh
set -euo pipefail

PROJECT_DIR="/Users/macbook/MyProdusen"
PORT="${PORT:-3000}"
HOST="0.0.0.0"
LOG_FILE="/private/tmp/myprodusen-dev-preview.log"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
APP_URL="http://127.0.0.1:${PORT}"
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"

cd "$PROJECT_DIR"

echo "========================================"
echo "MyProdusen realtime device preview"
echo "========================================"
echo "Local: ${APP_URL}"
if [ -n "$LAN_IP" ]; then
  echo "HP satu WiFi: http://${LAN_IP}:${PORT}"
fi
echo "Log: ${LOG_FILE}"
echo ""

if lsof -nP -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Dev server already running on port ${PORT}."
else
  echo "Starting dev server on ${HOST}:${PORT} ..."
  nohup npm run dev -- -H "$HOST" -p "$PORT" > "$LOG_FILE" 2>&1 &
fi

echo "Waiting for server ..."
for i in {1..60}; do
  if curl -fsS "$APP_URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
  if [ "$i" -eq 60 ]; then
    echo "Server not ready. Open log: ${LOG_FILE}"
    tail -80 "$LOG_FILE" || true
    exit 1
  fi
done

open_preview() {
  local name="$1"
  local size="$2"
  local pos="$3"
  local path="$4"
  local url="${APP_URL}${path}?preview=${name}&t=$(date +%s)"

  if [ -x "$CHROME" ]; then
    "$CHROME" --new-window --window-size="$size" --window-position="$pos" "$url" >/dev/null 2>&1 &
  else
    open "$url"
  fi
}

echo "Opening preview windows ..."
open_preview "mobile-320" "320,900" "0,40" "/"
open_preview "mobile-390-login" "390,900" "340,40" "/login"
open_preview "mobile-430-dashboard" "430,932" "750,40" "/dashboard"
open_preview "tablet-768" "768,1024" "120,80" "/"
open_preview "desktop-1440" "1440,900" "80,80" "/"

echo ""
echo "Opened device previews:"
echo "- Mobile 320: /"
echo "- Mobile 390: /login"
echo "- Mobile 430: /dashboard (redirect login if not authenticated)"
echo "- Tablet 768: /"
echo "- Desktop 1440: /"
echo ""
echo "Edit files, browser auto-refreshes via Next dev server."
echo "Press Enter to close this terminal window. Dev server keeps running."
read -r _

#!/bin/zsh
set -euo pipefail

PROJECT_DIR="/Users/macbook/MyProdusen"
PORT="${PORT:-3000}"
HOST="0.0.0.0"
LOG_FILE="/private/tmp/myprodusen-dev-preview.log"
PREVIEW_FILE="/private/tmp/myprodusen-device-preview.html"
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
echo "Preview board: ${PREVIEW_FILE}"
echo ""

if lsof -nP -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Dev server already running on port ${PORT}."
else
  echo "Starting dev server on ${HOST}:${PORT} ..."
  nohup npm run dev -- -H "$HOST" -p "$PORT" > "$LOG_FILE" 2>&1 &
fi

echo "Waiting for server ..."
for i in {1..90}; do
  if curl -fsS "$APP_URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
  if [ "$i" -eq 90 ]; then
    echo "Server not ready. Open log: ${LOG_FILE}"
    tail -100 "$LOG_FILE" || true
    exit 1
  fi
done

CACHE_BUST="$(date +%s)"
cat > "$PREVIEW_FILE" <<HTML
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MyProdusen Device Preview</title>
  <style>
    :root { color-scheme: light; --yellow:#FDC704; --black:#111111; --muted:#687083; --line:#E5E3E6; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f6f4ee; color: var(--black); }
    header { position: sticky; top: 0; z-index: 10; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px; background: rgba(255,255,255,.92); border-bottom: 1px solid var(--line); backdrop-filter: blur(16px); }
    h1 { margin: 0; font-size: 18px; line-height: 1.1; }
    p { margin: 4px 0 0; color: var(--muted); font-size: 12px; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    button, a { min-height: 38px; border-radius: 12px; border: 1px solid var(--line); padding: 0 12px; background: white; color: var(--black); font-weight: 800; text-decoration: none; cursor: pointer; }
    button.primary, a.primary { background: var(--yellow); border-color: #edb900; }
    main { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 18px; padding: 18px; align-items: start; }
    .device-card { min-width: 0; border-radius: 22px; background: white; border: 1px solid var(--line); box-shadow: 0 16px 44px rgba(17,24,39,.08); overflow: hidden; }
    .device-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; border-bottom: 1px solid var(--line); }
    .device-head strong { display: block; font-size: 13px; }
    .device-head span { color: var(--muted); font-size: 11px; font-weight: 700; }
    .stage { overflow: auto; padding: 14px; background: linear-gradient(135deg,#fffdf7,#f5f3ed); }
    .frame-wrap { transform-origin: top left; }
    iframe { display: block; border: 1px solid #d8d6da; border-radius: 24px; background: white; box-shadow: 0 18px 42px rgba(17,24,39,.18); }
    .desktop iframe { border-radius: 16px; }
    .note { padding: 0 18px 18px; color: var(--muted); font-size: 12px; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>MyProdusen Device Preview</h1>
      <p>Realtime via Next dev server. Refresh board kalau iframe masih compiling.</p>
      <p>Local: ${APP_URL}$( [ -n "$LAN_IP" ] && printf ' · HP: http://%s:%s' "$LAN_IP" "$PORT" )</p>
    </div>
    <div class="actions">
      <button class="primary" onclick="reloadFrames()">Reload semua frame</button>
      <a href="${APP_URL}" target="_blank">Open app</a>
      <a href="${APP_URL}/login" target="_blank">Open login</a>
    </div>
  </header>
  <main id="devices"></main>
  <script>
    const base = '${APP_URL}';
    const cache = '${CACHE_BUST}';
    const devices = [
      { name: 'Mobile 320', size: '320 × 900', w: 320, h: 900, path: '/' },
      { name: 'iPhone 390', size: '390 × 844', w: 390, h: 844, path: '/login' },
      { name: 'Large Mobile 430', size: '430 × 932', w: 430, h: 932, path: '/register' },
      { name: 'Tablet 768', size: '768 × 1024', w: 768, h: 1024, path: '/' },
      { name: 'Desktop 1440', size: '1440 × 900', w: 1440, h: 900, path: '/', desktop: true },
    ];

    function frameSrc(device) {
      return base + device.path + '?devicePreview=' + encodeURIComponent(device.name) + '&t=' + Date.now();
    }

    function scaleFor(width) {
      const available = Math.max(280, Math.min(window.innerWidth - 72, 720));
      return Math.min(1, available / width);
    }

    function render() {
      const root = document.getElementById('devices');
      root.innerHTML = '';
      for (const device of devices) {
        const scale = scaleFor(device.w);
        const card = document.createElement('article');
        card.className = 'device-card' + (device.desktop ? ' desktop' : '');
        card.innerHTML = `
          <div class="device-head">
            <div><strong>${device.name}</strong><span>${device.size} · ${device.path}</span></div>
            <a href="${base}${device.path}" target="_blank">Open</a>
          </div>
          <div class="stage" style="height:${Math.round(device.h * scale + 28)}px">
            <div class="frame-wrap" style="width:${device.w}px;height:${device.h}px;transform:scale(${scale})">
              <iframe title="${device.name}" src="${frameSrc(device)}" width="${device.w}" height="${device.h}"></iframe>
            </div>
          </div>
          <div class="note">Kalau blank sebentar, Next sedang compile route. Klik Reload semua frame.</div>
        `;
        root.appendChild(card);
      }
    }

    function reloadFrames() {
      document.querySelectorAll('iframe').forEach((frame) => {
        const url = new URL(frame.src);
        url.searchParams.set('t', Date.now().toString());
        frame.src = url.toString();
      });
    }

    window.addEventListener('resize', render);
    render();
  </script>
</body>
</html>
HTML

echo "Opening one stable preview board ..."
if [ -x "$CHROME" ]; then
  "$CHROME" --new-window --window-size="1500,980" "file://${PREVIEW_FILE}" >/dev/null 2>&1 &
else
  open "file://${PREVIEW_FILE}"
fi

echo ""
echo "Preview board opened."
echo "This is more stable than many separate Chrome windows."
echo "If a frame is empty, wait for Next compile then click Reload semua frame."
echo "Press Enter to close this terminal window. Dev server keeps running."
read -r _

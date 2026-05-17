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
echo "MyProdusen realtime lightweight preview"
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

cat > "$PREVIEW_FILE" <<HTML
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MyProdusen Lightweight Preview</title>
  <style>
    :root { color-scheme: light; --yellow:#FDC704; --black:#111111; --muted:#687083; --line:#E5E3E6; --bg:#f6f4ee; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--black); }
    header { position: sticky; top: 0; z-index: 10; display: grid; gap: 12px; padding: 14px 18px; background: rgba(255,255,255,.94); border-bottom: 1px solid var(--line); backdrop-filter: blur(16px); }
    .top { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; }
    h1 { margin: 0; font-size: 18px; line-height: 1.1; }
    p { margin: 4px 0 0; color: var(--muted); font-size: 12px; }
    .controls { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
    button, a, select { min-height: 38px; border-radius: 12px; border: 1px solid var(--line); padding: 0 12px; background: white; color: var(--black); font-weight: 800; text-decoration: none; cursor: pointer; }
    button.active, button.primary { background: var(--yellow); border-color: #edb900; }
    select { min-width: 160px; }
    main { display:grid; place-items:start center; padding:18px; }
    .device-shell { width:100%; max-width: calc(100vw - 36px); display:grid; justify-items:center; gap:12px; }
    .device-meta { width:min(100%, 960px); display:flex; justify-content:space-between; gap:10px; color:var(--muted); font-size:12px; font-weight:800; }
    .stage { width:min(100%, 960px); height:calc(100vh - 190px); min-height:520px; overflow:auto; display:grid; place-items:start center; padding:14px; border-radius:22px; background:linear-gradient(135deg,#fffdf7,#f0eee8); border:1px solid var(--line); box-shadow:0 16px 44px rgba(17,24,39,.08); }
    .frame-wrap { transform-origin: top center; }
    iframe { display:block; border:1px solid #d8d6da; border-radius:24px; background:white; box-shadow:0 18px 42px rgba(17,24,39,.18); }
    .desktop iframe { border-radius:16px; }
    .hint { width:min(100%, 960px); color:var(--muted); font-size:12px; text-align:center; }
  </style>
</head>
<body>
  <header>
    <div class="top">
      <div>
        <h1>MyProdusen Lightweight Preview</h1>
        <p>Satu iframe aktif supaya lebih cepat. Ganti device/route pakai tombol.</p>
        <p>Local: ${APP_URL}$( [ -n "$LAN_IP" ] && printf ' · HP: http://%s:%s' "$LAN_IP" "$PORT" )</p>
      </div>
      <div class="controls">
        <button class="primary" onclick="reloadFrame()">Reload</button>
        <a id="openLive" href="${APP_URL}/login" target="_blank">Open live</a>
      </div>
    </div>
    <div class="controls" id="deviceControls"></div>
    <div class="controls">
      <select id="routeSelect" onchange="setRoute(this.value)">
        <option value="/login">Login</option>
        <option value="/register">Register</option>
        <option value="/">Landing</option>
        <option value="/dashboard">Dashboard</option>
        <option value="/dashboard/attendance">Attendance</option>
        <option value="/dashboard/employees">Employees</option>
        <option value="/dashboard/leave">Leave</option>
        <option value="/dashboard/profile">Profile</option>
      </select>
      <button onclick="setRoute('/')">Landing</button>
      <button onclick="setRoute('/login')">Login</button>
      <button onclick="setRoute('/register')">Register</button>
      <button onclick="setRoute('/dashboard')">Dashboard</button>
    </div>
  </header>

  <main>
    <section class="device-shell">
      <div class="device-meta"><span id="deviceLabel"></span><span id="routeLabel"></span></div>
      <div class="stage" id="stage">
        <div class="frame-wrap" id="frameWrap">
          <iframe id="previewFrame" title="Device preview"></iframe>
        </div>
      </div>
      <div class="hint">Kalau blank sebentar, Next lagi compile route. Tunggu lalu klik Reload. Dashboard butuh login.</div>
    </section>
  </main>

  <script>
    const base = '${APP_URL}';
    const devices = [
      { key:'320', name:'Mobile 320', w:320, h:900 },
      { key:'390', name:'iPhone 390', w:390, h:844 },
      { key:'430', name:'Large Mobile 430', w:430, h:932 },
      { key:'768', name:'Tablet 768', w:768, h:1024 },
      { key:'1440', name:'Desktop 1440', w:1440, h:900, desktop:true },
    ];
    let currentDevice = devices[1];
    let currentRoute = '/login';

    function scaleFor(width) {
      const stage = document.getElementById('stage');
      const available = Math.max(280, stage.clientWidth - 28);
      return Math.min(1, available / width);
    }

    function src() {
      return base + currentRoute + '?devicePreview=' + encodeURIComponent(currentDevice.name) + '&t=' + Date.now();
    }

    function renderDeviceButtons() {
      const root = document.getElementById('deviceControls');
      root.innerHTML = '';
      for (const device of devices) {
        const btn = document.createElement('button');
        btn.textContent = device.name;
        btn.className = device.key === currentDevice.key ? 'active' : '';
        btn.onclick = () => { currentDevice = device; updateFrame(); renderDeviceButtons(); };
        root.appendChild(btn);
      }
    }

    function updateFrame() {
      const scale = scaleFor(currentDevice.w);
      const wrap = document.getElementById('frameWrap');
      const frame = document.getElementById('previewFrame');
      const stage = document.getElementById('stage');
      wrap.style.width = currentDevice.w + 'px';
      wrap.style.height = currentDevice.h + 'px';
      wrap.style.transform = 'scale(' + scale + ')';
      frame.width = currentDevice.w;
      frame.height = currentDevice.h;
      frame.src = src();
      stage.style.minHeight = Math.max(520, Math.min(window.innerHeight - 190, currentDevice.h * scale + 28)) + 'px';
      stage.className = 'stage' + (currentDevice.desktop ? ' desktop' : '');
      document.getElementById('deviceLabel').textContent = currentDevice.name + ' · ' + currentDevice.w + ' × ' + currentDevice.h;
      document.getElementById('routeLabel').textContent = currentRoute;
      document.getElementById('openLive').href = base + currentRoute;
      document.getElementById('routeSelect').value = currentRoute;
    }

    function setRoute(route) {
      currentRoute = route;
      updateFrame();
    }

    function reloadFrame() {
      updateFrame();
    }

    window.addEventListener('resize', updateFrame);
    renderDeviceButtons();
    updateFrame();
  </script>
</body>
</html>
HTML

echo "Opening lightweight preview board ..."
if [ -x "$CHROME" ]; then
  "$CHROME" --new-window --window-size="1180,940" "file://${PREVIEW_FILE}" >/dev/null 2>&1 &
else
  open "file://${PREVIEW_FILE}"
fi

echo ""
echo "Lightweight preview opened. Only one device iframe loads at a time."
echo "If a frame is empty, wait for Next compile then click Reload."
echo "Press Enter to close this terminal window. Dev server keeps running."
read -r _

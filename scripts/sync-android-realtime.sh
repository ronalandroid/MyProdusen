#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

echo "🚀 MyProdusen Realtime Android Sync"

export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$HOME/Library/Android/sdk/platform-tools:$HOME/Library/Android/sdk/emulator:$PATH"

echo "✅ Java:"
java -version

echo "📦 Install/update dependencies..."
npm install

echo "🛠️ Ensure mobile scripts..."
npm pkg set scripts.dev:mobile="next dev -H 0.0.0.0 -p 3000"
npm pkg set scripts.android:realtime="bash scripts/sync-android-realtime.sh"

echo "☕ Fix Gradle Java 21..."
python3 - <<'PY'
from pathlib import Path
p = Path("android/gradle.properties")
text = p.read_text() if p.exists() else ""
lines = [l for l in text.splitlines() if not l.startswith("org.gradle.java.home=")]
lines.append("org.gradle.java.home=/Applications/Android Studio.app/Contents/jbr/Contents/Home")
p.write_text("\n".join(lines) + "\n")
PY

echo "📱 Ensure Capacitor config..."
cat > capacitor.config.ts <<'CONFIG'
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.myprodusen.app',
  appName: 'MyProdusen',
  webDir: 'out',
  server: {
    url: 'http://10.0.2.2:3000',
    cleartext: true
  }
};

export default config;
CONFIG

echo "🔐 Ensure Android permissions..."
MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ -f "$MANIFEST" ]; then
  if ! grep -q "android.permission.CAMERA" "$MANIFEST"; then
    sed -i '' '/<application/i\
    <uses-permission android:name="android.permission.CAMERA" />\
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />\
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />\
' "$MANIFEST"
  fi
fi

echo "🔄 Capacitor sync..."
mkdir -p android/app/src/main/assets
npx cap sync android

echo "🌐 Start/restart Next.js dev server..."
if [ -f tmp/mobile-dev.pid ] && kill -0 "$(cat tmp/mobile-dev.pid)" 2>/dev/null; then
  echo "♻️ Stopping old dev server..."
  kill "$(cat tmp/mobile-dev.pid)" || true
  rm -f tmp/mobile-dev.pid
fi

nohup npm run dev:mobile > tmp/mobile-dev.log 2>&1 &
echo $! > tmp/mobile-dev.pid
sleep 8

echo "📱 Check Android emulator/device..."
if ! adb devices | grep -q "device$"; then
  echo "❌ Emulator/device belum aktif."
  echo "Buka Android Studio > Device Manager > Start Pixel 6"
  echo "Lalu jalankan ulang:"
  echo "npm run android:realtime"
  exit 1
fi

TARGET="$(adb devices | awk '/device$/{print $1; exit}')"

echo "📲 Install/open app on: $TARGET"
npx cap run android --target "$TARGET"

echo ""
echo "✅ DONE — Realtime preview active."
echo "Edit file di project, emulator akan reload dari:"
echo "http://10.0.2.2:3000"
echo ""
echo "Lihat log:"
echo "tail -f tmp/mobile-dev.log"

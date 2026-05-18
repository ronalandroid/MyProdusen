#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."
export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"

echo "🚀 MyProdusen Android Live Preview Setup"

mkdir -p tmp android/app/src/main/assets

if [ ! -d android ]; then
  echo "📦 Adding Android platform..."
  npx cap add android
fi

MANIFEST="android/app/src/main/AndroidManifest.xml"

if [ -f "$MANIFEST" ]; then
  if ! grep -q "android.permission.CAMERA" "$MANIFEST"; then
    echo "🔐 Adding Camera + GPS permissions..."
    sed -i '' '/<application/i\
    <uses-permission android:name="android.permission.CAMERA" />\
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />\
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />\
' "$MANIFEST"
  fi
fi

echo "🔄 Sync Capacitor Android..."
mkdir -p android/app/src/main/assets
npx cap sync android || true
mkdir -p android/app/src/main/assets
npx cap sync android

echo "🌐 Starting Next.js dev server..."
if [ -f tmp/mobile-dev.pid ] && kill -0 "$(cat tmp/mobile-dev.pid)" 2>/dev/null; then
  echo "✅ Dev server already running."
else
  nohup npm run dev:mobile > tmp/mobile-dev.log 2>&1 &
  echo $! > tmp/mobile-dev.pid
  sleep 8
fi

echo "📱 Checking emulator/device..."
if ! adb devices | grep -q "device$"; then
  echo "❌ No Android emulator/device detected."
  echo "Open Android Studio > Device Manager > Start Pixel 6 emulator, then run:"
  echo "npm run android:install-live"
  exit 1
fi

TARGET="$(adb devices | awk '/device$/{print $1; exit}')"

echo "📲 Installing app to: $TARGET"
npx cap run android --target "$TARGET"

echo ""
echo "✅ DONE."
echo "App MyProdusen should now be installed/open in emulator."
echo ""
echo "Realtime workflow:"
echo "- Keep this dev server running."
echo "- Edit code in app/components/features/src."
echo "- Emulator reloads from http://10.0.2.2:3000"
echo ""
echo "Check logs:"
echo "tail -f tmp/mobile-dev.log"

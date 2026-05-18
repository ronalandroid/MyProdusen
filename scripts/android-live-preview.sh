#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

mkdir -p tmp android/app/src/main/assets

if ! npm list @capacitor/core >/dev/null 2>&1; then
  npm install @capacitor/core @capacitor/cli @capacitor/android
fi

if [ ! -d android ]; then
  npx cap add android
fi

MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ -f "$MANIFEST" ]; then
  grep -q "android.permission.CAMERA" "$MANIFEST" || sed -i '' '/<application/i\
    <uses-permission android:name="android.permission.CAMERA" />\
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />\
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />\
' "$MANIFEST"
fi

npx cap sync android || true
mkdir -p android/app/src/main/assets
npx cap sync android

if [ -f tmp/mobile-dev.pid ] && kill -0 "$(cat tmp/mobile-dev.pid)" 2>/dev/null; then
  echo "✅ Next.js dev server already running."
else
  nohup npm run dev:mobile > tmp/mobile-dev.log 2>&1 &
  echo $! > tmp/mobile-dev.pid
  echo "✅ Next.js dev server started."
fi

echo ""
echo "✅ READY"
echo "1. Android Studio will open."
echo "2. Wait Gradle Sync."
echo "3. Select Pixel 6."
echo "4. Click Run ▶."
echo "5. Edit code, emulator will reload."
echo ""
echo "Log: tail -f tmp/mobile-dev.log"

npx cap open android

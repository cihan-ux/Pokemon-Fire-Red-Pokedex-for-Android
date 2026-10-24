#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
APK=app/build/outputs/apk/debug/app-debug.apk
[[ -f "$APK" ]] || { echo "APK missing. Run ./build-apk.sh first." >&2; exit 1; }
adb devices
adb install -r "$APK"
echo 'DexQuest GO installed (separate app from DexQuest FireRed).'
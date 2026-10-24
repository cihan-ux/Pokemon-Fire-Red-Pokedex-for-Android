#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
if [[ ! -f "$ANDROID_HOME/platforms/android-35/android.jar" ]]; then
  echo "Android SDK API 35 not found: $ANDROID_HOME/platforms/android-35" >&2
  echo "Install platforms;android-35 or set ANDROID_HOME to your SDK location." >&2
  exit 1
fi
# The prior DexQuest FireRed setup used a local Gradle 8.9 installation.
if ! command -v gradle >/dev/null && [[ -x "$HOME/.local/opt/gradle-8.9/bin/gradle" ]]; then
  export PATH="$HOME/.local/opt/gradle-8.9/bin:$PATH"
fi
if ! command -v gradle >/dev/null; then
  echo 'Gradle 8.9 not found. Add ~/.local/opt/gradle-8.9/bin to PATH.' >&2
  exit 1
fi
if [[ -z "${JAVA_HOME:-}" && -x /usr/lib/jvm/java-21-openjdk-amd64/bin/jlink ]]; then
  export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
  export PATH="$JAVA_HOME/bin:$PATH"
fi
if ! command -v jlink >/dev/null && [[ -z "${JAVA_HOME:-}" ]]; then
  echo 'Full JDK is required (missing jlink). Install openjdk-21-jdk-headless.' >&2
  exit 1
fi
printf 'Using Android SDK: %s\n' "$ANDROID_HOME"
printf 'Using Gradle: %s\n' "$(command -v gradle)"
java -version
gradle --no-daemon assembleDebug
printf '\nAPK created: %s\n' "$PWD/app/build/outputs/apk/debug/app-debug.apk"
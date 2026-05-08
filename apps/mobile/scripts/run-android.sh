#!/usr/bin/env bash
# Ensures adb sees a device (starts Pixel_10 AVD if needed), then runs expo run:android.
# Same shell exports ANDROID_HOME so Expo/Gradle find the SDK.
set -euo pipefail

# Gradle 8.14 + Expo/RN: use JDK 21. JDK 25 (Homebrew `openjdk`) often causes
# "Unsupported class file major version 69" during build script analysis.
BREW_J21="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
if [[ -d "$BREW_J21" ]]; then
  export JAVA_HOME="$BREW_J21"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

ADB="$ANDROID_HOME/platform-tools/adb"
EMU="$ANDROID_HOME/emulator/emulator"
AVD_NAME="${ANDROID_AVD:-Pixel_10}"

has_ready_device() {
  "$ADB" devices 2>/dev/null | grep -v '^List' | grep -qw device
}

if ! command -v "$ADB" >/dev/null 2>&1; then
  echo "adb not found at $ADB — set ANDROID_HOME to your SDK (e.g. $HOME/Library/Android/sdk)" >&2
  exit 1
fi

if has_ready_device; then
  echo "Android device/emulator already connected."
else
  if [[ ! -x "$EMU" ]]; then
    echo "emulator not found at $EMU" >&2
    exit 1
  fi
  if ! "$EMU" -list-avds 2>/dev/null | grep -qx "$AVD_NAME"; then
    echo "AVD '$AVD_NAME' not found. Run: $EMU -list-avds" >&2
    echo "Set ANDROID_AVD to one of those names, or create an AVD in Android Studio." >&2
    exit 1
  fi
  echo "Starting emulator '$AVD_NAME' (set ANDROID_AVD to use another AVD)…"
  nohup "$EMU" -avd "$AVD_NAME" -netdelay none -netspeed full >/tmp/expo-emulator.log 2>&1 &
  echo "Waiting for adb (see /tmp/expo-emulator.log if this hangs)…"
  "$ADB" wait-for-device
  # Wait until boot completes (not just adb shell).
  for _ in $(seq 1 120); do
    if [[ "$("$ADB" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]]; then
      break
    fi
    sleep 2
  done
  if ! has_ready_device; then
    echo "Emulator did not reach ready state. Try: $ADB kill-server && $ADB start-server" >&2
    exit 1
  fi
  echo "Emulator ready."
fi

exec npx expo run:android "$@"

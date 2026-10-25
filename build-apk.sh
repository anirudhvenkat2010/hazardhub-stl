#!/usr/bin/env bash
# build-apk.sh — build an installable Android APK for HazardHub STL via EAS.
set -euo pipefail

PROJECT_DIR="/Users/tvxr2/projects/hazardhub-stl"
NODE20_BIN="/opt/homebrew/opt/node@20/bin"
[ -x "$NODE20_BIN/node" ] && export PATH="$NODE20_BIN:$PATH"
echo "Using Node $(node -v)"
cd "$PROJECT_DIR"

# Prefer a GLOBAL eas (a local eas-cli dep pulls an incompatible config-plugins
# that breaks Gradle). Fall back to npx only if no global one exists.
if command -v eas >/dev/null 2>&1; then EAS="eas"; else
  echo "No global eas found. Install with: npm install -g eas-cli"; EAS="npx --yes eas-cli"; fi
echo "Using eas: $($EAS --version 2>/dev/null | tail -1)"

if $EAS whoami >/dev/null 2>&1; then
  echo "Logged in to Expo as: $($EAS whoami)"
else
  echo "Logging in to Expo (free account at https://expo.dev)..."; $EAS login
fi

$EAS init
echo "Submitting Android APK build (preview profile)..."
$EAS build --platform android --profile preview

echo
echo "When done: open the build URL / scan the QR on your Android phone, download"
echo "the .apk, tap to install (allow 'install from unknown sources')."

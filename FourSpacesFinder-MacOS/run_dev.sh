#!/bin/bash
set -euo pipefail

APP_NAME="FourSpacesFinder"
SRC_DIR="Sources"
BUILD_DIR="BuildDev"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

CLEAN=0
NO_OPEN=0
RUN_BINARY=0

for arg in "$@"; do
  case "$arg" in
    --clean) CLEAN=1 ;;
    --no-open) NO_OPEN=1 ;;
    --run-binary) RUN_BINARY=1 ;;
    *)
      echo "Unknown arg: $arg"
      echo "Usage: ./run_dev.sh [--clean] [--no-open] [--run-binary]"
      exit 1
      ;;
  esac
done

if [ "$CLEAN" -eq 1 ]; then
  rm -rf "$BUILD_DIR"
fi

mkdir -p "$BUILD_DIR/$APP_NAME.app/Contents/MacOS"
mkdir -p "$BUILD_DIR/$APP_NAME.app/Contents/Resources"

ARCH="$(uname -m)"
if [ "$ARCH" = "arm64" ]; then
  TARGET="arm64-apple-macosx13.0"
else
  TARGET="x86_64-apple-macosx13.0"
fi

echo "Compiling ($TARGET)..."
swiftc "$SRC_DIR"/*.swift \
  -o "$BUILD_DIR/$APP_NAME.app/Contents/MacOS/$APP_NAME" \
  -target "$TARGET"

cat > "$BUILD_DIR/$APP_NAME.app/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key><string>$APP_NAME</string>
  <key>CFBundleIdentifier</key><string>com.fourspaces.finder</string>
  <key>CFBundleName</key><string>$APP_NAME</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>0.1</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST

APP_PATH="$SCRIPT_DIR/$BUILD_DIR/$APP_NAME.app"
BIN_PATH="$APP_PATH/Contents/MacOS/$APP_NAME"

echo "Built: $APP_PATH"

if [ "$RUN_BINARY" -eq 1 ]; then
  echo "Running binary..."
  "$BIN_PATH"
  exit 0
fi

if [ "$NO_OPEN" -eq 0 ]; then
  echo "Opening app..."
  open "$APP_PATH"
else
  echo "Skipping open (use: open \"$APP_PATH\")"
fi

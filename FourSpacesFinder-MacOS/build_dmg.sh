#!/bin/bash
set -euo pipefail

APP_NAME="FourSpacesFinder"
SRC_DIR="Sources"
BUILD_DIR="Build"
DMG_NAME="${APP_NAME}.dmg"
STAGE_DIR="$BUILD_DIR/DmgStage"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Cleaning..."
rm -rf "$BUILD_DIR"
rm -f "$DMG_NAME"

echo "Creating directories..."
mkdir -p "$BUILD_DIR/$APP_NAME.app/Contents/MacOS"
mkdir -p "$BUILD_DIR/$APP_NAME.app/Contents/Resources"
mkdir -p "$STAGE_DIR"

WEB_IMG_DIR="$SCRIPT_DIR/../FourSpacesFinder-Web/public/asset/img"
for img in "Adriel.png" "Vince.jpg" "Mac.jpg" "Reine.jpg" "Zyrah.JPG" "Paul.jpg"; do
  if [ ! -f "$WEB_IMG_DIR/$img" ]; then
    echo "Missing image: $WEB_IMG_DIR/$img"
    exit 1
  fi
  cp "$WEB_IMG_DIR/$img" "$BUILD_DIR/$APP_NAME.app/Contents/Resources/$img"
done

if [ -f "Resources/AppIcon.icns" ]; then
  cp "Resources/AppIcon.icns" "$BUILD_DIR/$APP_NAME.app/Contents/Resources/AppIcon.icns"
fi

echo "Compiling Swift sources..."
swiftc "$SRC_DIR"/*.swift -o "$BUILD_DIR/$APP_NAME.app/Contents/MacOS/$APP_NAME.arm64" -target arm64-apple-macosx13.0
swiftc "$SRC_DIR"/*.swift -o "$BUILD_DIR/$APP_NAME.app/Contents/MacOS/$APP_NAME.x86_64" -target x86_64-apple-macosx13.0
lipo -create -output "$BUILD_DIR/$APP_NAME.app/Contents/MacOS/$APP_NAME" \
  "$BUILD_DIR/$APP_NAME.app/Contents/MacOS/$APP_NAME.arm64" \
  "$BUILD_DIR/$APP_NAME.app/Contents/MacOS/$APP_NAME.x86_64"
rm -f "$BUILD_DIR/$APP_NAME.app/Contents/MacOS/$APP_NAME.arm64" "$BUILD_DIR/$APP_NAME.app/Contents/MacOS/$APP_NAME.x86_64"

echo "Creating Info.plist..."
cat <<PLIST > "$BUILD_DIR/$APP_NAME.app/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>$APP_NAME</string>
    <key>CFBundleIdentifier</key>
    <string>com.adrielmagalona.$APP_NAME</string>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>13.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
</dict>
</plist>
PLIST

echo "Creating DMG..."
rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR"
cp -R "$BUILD_DIR/$APP_NAME.app" "$STAGE_DIR/"
hdiutil create -volname "$APP_NAME" -srcfolder "$STAGE_DIR" -ov -format UDZO "$DMG_NAME"

echo "Done! DMG created at $PWD/$DMG_NAME"

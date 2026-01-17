#!/bin/bash
set -e

APP_NAME="FourSpacesFinder"
SRC_DIR="Sources"
BUILD_DIR="Build"
DMG_NAME="${APP_NAME}.dmg"

cd /Users/adrielmagalona/Desktop/FourSpacesFinderdmg

echo "Cleaning..."
rm -rf "$BUILD_DIR"
rm -f "$DMG_NAME"

echo "Creating directories..."
mkdir -p "$BUILD_DIR/$APP_NAME.app/Contents/MacOS"
mkdir -p "$BUILD_DIR/$APP_NAME.app/Contents/Resources"

echo "Compiling Swift sources..."
swiftc "$SRC_DIR"/*.swift -o "$BUILD_DIR/$APP_NAME.app/Contents/MacOS/$APP_NAME" -target arm64-apple-macosx13.0

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
hdiutil create -volname "$APP_NAME" -srcfolder "$BUILD_DIR/$APP_NAME.app" -ov -format UDZO "$DMG_NAME"

echo "Done! DMG created at $PWD/$DMG_NAME"

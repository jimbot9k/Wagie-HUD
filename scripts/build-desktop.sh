#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Building frontend for desktop..."
cd "$ROOT_DIR/app"
npm run build:desktop

echo "Copying assets to desktop..."
rm -rf "$ROOT_DIR/desktop/app"
mkdir -p "$ROOT_DIR/desktop/app"
cp -r "$ROOT_DIR/app/dist-desktop" "$ROOT_DIR/desktop/app/dist"

echo "Building Wails desktop app..."
cd "$ROOT_DIR/desktop"
wails build -tags webkit2_41

echo "✓ Desktop build complete: desktop/build/bin/"

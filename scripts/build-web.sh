#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Building web app..."
cd "$ROOT_DIR/app"
npm run build

echo "✓ Web build complete: app/dist/"

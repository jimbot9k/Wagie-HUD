#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

export WEBKIT_DISABLE_COMPOSITING_MODE=1
export GDK_BACKEND=x11

exec "$ROOT_DIR/desktop/build/bin/wagie-hud" "$@"

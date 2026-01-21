#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Building All Targets ==="
echo

"$SCRIPT_DIR/build-web.sh"
echo

"$SCRIPT_DIR/build-desktop.sh"
echo

echo "=== All builds complete ==="

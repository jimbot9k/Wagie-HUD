# Wagie HUD

The wagie income idle game.

Desktop and web application built with Wails (Go) and Svelte 5.

## Project Structure

```
wagie-hud/
├── app/                    # Svelte 5 frontend
│   ├── src/
│   ├── index.html
│   └── vite.config.ts
│
├── desktop/                # Wails wrapper
│   ├── main.go
│   ├── app.go
│   ├── wails.json
│   └── build/
│
├── scripts/                # Build scripts
│   ├── build-all.sh
│   ├── build-web.sh
│   ├── build-desktop.sh
│   └── run-desktop.sh
```

## Requirements

- Go 1.22+
- Node.js 20+
- Wails CLI: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- GTK3 and WebKitGTK 4.1 (Linux)

## Build

```bash
# Install frontend dependencies first
cd app && npm install && cd ..

# Build everything
./scripts/build-all.sh

# Or build individually
./scripts/build-web.sh       # → app/dist/
./scripts/build-desktop.sh   # → desktop/build/bin/
```

## Run

```bash
./scripts/run-desktop.sh
```

## Development

Desktop (hot reload):

```bash
cd desktop
WEBKIT_DISABLE_COMPOSITING_MODE=1 GDK_BACKEND=x11 wails dev -tags webkit2_41
```

Frontend only:

```bash
cd app && npm run dev
```

## License

See [LICENSE](LICENSE)

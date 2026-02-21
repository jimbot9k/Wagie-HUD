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

## Testing

Tests are written with [Vitest](https://vitest.dev/) and cover all application logic in `app/src/lib/` (state management, storage, notifications, platform detection). Components are excluded from the test suite.

```bash
cd app

# Run all tests once
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# Run tests and generate a coverage report
npm run test:coverage
```

Coverage reports are written to `app/coverage/`. Open `app/coverage/index.html` in a browser for the HTML report.

### Coverage thresholds

The project enforces **≥ 80 %** across lines, functions, branches, and statements. The CI run (`npm test`) will exit non-zero if thresholds are not met.

### Test files

| File | What it covers |
|------|---------------|
| `src/lib/__tests__/platform.test.ts` | `getPlatform`, `isWeb`, `isDesktop`, `onWeb`, `onDesktop` |
| `src/lib/__tests__/storage.test.ts` | `LocalStorage` get / set / remove, JSON error handling |
| `src/lib/__tests__/notifications.test.ts` | `NotificationStore` add, auto-dismiss, cap at 5, dismiss |
| `src/lib/__tests__/appState.test.ts` | `AppStateClass` — schedule, rates, stats, chart data, tick/cope/poop, persistence, catch-up earnings |

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

<div align="center">

<img src="app/public/wagie.png" alt="WAGIE HUD" width="600" />

<h1>WAGIE HUD</h1>

<p><strong>Watch your money drip in, second by second, as you stare into the void of your corporate existence.</strong></p>

<p>A real-time earnings tracker that tells you exactly how little you're making per second — available as a web app and a native desktop application.</p>

[![CI](https://github.com/jimbot9k/Wagie-HUD/actions/workflows/ci.yml/badge.svg)](https://github.com/jimbot9k/Wagie-HUD/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white)](https://go.dev)
[![Wails](https://img.shields.io/badge/Wails-v2-red?logo=go&logoColor=white)](https://wails.io)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)

**[🌐 wagiehud.meme](https://wagiehud.meme)**

</div>

---

## Features

- **Real-time earnings counter** — ticks every second based on your salary and schedule
- **Catch-up earnings** — calculates what you earned while the app was closed
- **Cumulative charts** — visualise today, last 7 days, last 30 days, or lifetime earnings
- **Multi-currency** — USD, AUD, GBP, EUR, CAD, NZD, JPY, INR, SGD, HKD
- **Flexible schedule** — configure work days, hours, and pay period (hourly/weekly/fortnightly/annually)
- **Boss Button** — one click switches to a fake spreadsheet. No questions asked.
- **Coffee Button** — deduct $5. That's why you can't afford a house.
- **Poop Button** — lose 5 minutes of earnings. No refunds.
- **Responsive** — works on desktop, tablet, and mobile
- **Native desktop app** — packaged with Wails (Go) for Linux, macOS, and Windows

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Svelte 5 (runes), TypeScript 5 |
| Build | Vite 6, code-split with lazy loading |
| Charts | Chart.js 4 (tree-shaken, lazy-loaded) |
| Desktop wrapper | Wails v2 (Go 1.22+) |
| Testing | Vitest 4, jsdom, 108 tests |
| Linting | ESLint 9 flat config, Prettier 3 |
| CI | GitHub Actions |
| Hosting | Cloudflare Pages |

## Project Structure

```
wagie-hud/
├── app/                        # Svelte 5 frontend
│   ├── src/
│   │   ├── App.svelte          # Root component
│   │   ├── components/         # UI components
│   │   └── lib/                # State, storage, notifications
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── desktop/                    # Wails desktop wrapper
│   ├── main.go
│   ├── app.go
│   └── wails.json
│
├── scripts/                    # Build helpers
│   ├── build-all.sh
│   ├── build-web.sh
│   ├── build-desktop.sh
│   └── run-desktop.sh
│
└── .github/workflows/ci.yml    # CI pipeline
```

## Requirements

- **Node.js** 20+
- **Go** 1.22+
- **Wails CLI** — `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- **Linux only:** GTK3 + WebKitGTK 4.1

  ```bash
  # Ubuntu/Debian
  sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev

  # Arch/Manjaro
  sudo pacman -S webkit2gtk-4.1

  # Fedora
  sudo dnf install gtk3-devel webkit2gtk4.1-devel
  ```

## Getting Started

```bash
# Clone
git clone https://github.com/jimbot9k/Wagie-HUD.git
cd Wagie-HUD

# Install frontend dependencies
cd app && npm install && cd ..
```

### Web (browser)

```bash
# Development server
cd app && npm run dev

# Production build → app/dist/
./scripts/build-web.sh
```

### Desktop (Wails)

```bash
# Development with hot reload
cd desktop
WEBKIT_DISABLE_COMPOSITING_MODE=1 GDK_BACKEND=x11 wails dev -tags webkit2_41

# Production build → desktop/build/bin/
./scripts/build-desktop.sh

# Run the built binary
./scripts/run-desktop.sh
```

### Build everything

```bash
./scripts/build-all.sh
```

## Frontend Scripts

```bash
cd app

npm run dev            # Vite dev server
npm run build          # Production web build
npm run build:desktop  # Production desktop build (no sourcemaps)
npm run build:analyze  # Build + open bundle visualiser (treemap)
npm run check          # svelte-check type checking
npm run lint           # ESLint
npm run format         # Prettier
npm run test           # Run tests once
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report → app/coverage/
```

## Testing

108 tests covering all application logic in `app/src/lib/`. Components are excluded from the unit test suite.

| File | What it covers |
|---|---|
| `storage.test.ts` | `LocalStorage` get / set / remove, JSON error handling |
| `notifications.test.ts` | `NotificationStore` add, auto-dismiss, cap at 5, dismiss |
| `platform.test.ts` | `getPlatform`, `isWeb`, `isDesktop`, `onWeb`, `onDesktop` |
| `appState.test.ts` | Schedule, rates, stats, chart data, tick/cope/poop, persistence, catch-up earnings |

Coverage thresholds are enforced at **≥ 80%** across lines, functions, branches, and statements. CI fails if thresholds are not met.

## CI

The GitHub Actions pipeline runs on every PR to `main`:

1. **Type check** — `svelte-check` + `tsc --noEmit`
2. **Build** — Vite production build, bundle sizes posted to PR summary
3. **Lint** — ESLint with inline PR annotations
4. **Format** — Prettier check
5. **Test** — Vitest with JUnit output, per-test results panel in PR
6. **Audit** — `npm audit`, fails on critical vulnerabilities

## License

[MIT](LICENSE) — © 2026 James Robins

# WhereRat native (Expo)

Read-only Expo Router client for browsing the shared WhereRat catalog. It talks to anonymous **GET** endpoints on your Next backend:

- `/api/v1/catalog` — search, genre chip, sort, pagination (mirrors `/` filters).
- `/api/v1/movies/[slug]` — merged movie payload with paginated sightings (`sort`/`page`) plus IMDb tab JSON.

## Prerequisites

Node **≥ 20.19.4** (Expo SDK 54 / RN 0.81 engine range). Xcode / Android SDK as needed for simulators/devices.

## Environment

Copy `.env.example` to `.env` and point at production or local Next:

```bash
cp .env.example .env
# EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000   # LAN IP for device testing against dev server
```

When unset, the app defaults to `https://whererat.com`.

### Local device against dev machine

Expose Next on `0.0.0.0` (`next dev`), use your machine LAN IP plus port in `EXPO_PUBLIC_API_BASE_URL`, and rely on HTTPS in production (`http://` is simulator-friendly only).

## Scripts

```bash
npm install
npm run start           # Expo dev UI
npm run ios | android   # platform shortcuts
npm run typecheck       # tsc --noEmit
```

## Cursor / VS Code

The repo ships **`.vscode/`** at the workspace root:

- **Extensions:** open the workspace root in Cursor → “Install Workspace Recommended Extensions” for **Expo Tools** (`expo.vscode-expo-tools`) plus **YAML** (required peer for schema validation).
- **Tasks:** **Run Task → `mobile: expo start`** / **`mobile: expo web`** / **`mobile: expo (clear cache)`** (`Terminal → Run Task…`).
- **Debug:** start Metro (`npm run start`), then Run and Debug → **“Expo: attach to Metro”** (Hermes breakpoints in TS/TSX under `apps/mobile/`).

Ensure `npm install` has been run inside `apps/mobile` so `node_modules/expo` exists; that path is what **Expo Tools** uses to activate.

## Store / EAS

- `eas.json` defines `development`, `preview`, and `production` build profiles (`eas login` → `eas build` / `eas submit`).
- Listing URLs: link **Privacy** to `https://whererat.com/privacy` (and keep that page accurate when enabling analytics or authenticated flows).
- v1 declares **consumer read-only browsing** — align age rating questionnaires accordingly.

Deferred product work lives in **`POST_V1.md`** (submissions + auth).

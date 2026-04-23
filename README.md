# Acadex

Desktop and web app for compressing and sharing academic documents. Built with React, Vite, TypeScript, and Electron, with Supabase for auth and storage.

## Features

- Upload and compress PDFs, images, and videos (pdf-lib, sharp, ffmpeg).
- Non-blocking compression progress toast with cancel support.
- Shareable links for uploaded documents (`/s/:shareId`).
- Dashboard and impact tracking pages.
- Supabase-backed authentication (Google sign-in).
- Runs as a web app or a packaged Electron desktop app.

## Stack

- React 19 + React Router 7
- Vite 8, TypeScript 6
- Tailwind CSS + shadcn/ui + Radix
- Zustand, sonner, recharts, lucide-react
- Electron 41 + electron-builder
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)

## Project layout

```
src/           React app (features, components, hooks, lib)
electron/      Electron main + preload, native compressors
server/        Local document gateway (Node)
shared/        IPC types shared between renderer and main
public/        Static assets
```

## Getting started

Requirements: Node 20+, npm.

```bash
npm install
```

Create a `.env` with your Supabase credentials (see `src/lib` for the keys referenced):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Scripts

- `npm run dev` — Vite dev server
- `npm run dev:gateway` — run the local document gateway
- `npm run dev:secure` — dev server + gateway
- `npm run dev:electron` — compile and launch Electron against the dev build
- `npm run dev:full` — Vite + Electron together
- `npm run build` — type-check, build web assets, compile Electron
- `npm run package` — build and produce a distributable via electron-builder
- `npm run lint` — ESLint
- `npm test` / `npm run test:watch` — Vitest

## Packaging

`npm run package` bundles the app with electron-builder. Native binaries from `ffmpeg-static` and `sharp` are unpacked from the asar, and extra tools under `electron/binaries` are copied into the app resources.

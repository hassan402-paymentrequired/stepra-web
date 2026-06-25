# Stepra Web

Vite + React SPA for the Stepra exam prep platform. Shares the Laravel API in `../api/` with the Expo mobile app in `../mobile/`.

## Prerequisites

- Node.js 18+
- Running Stepra API (see `../api/`)

## Setup

```bash
cd web
npm install
cp .env.example .env
```

Edit `.env` and set:

| Variable | Description |
|----------|-------------|
| `VITE_BASE_URL` | API base URL, e.g. `http://localhost:8000/api` |
| `VITE_ABSOLUTE_URL` | Public web origin, e.g. `http://localhost:5173` |

## Development

```bash
npm run dev
```

App runs at [http://localhost:5173](http://localhost:5173) by default.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck and production build |
| `npm run preview` | Serve production build locally |
| `npm run lint` | Run ESLint |

## Project structure

- `src/apis/` — API clients
- `src/hooks/` — Shared hooks (including TanStack Query)
- `src/pages/` — Route pages
- `src/contexts/` — React context (e.g. exam selection)
- `src/lib/` — Auth, API client, session storage

For mobile/web parity work, see `../docs/web-sync-implementation-plan.md`.

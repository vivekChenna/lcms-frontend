# Algihaz LCMS — frontend

Legal Case Management System web client: React 19, TanStack Router + Query, shadcn/ui,
Tailwind v4, built with Vite as a static single-page app (`dist/index.html` + assets).

## Run it locally

Prerequisites: Node.js 20+, and the LCMS backend running on `http://localhost:4000`
(see the backend repo's `docs/integration-runbook.md` for the docker stack, migrations and
`pnpm seed:demo`).

```sh
npm i
cp .env.example .env     # VITE_API_BASE_URL=http://localhost:4000
npm run dev              # http://localhost:5173
```

The backend's `CORS_ORIGINS` must list the origin you open the app on (5173 by default),
because authentication uses HttpOnly cookies sent with `credentials: 'include'`.

Demo accounts (password `Password123!` for all): `vivekadmin@`, `viveklegalmanager@`,
`viveklegalrep@`, `viveklegalrep2@`, `vivek@` (requester), `vivekviewer@` — all `@gmail.com`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build into `dist/` (static; serve any path as `index.html`) |
| `npm run preview` | Serve the built `dist/` locally |
| `npm test` | Vitest unit/component suite |
| `npm run lint` | ESLint + Prettier |
| `npx tsc --noEmit` | Typecheck |
| `npm run api:types` | Regenerate `src/lib/api/schema.d.ts` from the running backend's OpenAPI |

## Deploying

`npm run build` emits plain static files. Build with `VITE_API_BASE_URL` pointing at the API
origin, host the contents of `dist/` on any static host (history-API fallback to `index.html`
for deep links), and add the app's origin to the backend's `CORS_ORIGINS`.

Decisions and baselines are recorded in `docs/decisions.md`.

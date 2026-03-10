# Mock E2E (Playwright)

This folder contains a Playwright E2E suite that runs `tire-admin-web` against an in-process mock API server (no `be-core` required).

## Commands

- Mock E2E (default): `pnpm test:e2e`
- Mock E2E UI: `pnpm test:e2e:ui`
- Real-backend E2E: `pnpm test:e2e:real`

## How it works

- `playwright.mock.config.ts` runs tests under `e2e/mock`.
- `e2e/mock/webserver.mjs` starts:
  - mock API server: `e2e/mock/server.mjs` (default port `19000`)
  - Vite dev server: `pnpm dev --mode e2e` (default port `18848`)
- Vite proxy in `.env.e2e` forwards `/api/v1/*` to the mock API server.

## Ports

- Web: `E2E_WEB_PORT` (default `18848`)
- API: `E2E_API_PORT` (default `19000`)

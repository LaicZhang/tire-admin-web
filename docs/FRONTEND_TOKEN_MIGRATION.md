# Token Storage Migration Plan (Frontend)

## Goal

Reduce XSS impact by moving long-lived tokens out of browser persistent storage and migrating to **HttpOnly cookies** with CSRF protection.

## Current (as-is)

- `accessToken` + `expires` stored in Cookie `authorized-token`.
- `refreshToken` stored in `sessionStorage` (transitional, browser-close cleared).
- Request auth: `Authorization: Bearer <accessToken>` (see `src/utils/http/index.ts`).

## Target (to-be)

- `accessToken` and `refreshToken` set by backend as **HttpOnly cookies**.
- Frontend stops attaching `Authorization` header; requests rely on cookies.
- Add CSRF protection for state-changing requests:
  - Double-submit cookie (`csrf_token` cookie + `X-CSRF-Token` header), or
  - Backend-issued CSRF token endpoint.
- Cookie attributes:
  - `Secure` in production
  - `SameSite=Strict` (same-site only) or `Lax` (if needed); document any cross-site requirements
  - Narrow `Path`/`Domain` as appropriate

## Migration Steps

1. Backend: introduce cookie-based auth for admin web (access + refresh), keep existing Bearer token flow temporarily.
2. Backend: implement CSRF token mechanism and enforce it on write APIs.
3. Frontend: switch to cookie-based auth (stop sending `Authorization`), add CSRF header injection.
4. Rollout: run in staging first, validate login/refresh/logout + permission routes.
5. Cleanup: remove legacy local token flow after cutoff window.

## Rollback

- Re-enable legacy Bearer token flow on backend and keep `authorized-token` cookie based logic on frontend.

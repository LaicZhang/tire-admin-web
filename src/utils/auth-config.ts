/**
 * HttpOnly Cookie Mode Configuration (AUDIT-040)
 *
 * This file MUST remain dependency-free to break circular imports.
 * It is imported by both http/index.ts and auth.ts.
 *
 * When enabled:
 * - accessToken/refreshToken are stored as HttpOnly cookies by the backend
 * - Frontend does NOT read or write tokens directly
 * - Frontend sends credentials: 'include' with all requests
 * - CSRF token is read from a non-HttpOnly cookie and sent in headers
 *
 * Development: keep false unless local admin is same-site with API.
 * Production (.env.production): default true (FSW-004). Requires AUTH_COOKIE_ENABLED=true
 * and CSRF header (see be-core DEPLOYMENT / .env.production.example).
 */
export const useHttpOnlyCookie =
  import.meta.env.VITE_USE_HTTPONLY_COOKIE === "true";

/** CSRF Token cookie name (readable by JS, set by backend) */
export const csrfCookieName = "_csrf";

/** CSRF Token header name (must match backend CSRF guard) */
export const csrfHeaderName = "x-csrf-token";

/**
 * Viewport-driven layout breakpoints (ADM-MOB-004).
 * Layout / dialog fullscreen must use these, not UA deviceDetection().
 * UA may still indicate touch capability only.
 *
 * Keep in sync with SCSS `$viewport-*` in `src/style/breakpoints.scss`
 * and media queries that hardcode the same px values (CSS vars cannot drive @media).
 */
export const VIEWPORT_BREAKPOINTS = {
  /** ≤ mobile layout: hide sidebar, compact chrome, dialog fullscreen */
  MOBILE: 760,
  /** ≤ tablet: collapse sidebar */
  TABLET: 990,
  /** ≤ search form full-width items */
  SEARCH_STACK: 640
} as const;

export type ViewportBand = "mobile" | "tablet" | "desktop";

export function getViewportWidth(): number {
  if (typeof document === "undefined") return VIEWPORT_BREAKPOINTS.TABLET + 1;
  return (
    document.documentElement?.clientWidth ||
    window.innerWidth ||
    VIEWPORT_BREAKPOINTS.TABLET + 1
  );
}

export function getViewportHeight(): number {
  if (typeof document === "undefined") return 800;
  return document.documentElement?.clientHeight || window.innerHeight || 800;
}

/** Layout "mobile" shell: width ≤ 760 */
export function isMobileViewport(width = getViewportWidth()): boolean {
  return width > 0 && width <= VIEWPORT_BREAKPOINTS.MOBILE;
}

/**
 * Tablet width band for density / chrome (does NOT set app.device).
 * MOBILE < width ≤ TABLET (761–990).
 */
export function isTabletViewport(width = getViewportWidth()): boolean {
  return (
    width > VIEWPORT_BREAKPOINTS.MOBILE && width <= VIEWPORT_BREAKPOINTS.TABLET
  );
}

/** Compact search / stacked form controls */
export function isSearchStackViewport(width = getViewportWidth()): boolean {
  return width > 0 && width <= VIEWPORT_BREAKPOINTS.SEARCH_STACK;
}

/** Short landscape (ADM-MOB-010): compress vertical chrome */
export function isCompactLandscape(
  width = getViewportWidth(),
  height = getViewportHeight()
): boolean {
  return height > 0 && height <= 500 && width > height;
}

/** Resolve shell band from width (pure; for layout + tests). */
export function resolveViewportBand(width: number): ViewportBand {
  if (width > 0 && width <= VIEWPORT_BREAKPOINTS.MOBILE) return "mobile";
  if (
    width > VIEWPORT_BREAKPOINTS.MOBILE &&
    width <= VIEWPORT_BREAKPOINTS.TABLET
  )
    return "tablet";
  return "desktop";
}

/**
 * Dialog fullscreen follows mobile viewport only.
 * Prefer this over deviceDetection() for layout/fullscreen.
 * Explicit `fullscreen` on DialogOptions still wins when provided to addDialog.
 */
export function resolveDialogFullscreen(width = getViewportWidth()): boolean {
  return isMobileViewport(width);
}

/**
 * Shared table column hide for secondary cols on narrow screens.
 * Use as `hide: hideOnMobile` in columns.tsx.
 */
export function hideOnMobile(): boolean {
  return isMobileViewport();
}

/**
 * Optional priority helper for columns that should hide on mobile/tablet.
 * - "primary": always show
 * - "secondary": hide on mobile
 * - "tertiary": hide on mobile + tablet
 */
export function columnPriorityHide(
  priority: "primary" | "secondary" | "tertiary",
  width = getViewportWidth()
): boolean {
  if (priority === "primary") return false;
  if (priority === "secondary") return isMobileViewport(width);
  return width > 0 && width <= VIEWPORT_BREAKPOINTS.TABLET;
}

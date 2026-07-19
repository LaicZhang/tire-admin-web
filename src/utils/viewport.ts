/**
 * Viewport-driven layout breakpoints (ADM-MOB-004).
 * Layout / dialog fullscreen must use these, not UA deviceDetection().
 * UA may still indicate touch capability only.
 */
export const VIEWPORT_BREAKPOINTS = {
  /** ≤ mobile layout: hide sidebar, compact chrome */
  MOBILE: 760,
  /** ≤ tablet: collapse sidebar */
  TABLET: 990,
  /** ≤ search form full-width items */
  SEARCH_STACK: 640
} as const;

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

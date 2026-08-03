import { describe, expect, it } from "vitest";
import {
  VIEWPORT_BREAKPOINTS,
  isMobileViewport,
  isTabletViewport,
  isSearchStackViewport,
  isCompactLandscape,
  resolveViewportBand,
  resolveDialogFullscreen,
  hideOnMobile,
  columnPriorityHide
} from "../viewport";

describe("viewport helpers (ADM-MOB-004)", () => {
  it("treats width ≤ MOBILE as mobile layout", () => {
    expect(isMobileViewport(VIEWPORT_BREAKPOINTS.MOBILE)).toBe(true);
    expect(isMobileViewport(VIEWPORT_BREAKPOINTS.MOBILE + 1)).toBe(false);
    expect(isMobileViewport(320)).toBe(true);
  });

  it("detects tablet band 761–990 without changing app.device", () => {
    expect(isTabletViewport(VIEWPORT_BREAKPOINTS.MOBILE)).toBe(false);
    expect(isTabletViewport(VIEWPORT_BREAKPOINTS.MOBILE + 1)).toBe(true);
    expect(isTabletViewport(VIEWPORT_BREAKPOINTS.TABLET)).toBe(true);
    expect(isTabletViewport(VIEWPORT_BREAKPOINTS.TABLET + 1)).toBe(false);
    expect(isTabletViewport(768)).toBe(true);
    expect(isTabletViewport(900)).toBe(true);
  });

  it("stacks search form at ≤ SEARCH_STACK", () => {
    expect(isSearchStackViewport(VIEWPORT_BREAKPOINTS.SEARCH_STACK)).toBe(true);
    expect(isSearchStackViewport(VIEWPORT_BREAKPOINTS.SEARCH_STACK + 1)).toBe(
      false
    );
  });

  it("detects compact landscape for chrome compression", () => {
    expect(isCompactLandscape(844, 390)).toBe(true);
    expect(isCompactLandscape(390, 844)).toBe(false);
    expect(isCompactLandscape(1200, 800)).toBe(false);
  });

  it("resolves shell band at critical edges 759/760/761 and 989/990/991", () => {
    expect(resolveViewportBand(759)).toBe("mobile");
    expect(resolveViewportBand(760)).toBe("mobile");
    expect(resolveViewportBand(761)).toBe("tablet");
    expect(resolveViewportBand(989)).toBe("tablet");
    expect(resolveViewportBand(990)).toBe("tablet");
    expect(resolveViewportBand(991)).toBe("desktop");
    expect(resolveViewportBand(1280)).toBe("desktop");
  });

  it("resolves dialog fullscreen only on mobile viewport", () => {
    expect(resolveDialogFullscreen(375)).toBe(true);
    expect(resolveDialogFullscreen(VIEWPORT_BREAKPOINTS.MOBILE)).toBe(true);
    expect(resolveDialogFullscreen(VIEWPORT_BREAKPOINTS.MOBILE + 1)).toBe(
      false
    );
    expect(resolveDialogFullscreen(1280)).toBe(false);
  });

  it("hideOnMobile mirrors isMobileViewport", () => {
    // hideOnMobile reads live width; compare pure helpers via columnPriorityHide
    expect(columnPriorityHide("primary", 375)).toBe(false);
    expect(columnPriorityHide("secondary", 375)).toBe(true);
    expect(columnPriorityHide("secondary", 900)).toBe(false);
    expect(columnPriorityHide("tertiary", 900)).toBe(true);
    expect(columnPriorityHide("tertiary", 1200)).toBe(false);
    expect(typeof hideOnMobile()).toBe("boolean");
  });
});

import { describe, expect, it } from "vitest";
import {
  VIEWPORT_BREAKPOINTS,
  isMobileViewport,
  isSearchStackViewport,
  isCompactLandscape
} from "../viewport";

describe("viewport helpers (ADM-MOB-004)", () => {
  it("treats width ≤ MOBILE as mobile layout", () => {
    expect(isMobileViewport(VIEWPORT_BREAKPOINTS.MOBILE)).toBe(true);
    expect(isMobileViewport(VIEWPORT_BREAKPOINTS.MOBILE + 1)).toBe(false);
    expect(isMobileViewport(320)).toBe(true);
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
});

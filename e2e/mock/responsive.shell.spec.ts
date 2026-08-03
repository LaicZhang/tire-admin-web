import { test, expect } from "@playwright/test";

/**
 * Shell three-band responsive smoke (ADM-MOB-004).
 * Desktop project also runs at default; mobile-chrome / ipad projects
 * use device presets for narrow / tablet widths.
 */
test.describe("responsive shell", () => {
  test("app shell mounts and main chrome is usable", async ({
    page
  }, testInfo) => {
    await page.goto("/");
    await expect(page.locator(".app-wrapper")).toBeVisible({ timeout: 30_000 });

    const width = page.viewportSize()?.width ?? 0;
    // mobile band: hamburger / mobile class expected when width ≤ 760
    if (width > 0 && width <= 760) {
      await expect(
        page
          .locator(".app-wrapper.mobile, .mobile .navbar, .hamburger-container")
          .first()
      ).toBeVisible({
        timeout: 10_000
      });
    }

    // top bar present
    const chrome = page
      .locator(".navbar, .horizontal-header, .fixed-header")
      .first();
    await expect(chrome).toBeVisible({ timeout: 10_000 });

    // no horizontal page blowout beyond slight table scroll
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 48);

    // project name for debugging multi-viewport CI
    expect(testInfo.project.name).toBeTruthy();
  });

  test("login page does not overflow on current viewport", async ({ page }) => {
    await page.goto("/#/login");
    await expect(page.locator("body")).toBeVisible();
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 24);
  });
});

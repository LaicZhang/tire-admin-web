import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const storageStatePath = "test-results/.auth/state.json";

test("auth: seed storageState", async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto("/#/login");

  await page.evaluate(() => {
    document.cookie = "multiple-tabs=true; path=/";
    localStorage.setItem(
      "user-info",
      JSON.stringify({
        expires: Date.now() + 86400000,
        username: "admin",
        roles: ["admin"],
        uid: "e2e-admin"
      })
    );
  });

  await expect
    .poll(() => page.evaluate(() => document.cookie), { timeout: 10_000 })
    .toContain("multiple-tabs=true");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("user-info")), {
      timeout: 10_000
    })
    .not.toBeNull();

  await page.goto("/");
  await expect(page.locator(".app-wrapper")).toBeVisible({ timeout: 30_000 });

  await fs.mkdir(path.dirname(storageStatePath), { recursive: true });
  await page.context().storageState({ path: storageStatePath });
});

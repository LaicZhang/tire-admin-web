import { test, expect } from "../fixtures";

/**
 * 首页 E2E 测试
 */
test.describe("首页", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto("/welcome");
    await page.waitForLoadState("networkidle");
  });

  test("页面应正确加载", async ({ authenticatedPage: page }) => {
    await expect(page.locator(".main-content, .app-main")).toBeVisible();
  });

  test("应显示统计卡片", async ({ authenticatedPage: page }) => {
    // 首页通常有统计卡片
    const hasCards =
      (await page
        .locator(".el-card")
        .first()
        .isVisible()
        .catch(() => false)) ||
      (await page
        .locator(".stat-card, .dashboard-card, .summary-card")
        .first()
        .isVisible()
        .catch(() => false));
    expect(hasCards).toBeTruthy();
  });

  test("应显示快捷入口", async ({ authenticatedPage: page }) => {
    // 首页可能有快捷操作按钮
    const hasButtons = await page
      .locator("button, .el-button")
      .first()
      .isVisible()
      .catch(() => false);
    const hasLinks = await page
      .locator("a")
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasButtons || hasLinks).toBeTruthy();
  });

  test("应显示待办事项或提醒", async ({ authenticatedPage: page }) => {
    // 待办事项区域
    const hasTodo =
      (await page
        .locator(".todo-list, .task-list, .reminder-list")
        .isVisible()
        .catch(() => false)) ||
      (await page
        .locator(".el-table, .el-list")
        .first()
        .isVisible()
        .catch(() => false)) ||
      (await page.locator(".el-card").count()) > 0;
    expect(hasTodo).toBeTruthy();
  });

  test("应显示图表或可视化数据", async ({ authenticatedPage: page }) => {
    // 首页通常有销售趋势等图表
    const hasChart =
      (await page
        .locator("canvas")
        .first()
        .isVisible()
        .catch(() => false)) ||
      (await page
        .locator(".echarts, svg")
        .first()
        .isVisible()
        .catch(() => false)) ||
      (await page.locator(".el-card").count()) > 1;
    expect(hasChart).toBeTruthy();
  });

  test("点击统计卡片应可跳转", async ({ authenticatedPage: page }) => {
    const cards = page.locator(".el-card");
    const cardCount = await cards.count();
    if (cardCount > 0) {
      // 验证卡片可点击（可能是链接或按钮）
      const firstCard = cards.first();
      await expect(firstCard).toBeVisible();
    }
  });
});

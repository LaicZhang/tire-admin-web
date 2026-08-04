import { describe, expect, it } from "vitest";
import {
  classifyRedeemFailure,
  formatFeatureKeysSummary,
  formatPlanEndsAt,
  isAdminOrBossRole,
  planCodeLabel,
  redeemFailureCopy,
  summarizeCompanyPlan
} from "../companyPlan";

describe("companyPlan helpers (W133)", () => {
  it("labels plan codes and distinguishes free plan wording", () => {
    expect(planCodeLabel("FREE")).toBe("免费计划");
    expect(planCodeLabel("PREMIUM")).toBe("高级计划");
    expect(planCodeLabel("BUYOUT")).toBe("买断计划");
    expect(planCodeLabel("FREE")).not.toContain("账套导入");
  });

  it("summarizes feature keys and endsAt", () => {
    expect(formatFeatureKeysSummary([])).toBe("无功能点");
    expect(formatFeatureKeysSummary(["a", "b"])).toBe("a、b");
    expect(formatFeatureKeysSummary(["1", "2", "3", "4", "5", "6", "7", "8", "9"], 3)).toBe(
      "1、2、3 等 9 项"
    );
    expect(formatPlanEndsAt(null)).toBe("不限期");
  });

  it("gates redeem to admin/boss roles", () => {
    expect(isAdminOrBossRole(["seller"])).toBe(false);
    expect(isAdminOrBossRole(["boss"])).toBe(true);
    expect(isAdminOrBossRole(["admin", "finance"])).toBe(true);
    expect(isAdminOrBossRole(["Boss"])).toBe(true);
  });

  it("classifies redeem failure messages for Boss-facing copy", () => {
    expect(classifyRedeemFailure("兑换码已过期")).toBe("expired");
    expect(classifyRedeemFailure("兑换码已用尽")).toBe("exhausted");
    expect(classifyRedeemFailure("兑换码不适用于当前公司")).toBe("bound_mismatch");
    expect(classifyRedeemFailure("兑换码不存在")).toBe("not_found");
    expect(classifyRedeemFailure("兑换码不可用")).toBe("unavailable");
    expect(redeemFailureCopy("exhausted")).toContain("已用尽");
    expect(redeemFailureCopy("forbidden")).toContain("Boss");
  });

  it("summarizes resolved entitlement payload", () => {
    const s = summarizeCompanyPlan({
      planCode: "PREMIUM",
      grantUid: "g1",
      featureKeys: ["core.workplace", "org.salary"],
      menuUids: [],
      permissionPaths: [],
      limits: {},
      receivesUpdates: true,
      expiredApplied: false,
      endsAt: null
    });
    expect(s.planLabel).toBe("高级计划");
    expect(s.features).toContain("core.workplace");
    expect(s.endsAt).toBe("不限期");
    expect(s.receivesUpdates).toContain("跟随");
  });
});

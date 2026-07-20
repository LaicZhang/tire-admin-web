import { describe, expect, it } from "vitest";
import authRoutes from "./auth";

describe("auth routes", () => {
  it("exposes a visible supplier claim business entry", () => {
    const businessRoute = authRoutes.find(route => route.name === "business");
    const supplierClaimRoute = businessRoute?.children?.find(
      route => route.path === "/business/supplierClaim"
    );

    expect(supplierClaimRoute).toMatchObject({
      name: "supplierClaim",
      isShow: true,
      meta: {
        title: "供应商索赔"
      }
    });
  });

  it("exposes a management-first serial trace analysis entry", () => {
    const analysisRoute = authRoutes.find(route => route.name === "analysis");
    const serialTraceRoute = analysisRoute?.children?.find(
      route => route.path === "/analysis/serial-trace"
    );

    expect(serialTraceRoute).toMatchObject({
      name: "serialTraceAnalysis",
      isShow: true,
      meta: {
        title: "轮胎全链路溯源",
        roles: ["admin", "boss", "dataAnalyst", "dataAnalystManager"]
      }
    });
  });
});

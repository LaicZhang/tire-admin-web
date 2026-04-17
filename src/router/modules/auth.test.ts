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

  it("exposes a trace workbench analysis entry for admin and boss", () => {
    const analysisRoute = authRoutes.find(route => route.name === "analysis");
    const traceWorkbenchRoute = analysisRoute?.children?.find(
      route => route.path === "/analysis/trace-workbench"
    );

    expect(traceWorkbenchRoute).toMatchObject({
      name: "traceWorkbench",
      isShow: true,
      meta: {
        title: "经营溯源台",
        roles: ["admin", "boss"]
      }
    });
  });
});

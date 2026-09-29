import { describe, expect, it } from "vitest";
import financeRoutes from "./finance";
import toolsRoutes from "./tools";
import homeRoutes from "./home";
import resultRoutes from "./result";
import errorRoutes from "./error";

describe("static route role guards", () => {
  it("declares roles for static route trees", () => {
    expect(financeRoutes.meta?.roles).toEqual([
      "admin",
      "boss",
      "manager",
      "finance"
    ]);
    expect(toolsRoutes.meta?.roles).toEqual(["admin"]);
    expect(homeRoutes.meta?.roles).toEqual([
      "admin",
      "boss",
      "common",
      "officer",
      "manager",
      "finance",
      "financeManager"
    ]);
    expect(resultRoutes.meta?.roles).toEqual([
      "admin",
      "boss",
      "common",
      "officer",
      "manager",
      "finance",
      "financeManager"
    ]);
    expect(errorRoutes.meta?.roles).toEqual([
      "admin",
      "boss",
      "common",
      "officer",
      "manager",
      "finance",
      "financeManager"
    ]);
  });
});

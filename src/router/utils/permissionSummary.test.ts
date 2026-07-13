import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("server permission summary", () => {
  it("collects roles and button permissions from every dynamic route node", async () => {
    const helperPath = path.resolve(
      process.cwd(),
      "src/router/utils/permissionSummary.ts"
    );
    expect(existsSync(helperPath)).toBe(true);
    const modulePath = "./permissionSummary";
    const { collectServerPermissionSummary } = await import(
      /* @vite-ignore */ modulePath
    );

    expect(
      collectServerPermissionSummary([
        {
          meta: { roles: ["sales", "manager"], auths: ["sale:create"] },
          children: [
            { meta: { roles: ["sales"], auths: ["sale:update"] } },
            { meta: { roles: ["finance"], auths: ["sale:create"] } }
          ]
        }
      ])
    ).toEqual({
      roles: ["finance", "manager", "sales"],
      permissions: ["sale:create", "sale:update"]
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  applyLastFormHeader,
  mergeRecentEntities,
  pickLastFormHeader,
  RECENT_ENTITY_MAX
} from "../recentFormMemory";

describe("mergeRecentEntities", () => {
  it("prepends and caps", () => {
    const base = [
      { uid: "a", name: "A", at: 1 },
      { uid: "b", name: "B", at: 2 }
    ];
    const next = mergeRecentEntities(base, { uid: "c", name: "C" }, 2, 99);
    expect(next).toHaveLength(2);
    expect(next[0]).toEqual({ uid: "c", name: "C", at: 99 });
    expect(next[1].uid).toBe("a");
  });

  it("moves existing uid to front and refreshes name", () => {
    const base = [
      { uid: "a", name: "A", at: 1 },
      { uid: "b", name: "B", at: 2 }
    ];
    const next = mergeRecentEntities(base, { uid: "b", name: "B2" }, 8, 50);
    expect(next[0]).toEqual({ uid: "b", name: "B2", at: 50 });
    expect(next).toHaveLength(2);
  });

  it("ignores empty uid", () => {
    const base = [{ uid: "a", name: "A", at: 1 }];
    expect(mergeRecentEntities(base, { uid: "  ", name: "X" })).toEqual(base);
  });

  it("respects RECENT_ENTITY_MAX default", () => {
    const base = Array.from({ length: RECENT_ENTITY_MAX }, (_, i) => ({
      uid: `u${i}`,
      name: `N${i}`,
      at: i
    }));
    const next = mergeRecentEntities(base, { uid: "new", name: "New" });
    expect(next).toHaveLength(RECENT_ENTITY_MAX);
    expect(next[0].uid).toBe("new");
  });
});

describe("pickLastFormHeader", () => {
  it("keeps whitelist only and strips blanks", () => {
    const picked = pickLastFormHeader({
      customerId: "c1",
      customerName: "  Cust  ",
      amount: 100,
      details: [{ tireId: "t" }],
      repoId: "",
      paymentMethod: "CASH",
      total: "999"
    });
    expect(picked).toEqual({
      customerId: "c1",
      customerName: "Cust",
      paymentMethod: "CASH"
    });
  });
});

describe("applyLastFormHeader", () => {
  it("override mode lets last win over company defaults", () => {
    const target: Record<string, unknown> = {
      customerId: "",
      repoId: "company-default",
      paymentId: ""
    };
    applyLastFormHeader(
      target,
      {
        customerId: "c-last",
        repoId: "repo-last",
        paymentId: "pay-last"
      },
      "override"
    );
    expect(target.customerId).toBe("c-last");
    expect(target.repoId).toBe("repo-last");
    expect(target.paymentId).toBe("pay-last");
  });

  it("prefer mode only fills blanks", () => {
    const target: Record<string, unknown> = {
      customerId: "",
      repoId: "kept"
    };
    applyLastFormHeader(
      target,
      { customerId: "c-last", repoId: "repo-last" },
      "prefer"
    );
    expect(target.customerId).toBe("c-last");
    expect(target.repoId).toBe("kept");
  });
});

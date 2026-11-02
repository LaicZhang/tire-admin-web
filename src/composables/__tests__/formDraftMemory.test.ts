import { beforeEach, describe, expect, it, vi } from "vitest";

const { state, storage, storeMocks } = vi.hoisted(() => {
  const state = {
    data: new Map<string, unknown>(),
    failGet: false,
    failSetData: false,
    failSetIndex: false,
    failRemove: false,
    failRemoveIndex: false
  };
  const storage = {
    getItem: vi.fn(async (key: string) => {
      if (state.failGet) throw new Error("get failed");
      return state.data.get(key) ?? null;
    }),
    setItem: vi.fn(async (key: string, value: unknown) => {
      if (key === "fdm:scopes" ? state.failSetIndex : state.failSetData) {
        throw new Error("set failed");
      }
      state.data.set(key, value);
      return value;
    }),
    removeItem: vi.fn(async (key: string) => {
      if (key === "fdm:scopes" ? state.failRemoveIndex : state.failRemove) {
        throw new Error("remove failed");
      }
      state.data.delete(key);
    })
  };
  return {
    state,
    storage,
    storeMocks: {
      companyId: "company-1",
      userUid: "user-1",
      companyThrows: false,
      token: { uid: "token-user" } as { uid?: string } | null
    }
  };
});

vi.mock("@/utils/localforage", () => ({ localForage: () => storage }));
vi.mock("@/store/modules/company", () => ({
  useCurrentCompanyStoreHook: () => {
    if (storeMocks.companyThrows) throw new Error("pinia unavailable");
    return { companyId: storeMocks.companyId };
  }
}));
vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: () => ({ uid: storeMocks.userUid })
}));
vi.mock("@/utils/auth", () => ({ getToken: () => storeMocks.token }));
vi.mock("../recentFormMemory", () => ({
  LAST_FORM_DOC_TYPES: ["saleOrder", "payment"],
  pickLastFormHeader: (source: Record<string, unknown> | null | undefined) => {
    const value = source?.customerId;
    return typeof value === "string" && value.trim()
      ? { customerId: value.trim() }
      : {};
  }
}));

import {
  FORM_DRAFT_MAX_LINES,
  FORM_DRAFT_TTL_MS,
  applyFormDraftHeader,
  clearFormDraft,
  clearFormDraftMemory,
  draftFormKey,
  isFormDraftDocType,
  isFormDraftExpired,
  readFormDraft,
  sanitizeFormDraft,
  writeFormDraft
} from "../formDraftMemory";

const scope = { companyUid: "company-1", userUid: "user-1" };
const draftKey = "draft:form:company-1:user-1:saleOrder";

beforeEach(() => {
  state.data.clear();
  state.failGet = false;
  state.failSetData = false;
  state.failSetIndex = false;
  state.failRemove = false;
  state.failRemoveIndex = false;
  storeMocks.companyId = "company-1";
  storeMocks.userUid = "user-1";
  storeMocks.companyThrows = false;
  storeMocks.token = { uid: "token-user" };
  storage.getItem.mockClear();
  storage.setItem.mockClear();
  storage.removeItem.mockClear();
});

describe("draft payload helpers", () => {
  it("builds scoped keys and validates supported document types", () => {
    expect(draftFormKey("c", "u", "payment")).toBe("draft:form:c:u:payment");
    expect(isFormDraftDocType("saleOrder")).toBe(true);
    expect(isFormDraftDocType("customer")).toBe(false);
  });

  it("rejects empty sources and keeps only safe line and remark fields", () => {
    expect(sanitizeFormDraft(null)).toBeNull();
    expect(
      sanitizeFormDraft("bad" as unknown as Record<string, unknown>)
    ).toBeNull();
    expect(sanitizeFormDraft({})).toBeNull();

    const payload = sanitizeFormDraft(
      {
        customerId: " customer-1 ",
        amount: 999,
        details: [
          null,
          "bad",
          {
            tireId: " tire-1 ",
            tireName: " Tire ",
            qty: "2",
            count: 3,
            repoId: " repo-1 "
          },
          { tireId: "", qty: "bad", count: -1 },
          { qty: "4" },
          { count: 0 },
          { tireName: "name-only", repoId: "repo-only" }
        ],
        note: "  note text  "
      },
      123
    );

    expect(payload).toEqual({
      savedAt: 123,
      header: { customerId: "customer-1" },
      lines: [
        {
          tireId: "tire-1",
          tireName: "Tire",
          qty: 2,
          count: 3,
          repoId: "repo-1"
        },
        { qty: 4 },
        { count: 0 }
      ],
      remark: "note text"
    });
  });

  it("supports line aliases, truncation and memo remarks", () => {
    const details = Array.from(
      { length: FORM_DRAFT_MAX_LINES + 2 },
      (_, i) => ({
        tireId: `t${i}`
      })
    );
    expect(sanitizeFormDraft({ details }, 1)?.lines).toHaveLength(
      FORM_DRAFT_MAX_LINES
    );
    expect(sanitizeFormDraft({ lines: [{ count: "1.5" }] }, 1)?.lines).toEqual([
      { count: 1.5 }
    ]);
    expect(sanitizeFormDraft({ items: [{ repoId: "r" }] }, 1)).toBeNull();

    expect(
      sanitizeFormDraft({ items: [], memo: " x ".repeat(150) }, 2)?.remark
    ).toHaveLength(200);
    expect(
      sanitizeFormDraft({ items: [], note: " " }, 2)?.remark
    ).toBeUndefined();
    expect(
      sanitizeFormDraft({ customerId: "c", note: 3 }, 2)?.remark
    ).toBeUndefined();
    expect(sanitizeFormDraft({ customerId: "c" }, 2)).toEqual({
      savedAt: 2,
      header: { customerId: "c" },
      lines: []
    });
  });

  it("detects missing and expired payloads", () => {
    expect(isFormDraftExpired(null, 10)).toBe(true);
    expect(
      isFormDraftExpired(
        { savedAt: "bad" } as unknown as Parameters<
          typeof isFormDraftExpired
        >[0],
        10
      )
    ).toBe(true);
    expect(
      isFormDraftExpired({ savedAt: 1, header: {}, lines: [] }, 2, 2)
    ).toBe(false);
    expect(
      isFormDraftExpired({ savedAt: 1, header: {}, lines: [] }, 5, 2)
    ).toBe(true);
    expect(FORM_DRAFT_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("applies headers only to blank fields in prefer mode and always in override mode", () => {
    const target: Record<string, unknown> = {
      customerId: "existing",
      remark: "existing remark"
    };
    applyFormDraftHeader(target, null);
    applyFormDraftHeader(target, { savedAt: 1, header: {}, lines: [] });
    applyFormDraftHeader(
      target,
      {
        savedAt: 1,
        header: { customerName: "" as unknown as string, customerId: "next" },
        lines: [],
        remark: "draft remark"
      },
      "prefer"
    );
    expect(target).toEqual({
      customerId: "existing",
      remark: "existing remark"
    });

    applyFormDraftHeader(
      target,
      {
        savedAt: 1,
        header: { customerId: "override" },
        lines: [],
        remark: "new"
      },
      "override"
    );
    expect(target).toEqual({
      customerId: "override",
      remark: "new"
    });

    const empty: Record<string, unknown> = { note: "  " };
    applyFormDraftHeader(
      empty,
      {
        savedAt: 1,
        header: { customerId: "filled" },
        lines: [],
        remark: "memo"
      },
      "prefer"
    );
    expect(empty).toEqual({ note: "  ", customerId: "filled", remark: "memo" });
  });
});

describe("draft storage", () => {
  it("resolves an explicit or store scope", async () => {
    await expect(
      readFormDraft("saleOrder", { companyUid: " ", userUid: "u" })
    ).resolves.toBeNull();
    await expect(readFormDraft("saleOrder")).resolves.toBeNull();
    storeMocks.userUid = "";
    state.data.set(draftKey, null);
    await expect(readFormDraft("saleOrder")).resolves.toBeNull();
    expect(storage.getItem).toHaveBeenCalledWith(draftKey);

    storeMocks.token = null;
    await expect(readFormDraft("saleOrder")).resolves.toBeNull();
    storeMocks.companyId = "";
    await expect(readFormDraft("saleOrder")).resolves.toBeNull();
    storeMocks.companyThrows = true;
    await expect(readFormDraft("saleOrder")).resolves.toBeNull();
  });

  it("rejects invalid and expired stored drafts and removes expired data", async () => {
    state.data.set(draftKey, "invalid");
    await expect(readFormDraft("saleOrder", scope)).resolves.toBeNull();

    state.data.set(draftKey, { savedAt: Date.now() - FORM_DRAFT_TTL_MS - 1 });
    await expect(readFormDraft("saleOrder", scope)).resolves.toBeNull();
    expect(state.data.has(draftKey)).toBe(false);

    state.failGet = true;
    await expect(readFormDraft("saleOrder", scope)).resolves.toBeNull();
  });

  it("normalizes stored drafts, caps lines and keeps an optional remark", async () => {
    state.data.set(draftKey, {
      savedAt: Date.now(),
      header: { customerId: " c ", ignored: "x" },
      lines: Array.from({ length: FORM_DRAFT_MAX_LINES + 1 }, (_, i) => ({
        tireId: `${i}`
      })),
      remark: "memo"
    });
    const payload = await readFormDraft("saleOrder", scope);
    expect(payload).toEqual({
      savedAt: expect.any(Number),
      header: { customerId: "c" },
      lines: expect.arrayContaining([{ tireId: "0" }]),
      remark: "memo"
    });
    expect(payload?.lines).toHaveLength(FORM_DRAFT_MAX_LINES);

    state.data.set(draftKey, {
      savedAt: Date.now(),
      header: {},
      lines: "bad",
      remark: 4
    });
    await expect(readFormDraft("saleOrder", scope)).resolves.toEqual(
      expect.objectContaining({ lines: [] })
    );
    expect((await readFormDraft("saleOrder", scope))?.remark).toBeUndefined();
  });

  it("writes a sanitized draft and registers its scope once", async () => {
    await expect(
      writeFormDraft("saleOrder", { amount: 2 }, scope)
    ).resolves.toBeNull();
    storeMocks.companyId = "";
    await expect(
      writeFormDraft("saleOrder", { customerId: "c" }, {})
    ).resolves.toBeNull();
    storeMocks.companyId = "company-1";

    const payload = await writeFormDraft(
      "saleOrder",
      { customerId: " c1 ", amount: 9, details: [{ tireId: "t", qty: 2 }] },
      scope
    );
    expect(payload).toEqual(
      expect.objectContaining({
        header: { customerId: "c1" },
        lines: [{ tireId: "t", qty: 2 }]
      })
    );
    expect(state.data.get(draftKey)).toEqual(payload);
    expect(state.data.get("fdm:scopes")).toEqual(["company-1:user-1"]);
    expect(storage.setItem).toHaveBeenCalledWith(
      "fdm:scopes",
      ["company-1:user-1"],
      0
    );

    await writeFormDraft("saleOrder", { customerId: "c2" }, scope);
    expect(state.data.get("fdm:scopes")).toEqual(["company-1:user-1"]);
  });

  it("continues when scope registration fails or data cannot be written", async () => {
    state.failGet = true;
    await expect(
      writeFormDraft("saleOrder", { customerId: "c" }, scope)
    ).resolves.toEqual(
      expect.objectContaining({ header: { customerId: "c" } })
    );

    state.failGet = false;
    state.failSetIndex = true;
    await expect(
      writeFormDraft("payment", { customerId: "c" }, scope)
    ).resolves.toEqual(
      expect.objectContaining({ header: { customerId: "c" } })
    );

    state.failSetIndex = false;
    state.failSetData = true;
    await expect(
      writeFormDraft("saleOrder", { customerId: "c" }, scope)
    ).resolves.toBeNull();
  });

  it("clears one draft and tolerates removal failures", async () => {
    state.data.set(draftKey, { savedAt: 1 });
    await clearFormDraft("saleOrder", scope);
    expect(state.data.has(draftKey)).toBe(false);

    state.data.set(draftKey, { savedAt: 1 });
    state.failRemove = true;
    await expect(clearFormDraft("saleOrder", scope)).resolves.toBeUndefined();
    storeMocks.companyId = "";
    await expect(
      clearFormDraft("saleOrder", { companyUid: "", userUid: "" })
    ).resolves.toBeUndefined();
    storeMocks.companyId = "company-1";
  });

  it("clears current drafts or every registered scope", async () => {
    state.data.set("fdm:scopes", [
      "company-1:user-1",
      "company-2:user-2",
      "bad"
    ]);
    state.data.set(draftKey, { savedAt: 1 });
    state.data.set("draft:form:company-2:user-2:payment", { savedAt: 1 });

    await clearFormDraftMemory(scope);
    expect(state.data.has(draftKey)).toBe(false);
    expect(state.data.has("draft:form:company-2:user-2:payment")).toBe(true);

    await clearFormDraftMemory({ allScopes: true });
    expect(state.data.has("draft:form:company-2:user-2:payment")).toBe(false);
    expect(state.data.has("fdm:scopes")).toBe(false);

    state.data.set("fdm:scopes", ["company-3:user-3"]);
    state.data.set("draft:form:company-3:user-3:saleOrder", { savedAt: 1 });
    state.failRemove = true;
    await clearFormDraftMemory({ allScopes: true });
    expect(state.data.has("fdm:scopes")).toBe(false);

    state.failRemove = false;
    state.data.clear();
    await clearFormDraftMemory({ allScopes: true });

    state.failGet = true;
    await clearFormDraftMemory({ allScopes: true });
    state.failGet = false;
    storeMocks.companyId = "";
    await clearFormDraftMemory({ companyUid: "", userUid: "" });
    storeMocks.companyId = "company-1";
  });
});

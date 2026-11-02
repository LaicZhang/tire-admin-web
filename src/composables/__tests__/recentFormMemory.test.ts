const { state, storage, storeMocks, clearDraftMock } = vi.hoisted(() => {
  const state = {
    data: new Map<string, unknown>(),
    failGet: false,
    failSet: false,
    failRemove: false
  };
  const storage = {
    getItem: vi.fn(async (key: string) => {
      if (state.failGet) throw new Error("get failed");
      return state.data.get(key) ?? null;
    }),
    setItem: vi.fn(async (key: string, value: unknown) => {
      if (state.failSet) throw new Error("set failed");
      state.data.set(key, value);
      return value;
    }),
    removeItem: vi.fn(async (key: string) => {
      if (state.failRemove) throw new Error("remove failed");
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
      getTokenResult: { uid: "token-user" } as { uid?: string } | null
    },
    clearDraftMock: vi.fn()
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
vi.mock("@/utils/auth", () => ({
  getToken: () => storeMocks.getTokenResult
}));
vi.mock("../formDraftMemory", () => ({ clearFormDraft: clearDraftMock }));

import {
  applyLastFormHeader,
  applyLastFormHeaderAsync,
  clearRecentFormMemory,
  isBlank,
  lastFormKey,
  listRecentEntities,
  mergeRecentEntities,
  pickLastFormHeader,
  readLastFormHeader,
  recentEntityKey,
  recordSuccessfulCreate,
  resolveMemoryScope,
  touchRecentEntity,
  writeLastFormHeader
} from "../recentFormMemory";

const scope = { companyUid: "company-1", userUid: "user-1" };

beforeEach(() => {
  state.data.clear();
  state.failGet = false;
  state.failSet = false;
  state.failRemove = false;
  storeMocks.companyId = "company-1";
  storeMocks.userUid = "user-1";
  storeMocks.companyThrows = false;
  storeMocks.getTokenResult = { uid: "token-user" };
  storage.getItem.mockClear();
  storage.setItem.mockClear();
  storage.removeItem.mockClear();
  clearDraftMock.mockClear();
});

describe("recent form pure helpers", () => {
  it("detects blanks and merges recent entities deterministically", () => {
    expect(isBlank(null)).toBe(true);
    expect(isBlank("  ")).toBe(true);
    expect(isBlank(" x ")).toBe(false);
    const existing = [
      { uid: "a", name: "A", at: 1 },
      { uid: "b", name: "B", at: 2 }
    ];
    expect(
      mergeRecentEntities(existing, { uid: "b", name: "B2" }, 2, 10)
    ).toEqual([
      { uid: "b", name: "B2", at: 10 },
      { uid: "a", name: "A", at: 1 }
    ]);
    expect(mergeRecentEntities(existing, { uid: " ", name: "x" }, 1)).toEqual([
      { uid: "a", name: "A", at: 1 }
    ]);
    expect(
      mergeRecentEntities(existing, { uid: "c", name: " " }, 8, 20)[0]
    ).toEqual({
      uid: "c",
      name: "c",
      at: 20
    });
  });

  it("picks whitelisted non-blank strings and applies them with both modes", () => {
    const picked = pickLastFormHeader({
      customerId: " c1 ",
      customerName: " Alice ",
      providerId: "",
      repoId: 12,
      paymentMethod: "CASH",
      ignored: "value"
    } as unknown as Record<string, unknown>);
    expect(picked).toEqual({
      customerId: "c1",
      customerName: "Alice",
      paymentMethod: "CASH"
    });
    expect(pickLastFormHeader(null)).toEqual({});
    expect(
      pickLastFormHeader("bad" as unknown as Record<string, unknown>)
    ).toEqual({});

    const target: Record<string, unknown> = {
      customerId: "existing",
      providerId: "",
      amount: 10
    };
    applyLastFormHeader(target, picked, "prefer");
    expect(target).toEqual({
      customerId: "existing",
      customerName: "Alice",
      paymentMethod: "CASH",
      providerId: "",
      amount: 10
    });
    applyLastFormHeader(target, { customerId: "override" }, "override");
    expect(target.customerId).toBe("override");
    expect(() => applyLastFormHeader(target, null)).not.toThrow();
  });

  it("resolves scopes from explicit data, stores, token and failures", () => {
    expect(resolveMemoryScope({ companyUid: " c ", userUid: " u " })).toEqual({
      companyUid: "c",
      userUid: "u"
    });
    expect(resolveMemoryScope({ companyUid: " ", userUid: "u" })).toEqual(
      scope
    );
    storeMocks.userUid = "";
    expect(resolveMemoryScope()).toEqual({
      companyUid: "company-1",
      userUid: "token-user"
    });
    storeMocks.companyId = "";
    expect(resolveMemoryScope()).toBeNull();
    storeMocks.companyThrows = true;
    expect(resolveMemoryScope()).toBeNull();
    expect(recentEntityKey("c", "u", "customer")).toBe(
      "recent:entity:c:u:customer"
    );
    expect(lastFormKey("c", "u", "saleOrder")).toBe("last:form:c:u:saleOrder");
  });
});

describe("recent form persistence", () => {
  it("lists valid recent entities and tolerates invalid storage", async () => {
    state.data.set(recentEntityKey("company-1", "user-1", "customer"), [
      { uid: "a", name: "A", at: 1 },
      { uid: "", name: "bad", at: 2 },
      { uid: "b", name: 3, at: 3 },
      { uid: "c", name: "C", at: 4 }
    ]);
    await expect(listRecentEntities("customer", scope)).resolves.toEqual([
      { uid: "a", name: "A", at: 1 },
      { uid: "c", name: "C", at: 4 }
    ]);
    state.data.set("recent:entity:company-1:user-1:repo", { bad: true });
    await expect(listRecentEntities("repo", scope)).resolves.toEqual([]);
    state.failGet = true;
    await expect(listRecentEntities("customer", scope)).resolves.toEqual([]);
    expect(await listRecentEntities("customer")).toEqual([]);
  });

  it("touches entities and registers each scope once", async () => {
    await touchRecentEntity("customer", { uid: "a", name: "Alice" }, scope);
    await touchRecentEntity("customer", { uid: "b", name: "Bob" }, scope);
    expect(
      state.data.get(recentEntityKey("company-1", "user-1", "customer"))
    ).toEqual([
      { uid: "b", name: "Bob", at: expect.any(Number) },
      { uid: "a", name: "Alice", at: expect.any(Number) }
    ]);
    expect(state.data.get("rfm:scopes")).toEqual(["company-1:user-1"]);

    await touchRecentEntity("customer", { uid: " ", name: "ignored" }, scope);
    await touchRecentEntity(
      "customer",
      { uid: "ignored", name: "x" },
      undefined
    );
    state.failSet = true;
    await expect(
      touchRecentEntity("customer", { uid: "x", name: "X" }, scope)
    ).resolves.toBeUndefined();
  });

  it("reads, writes and applies last form headers", async () => {
    await writeLastFormHeader(
      "saleOrder",
      { customerId: "c1", customerName: "Customer", amount: 99 },
      scope
    );
    await expect(readLastFormHeader("saleOrder", scope)).resolves.toEqual({
      customerId: "c1",
      customerName: "Customer"
    });
    const target: Record<string, unknown> = { customerId: "" };
    await expect(
      applyLastFormHeaderAsync(target, "saleOrder", scope)
    ).resolves.toEqual({ customerId: "c1", customerName: "Customer" });
    expect(target).toEqual({ customerId: "c1", customerName: "Customer" });

    await writeLastFormHeader("payment", { amount: 1 }, scope);
    state.data.set(lastFormKey("company-1", "user-1", "stocktake"), "invalid");
    await expect(readLastFormHeader("stocktake", scope)).resolves.toBeNull();
    state.failGet = true;
    await expect(readLastFormHeader("saleOrder", scope)).resolves.toBeNull();
    state.failGet = false;
    state.failSet = true;
    await expect(
      writeLastFormHeader("saleOrder", { customerId: "c2" }, scope)
    ).resolves.toBeUndefined();
    state.failSet = false;
    await expect(
      writeLastFormHeader("saleOrder", {}, scope)
    ).resolves.toBeUndefined();
    await expect(
      writeLastFormHeader("saleOrder", {}, undefined)
    ).resolves.toBeUndefined();
  });

  it("records a successful create and clears its draft", async () => {
    await recordSuccessfulCreate(
      "saleOrder",
      {
        customerId: "customer-1",
        customerName: "",
        providerId: "provider-1",
        providerName: "Provider",
        repoId: "repo-1",
        repoName: "",
        paymentId: "payment-1",
        paymentName: "Cash"
      },
      scope
    );
    expect(await listRecentEntities("customer", scope)).toEqual([
      expect.objectContaining({ uid: "customer-1", name: "customer-1" })
    ]);
    expect(await listRecentEntities("provider", scope)).toEqual([
      expect.objectContaining({ uid: "provider-1", name: "Provider" })
    ]);
    expect(await listRecentEntities("repo", scope)).toEqual([
      expect.objectContaining({ uid: "repo-1", name: "repo-1" })
    ]);
    expect(await listRecentEntities("payment", scope)).toEqual([
      expect.objectContaining({ uid: "payment-1", name: "Cash" })
    ]);
    expect(clearDraftMock).toHaveBeenCalledWith("saleOrder", scope);
  });

  it("clears one scope or every registered scope", async () => {
    await touchRecentEntity("customer", { uid: "a", name: "A" }, scope);
    await writeLastFormHeader("saleOrder", { customerId: "c1" }, scope);
    await clearRecentFormMemory(scope);
    expect(await listRecentEntities("customer", scope)).toEqual([]);
    expect(
      state.data.has(lastFormKey("company-1", "user-1", "saleOrder"))
    ).toBe(false);

    state.data.set("rfm:scopes", [
      "company-1:user-1",
      "company-2:user-2",
      "bad"
    ]);
    state.data.set(recentEntityKey("company-2", "user-2", "repo"), [
      { uid: "r", name: "Repo", at: 1 }
    ]);
    await clearRecentFormMemory({ allScopes: true });
    expect(state.data.has("rfm:scopes")).toBe(false);
    expect(state.data.has(recentEntityKey("company-2", "user-2", "repo"))).toBe(
      false
    );

    state.failGet = true;
    await expect(
      clearRecentFormMemory({ allScopes: true })
    ).resolves.toBeUndefined();
    await expect(clearRecentFormMemory(undefined)).resolves.toBeUndefined();
  });
});

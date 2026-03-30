import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeLogin, switchCompany } from "../auth-bootstrap.service";

const mocks = vi.hoisted(() => ({
  elMessageBox: vi.fn(),
  router: { currentRoute: { value: { path: "/login" } } },
  resetRouter: vi.fn(),
  addPathMatch: vi.fn(),
  getTopMenu: vi.fn<(tag?: boolean) => { path: string } | null>(() => ({
    path: "/dashboard"
  })),
  initRouter: vi.fn(),
  resolveSafeHomeRoute: vi.fn(() => ({ path: "/welcome" })),
  safeNavigate: vi.fn(),
  fetchAvailableCompanies: vi.fn(),
  fetchAvailableStores: vi.fn(),
  determineCurrentCompany: vi.fn(),
  determineCurrentStore: vi.fn(),
  handleTags: vi.fn(),
  toMultiTypeArray: vi.fn((value: unknown) => value),
  logOut: vi.fn(),
  message: vi.fn(),
  setToken: vi.fn()
}));

vi.mock("element-plus", () => ({
  ElMessageBox: mocks.elMessageBox,
  ElOption: {},
  ElSelect: {}
}));

vi.mock("@/router", () => ({
  router: mocks.router,
  resetRouter: mocks.resetRouter
}));

vi.mock("@/router/utils", () => ({
  addPathMatch: mocks.addPathMatch,
  getTopMenu: mocks.getTopMenu,
  initRouter: mocks.initRouter,
  resolveSafeHomeRoute: mocks.resolveSafeHomeRoute,
  safeNavigate: mocks.safeNavigate
}));

vi.mock("@/store/modules/company", () => ({
  useCurrentCompanyStoreHook: vi.fn(() => ({
    fetchAvailableCompanies: mocks.fetchAvailableCompanies,
    fetchAvailableStores: mocks.fetchAvailableStores,
    determineCurrentCompany: mocks.determineCurrentCompany,
    determineCurrentStore: mocks.determineCurrentStore,
    companyId: "",
    storeId: ""
  }))
}));

vi.mock("@/store/modules/multiTags", () => ({
  useMultiTagsStoreHook: vi.fn(() => ({
    handleTags: mocks.handleTags
  }))
}));

vi.mock("@/store/utils", () => ({
  routerArrays: [],
  toMultiTypeArray: mocks.toMultiTypeArray
}));

vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: vi.fn(() => ({
    logOut: mocks.logOut
  }))
}));

vi.mock("@/utils/message", () => ({
  message: mocks.message
}));

vi.mock("@/utils/auth", () => ({
  setToken: mocks.setToken
}));

describe("auth-bootstrap.service", () => {
  beforeEach(() => {
    mocks.elMessageBox.mockReset();
    mocks.resetRouter.mockReset();
    mocks.addPathMatch.mockReset();
    mocks.initRouter.mockReset();
    mocks.getTopMenu.mockReset();
    mocks.getTopMenu.mockReturnValue({ path: "/dashboard" });
    mocks.resolveSafeHomeRoute.mockReset();
    mocks.resolveSafeHomeRoute.mockReturnValue({ path: "/welcome" });
    mocks.safeNavigate.mockReset();
    mocks.safeNavigate.mockResolvedValue(true);
    mocks.fetchAvailableCompanies.mockReset();
    mocks.fetchAvailableStores.mockReset();
    mocks.determineCurrentCompany.mockReset();
    mocks.determineCurrentStore.mockReset();
    mocks.handleTags.mockReset();
    mocks.toMultiTypeArray.mockClear();
    mocks.logOut.mockReset();
    mocks.message.mockReset();
    mocks.setToken.mockReset();
  });

  it("completes login directly for a single-company account", async () => {
    mocks.fetchAvailableCompanies.mockResolvedValue([
      { uid: "company-1", name: "公司一" }
    ]);
    mocks.fetchAvailableStores.mockResolvedValue([
      { uid: "store-1", name: "门店一", defaultRepositoryId: "repo-1" }
    ]);

    await completeLogin({
      accessToken: "token",
      username: "alice",
      roles: ["admin"]
    });

    expect(mocks.setToken).toHaveBeenCalledWith({
      accessToken: "token",
      username: "alice",
      roles: ["admin"]
    });
    expect(mocks.fetchAvailableCompanies).toHaveBeenCalledTimes(1);
    expect(mocks.fetchAvailableStores).toHaveBeenCalledTimes(1);
    expect(mocks.determineCurrentCompany).not.toHaveBeenCalled();
    expect(mocks.determineCurrentStore).not.toHaveBeenCalled();
    expect(mocks.resetRouter).toHaveBeenCalledTimes(1);
    expect(mocks.initRouter).toHaveBeenCalledTimes(1);
    expect(mocks.addPathMatch).toHaveBeenCalledTimes(1);
    expect(mocks.safeNavigate).toHaveBeenCalledWith(
      mocks.router,
      "/dashboard",
      expect.objectContaining({
        replace: true,
        fallback: { path: "/welcome" }
      })
    );
  });

  it("requires explicit company selection for multi-company login", async () => {
    mocks.fetchAvailableCompanies.mockResolvedValue([
      { uid: "company-1", name: "公司一" },
      { uid: "company-2", name: "公司二" }
    ]);
    mocks.fetchAvailableStores.mockResolvedValue([
      { uid: "store-1", name: "门店一", defaultRepositoryId: "repo-1" }
    ]);
    mocks.elMessageBox.mockResolvedValue(undefined);

    await completeLogin({ accessToken: "token" });

    expect(mocks.elMessageBox).toHaveBeenCalledTimes(1);
    expect(mocks.determineCurrentCompany).toHaveBeenCalledWith("company-1");
    expect(mocks.fetchAvailableStores).toHaveBeenCalledTimes(1);
    expect(mocks.initRouter).toHaveBeenCalledTimes(1);
  });

  it("rebuilds route context when switching company", async () => {
    mocks.determineCurrentCompany.mockResolvedValue(undefined);
    mocks.fetchAvailableStores.mockResolvedValue([
      { uid: "store-1", name: "门店一", defaultRepositoryId: "repo-1" }
    ]);

    await switchCompany("company-2");

    expect(mocks.determineCurrentCompany).toHaveBeenCalledWith("company-2");
    expect(mocks.fetchAvailableStores).toHaveBeenCalledTimes(1);
    expect(mocks.resetRouter).toHaveBeenCalledTimes(1);
    expect(mocks.initRouter).toHaveBeenCalledTimes(1);
    expect(mocks.addPathMatch).toHaveBeenCalledTimes(1);
    expect(mocks.safeNavigate).toHaveBeenCalledWith(
      mocks.router,
      "/dashboard",
      expect.objectContaining({
        replace: true,
        fallback: { path: "/welcome" }
      })
    );
  });

  it("falls back to safe home when no top menu is available", async () => {
    mocks.fetchAvailableCompanies.mockResolvedValue([
      { uid: "company-1", name: "公司一" }
    ]);
    mocks.fetchAvailableStores.mockResolvedValue([
      { uid: "store-1", name: "门店一", defaultRepositoryId: "repo-1" }
    ]);
    mocks.getTopMenu.mockReturnValue(null);

    await completeLogin({ accessToken: "token" });

    expect(mocks.safeNavigate).toHaveBeenCalledWith(
      mocks.router,
      { path: "/welcome" },
      expect.objectContaining({
        replace: true,
        fallback: { path: "/welcome" }
      })
    );
  });
});

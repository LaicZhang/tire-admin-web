import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeLogin, switchCompany } from "../auth-bootstrap.service";

const mocks = vi.hoisted(() => ({
  elMessageBox: vi.fn(),
  router: { currentRoute: { value: { path: "/login" } } },
  resetRouter: vi.fn(),
  addPathMatch: vi.fn(),
  getTopMenu: vi.fn(() => ({ path: "/dashboard" })),
  initRouter: vi.fn(),
  resolveSafeHomeRoute: vi.fn(() => ({ path: "/welcome" })),
  safeNavigate: vi.fn(),
  fetchAvailableCompanies: vi.fn(),
  fetchAvailableStores: vi.fn(),
  determineCurrentCompany: vi.fn(),
  determineCurrentStore: vi.fn(),
  setCurrentCompany: vi.fn(),
  handleTags: vi.fn(),
  toMultiTypeArray: vi.fn((value: unknown) => value),
  logOut: vi.fn(),
  message: vi.fn(),
  setToken: vi.fn(),
  clearForCompanyChange: vi.fn(),
  clearAllCachePage: vi.fn(),
  companyId: "" as string,
  companyName: "" as string,
  storeId: "" as string
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
    setCurrentCompany: mocks.setCurrentCompany,
    get companyId() {
      return mocks.companyId;
    },
    get companyName() {
      return mocks.companyName;
    },
    get storeId() {
      return mocks.storeId;
    }
  }))
}));

vi.mock("@/store/modules/multiTags", () => ({
  useMultiTagsStoreHook: vi.fn(() => ({
    handleTags: mocks.handleTags
  }))
}));

vi.mock("@/store/modules/options", () => ({
  useOptionsStoreHook: vi.fn(() => ({
    clearForCompanyChange: mocks.clearForCompanyChange
  }))
}));

vi.mock("@/store/modules/permission", () => ({
  usePermissionStoreHook: vi.fn(() => ({
    clearAllCachePage: mocks.clearAllCachePage
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

describe("auth-bootstrap.service (W116 / W-MC3)", () => {
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
    mocks.setCurrentCompany.mockReset();
    mocks.handleTags.mockReset();
    mocks.toMultiTypeArray.mockClear();
    mocks.logOut.mockReset();
    mocks.message.mockReset();
    mocks.setToken.mockReset();
    mocks.clearForCompanyChange.mockReset();
    mocks.clearAllCachePage.mockReset();
    mocks.companyId = "";
    mocks.companyName = "";
    mocks.storeId = "";
  });

  it("completes login directly for a single-company account", async () => {
    mocks.fetchAvailableCompanies.mockResolvedValue([
      { uid: "company-1", name: "公司一" }
    ]);
    mocks.fetchAvailableStores.mockResolvedValue([
      { uid: "store-1", name: "门店一" }
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
    expect(mocks.elMessageBox).not.toHaveBeenCalled();
    expect(mocks.determineCurrentCompany).not.toHaveBeenCalled();
    expect(mocks.determineCurrentStore).not.toHaveBeenCalled();
    expect(mocks.clearForCompanyChange).toHaveBeenCalled();
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
      { uid: "store-1", name: "门店一" }
    ]);
    mocks.elMessageBox.mockResolvedValue(undefined);

    await completeLogin({ accessToken: "token" });

    expect(mocks.elMessageBox).toHaveBeenCalledTimes(1);
    expect(mocks.determineCurrentCompany).toHaveBeenCalledWith("company-1");
    expect(mocks.fetchAvailableStores).toHaveBeenCalledTimes(1);
    expect(mocks.initRouter).toHaveBeenCalledTimes(1);
  });

  it("still prompts when stored company is valid (stored is highlight only)", async () => {
    mocks.companyId = "company-2";
    mocks.fetchAvailableCompanies.mockResolvedValue([
      { uid: "company-1", name: "公司一" },
      { uid: "company-2", name: "公司二" }
    ]);
    mocks.fetchAvailableStores.mockResolvedValue([
      { uid: "store-1", name: "门店一" }
    ]);
    // promptSelectCompany uses companies[0] only if initial not in list;
    // with highlight company-2, ref starts at company-2; MessageBox resolve keeps it
    mocks.elMessageBox.mockImplementation(async () => undefined);

    await completeLogin({ accessToken: "token" });

    expect(mocks.elMessageBox).toHaveBeenCalledTimes(1);
    // must NOT silent-determine without prompt
    expect(mocks.determineCurrentCompany).toHaveBeenCalledTimes(1);
    expect(mocks.determineCurrentCompany).toHaveBeenCalledWith("company-2");
  });

  it("clears invalid stored company and forces reselect", async () => {
    mocks.companyId = "stale-company";
    mocks.fetchAvailableCompanies.mockResolvedValue([
      { uid: "company-1", name: "公司一" },
      { uid: "company-2", name: "公司二" }
    ]);
    mocks.fetchAvailableStores.mockResolvedValue([
      { uid: "store-1", name: "门店一" }
    ]);
    mocks.elMessageBox.mockResolvedValue(undefined);

    await completeLogin({ accessToken: "token" });

    expect(mocks.setCurrentCompany).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: "" })
    );
    expect(mocks.elMessageBox).toHaveBeenCalledTimes(1);
    expect(mocks.determineCurrentCompany).toHaveBeenCalledWith("company-1");
  });

  it("rebuilds route context and resets business stores when switching company", async () => {
    mocks.companyId = "company-1";
    mocks.companyName = "公司一";
    mocks.determineCurrentCompany.mockResolvedValue(undefined);
    mocks.fetchAvailableStores.mockResolvedValue([
      { uid: "store-1", name: "门店一" }
    ]);

    await switchCompany("company-2");

    expect(mocks.determineCurrentCompany).toHaveBeenCalledWith("company-2");
    expect(mocks.clearForCompanyChange).toHaveBeenCalled();
    expect(mocks.clearAllCachePage).toHaveBeenCalled();
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

  it("does not logout when switchCompany fails and shows rollback message", async () => {
    mocks.companyId = "company-1";
    mocks.companyName = "公司一";
    mocks.determineCurrentCompany.mockRejectedValue(new Error("not a member"));

    await expect(switchCompany("company-x")).rejects.toThrow("not a member");

    expect(mocks.message).toHaveBeenCalledWith(
      expect.stringContaining("已保留原公司「公司一」"),
      expect.objectContaining({ type: "error" })
    );
    expect(mocks.message).toHaveBeenCalledWith(
      expect.stringContaining("not a member"),
      expect.objectContaining({ type: "error" })
    );
    expect(mocks.logOut).not.toHaveBeenCalled();
    expect(mocks.initRouter).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  wholeMenus: [] as unknown[],
  handleTags: vi.fn()
}));

vi.mock("@/store/modules/permission", () => ({
  usePermissionStoreHook: vi.fn(() => ({
    get wholeMenus() {
      return mocks.wholeMenus;
    }
  }))
}));

vi.mock("@/store/modules/multiTags", () => ({
  useMultiTagsStoreHook: vi.fn(() => ({
    handleTags: mocks.handleTags
  }))
}));

import { getTopMenu } from "../finder";

describe("finder.getTopMenu", () => {
  beforeEach(() => {
    mocks.wholeMenus = [];
    mocks.handleTags.mockReset();
  });

  it("returns null when menus are empty", () => {
    expect(getTopMenu()).toBeNull();
  });

  it("returns the first top menu and pushes tag when requested", () => {
    mocks.wholeMenus = [
      {
        path: "/root",
        children: [
          {
            path: "/dashboard",
            name: "Dashboard",
            meta: { title: "首页" },
            children: [{ path: "/dashboard/home", name: "DashboardHome" }]
          }
        ]
      }
    ];

    expect(getTopMenu(true)).toMatchObject({
      path: "/dashboard",
      name: "Dashboard"
    });
    expect(mocks.handleTags).toHaveBeenCalledTimes(1);
  });
});

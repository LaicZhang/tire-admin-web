import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RouteRecordRaw } from "vue-router";

const mocks = vi.hoisted(() => ({
  addRoute: vi.fn(),
  hasRoute: vi.fn(),
  addPathMatch: vi.fn(),
  addAsyncRoutes: vi.fn(),
  createWebHistory: vi.fn((base: string) => ({ kind: "h5", base })),
  createWebHashHistory: vi.fn((base: string) => ({ kind: "hash", base })),
  permission: {
    flatteningRoutes: [] as RouteRecordRaw[],
    handleWholeMenus: vi.fn()
  },
  multiTags: {
    getMultiTagsCache: false,
    handleTags: vi.fn()
  },
  warn: vi.fn()
}));

vi.mock("vue-router", async importOriginal => {
  const actual = await importOriginal<typeof import("vue-router")>();
  return {
    ...actual,
    createWebHistory: mocks.createWebHistory,
    createWebHashHistory: mocks.createWebHashHistory
  };
});

vi.mock("../../index", () => ({
  router: {
    addRoute: mocks.addRoute,
    hasRoute: mocks.hasRoute
  }
}));

vi.mock("@/store/modules/permission", () => ({
  usePermissionStoreHook: () => mocks.permission
}));

vi.mock("@/store/modules/multiTags", () => ({
  useMultiTagsStoreHook: () => mocks.multiTags
}));

vi.mock("@/layout/types", () => ({
  routerArrays: [{ path: "/", name: "home", meta: { title: "首页" } }]
}));

vi.mock("@/store/utils", () => ({
  toMultiTypeArray: (value: unknown) => value
}));

vi.mock("@/utils/tree", () => ({
  buildHierarchyTree: (routes: Array<RouteRecordRaw & { parentId?: number }>) =>
    routes.filter(route => route.parentId == null)
}));

vi.mock("@/utils/logger", () => ({
  routerLogger: { warn: mocks.warn }
}));

import {
  addAsyncRoutes,
  addPathMatch,
  formatFlatteningRoutes,
  formatTwoStageRoutes,
  getHistoryMode,
  handleAsyncRoutes
} from "../dynamic";

const component = () => Promise.resolve({ default: {} });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.permission.flatteningRoutes = [];
  mocks.multiTags.getMultiTagsCache = false;
  mocks.hasRoute.mockReturnValue(false);
});

describe("dynamic route registration", () => {
  it("adds the path match route once", () => {
    addPathMatch();
    expect(mocks.addRoute).toHaveBeenCalledWith({
      path: "/:pathMatch(.*)",
      name: "pathMatch",
      redirect: "/error/404"
    });

    mocks.hasRoute.mockReturnValueOnce(true);
    addPathMatch();
    expect(mocks.addRoute).toHaveBeenCalledTimes(1);
  });

  it("updates menus for an empty route list and still registers the fallback", () => {
    handleAsyncRoutes([]);

    expect(mocks.permission.handleWholeMenus).toHaveBeenCalledWith([]);
    expect(mocks.multiTags.handleTags).toHaveBeenCalledWith("equal", [
      expect.objectContaining({ path: "/", name: "home" })
    ]);
    expect(mocks.addRoute).toHaveBeenCalledWith(
      expect.objectContaining({ name: "pathMatch" })
    );
  });

  it("registers only named, not-yet-registered routes and marks backstage routes", () => {
    const route = {
      path: "/system/updateHistory",
      name: "UpdateHistory",
      meta: { title: "更新历史" }
    } as RouteRecordRaw;

    handleAsyncRoutes([route]);

    expect(route.meta?.backstage).toBe(true);
    expect(mocks.addRoute).toHaveBeenCalledWith(route);
    expect(mocks.permission.handleWholeMenus).toHaveBeenCalledWith([route]);
  });

  it("does not overwrite tags when tag caching is enabled", () => {
    mocks.multiTags.getMultiTagsCache = true;
    handleAsyncRoutes([
      { path: "/system/updateHistory", name: "UpdateHistory" } as RouteRecordRaw
    ]);

    expect(mocks.multiTags.handleTags).not.toHaveBeenCalled();
  });
});

describe("route normalization", () => {
  it("returns empty inputs unchanged", () => {
    expect(formatFlatteningRoutes([])).toEqual([]);
    expect(formatTwoStageRoutes([])).toEqual([]);
    expect(
      addAsyncRoutes(undefined as unknown as RouteRecordRaw[])
    ).toBeUndefined();
  });

  it("flattens hierarchy children by one level", () => {
    const child = {
      path: "/child",
      name: "child",
      parentId: 1
    } as RouteRecordRaw & { parentId: number };
    const parent = {
      path: "/parent",
      name: "parent",
      children: [child]
    } as RouteRecordRaw;

    expect(formatFlatteningRoutes([parent, child])).toEqual([parent, child]);
  });

  it("keeps flat routes without a root and nests children below the root", () => {
    const route = { path: "/one", name: "one" } as RouteRecordRaw;
    expect(formatTwoStageRoutes([route])).toEqual([route]);

    const root = {
      path: "/",
      name: "root",
      component,
      redirect: "/home",
      meta: { title: "Root" }
    } as RouteRecordRaw;
    const result = formatTwoStageRoutes([root, route]);
    expect(result).toEqual([
      expect.objectContaining({
        path: "/",
        name: "root",
        component,
        redirect: "/home",
        children: [route]
      })
    ]);
  });

  it("normalizes nested dynamic routes and generates redirect/name", () => {
    const child = {
      path: "child",
      name: "Child",
      component: 'import("@/views/error/404.vue")'
    } as RouteRecordRaw;
    const parent = {
      path: "/dynamic",
      meta: { title: "Dynamic" },
      children: [child]
    } as RouteRecordRaw;

    addAsyncRoutes([parent]);

    expect(parent.meta?.backstage).toBe(true);
    expect(parent.redirect).toBe("child");
    expect(parent.name).toBe("ChildParent");
    expect(child.meta).toBeUndefined();
    expect(typeof child.component).toBe("function");
  });

  it("resolves frame, static, component-string and path-based components", () => {
    const frame = {
      path: "/frame",
      component: "frame-placeholder",
      meta: { frameSrc: "https://example.com" }
    } as RouteRecordRaw;
    const knownStatic = {
      path: "/auth",
      component: "static-placeholder"
    } as RouteRecordRaw;
    const byComponent = {
      path: "/custom",
      component: '() => import("views/system/updateHistory/index.vue")'
    } as RouteRecordRaw;
    const byPath = {
      path: "/system/updateHistory"
    } as RouteRecordRaw;

    addAsyncRoutes([frame, knownStatic, byComponent, byPath]);

    expect(typeof frame.component).toBe("function");
    expect(typeof knownStatic.component).toBe("function");
    expect(typeof byComponent.component).toBe("function");
    expect(typeof byPath.component).toBe("function");
  });

  it("uses the fallback and logs when no component can be resolved", () => {
    const missing = {
      path: "/missing-route",
      component: 42
    } as unknown as RouteRecordRaw;

    addAsyncRoutes([missing]);

    expect(typeof missing.component).toBe("function");
    expect(mocks.warn).toHaveBeenCalledWith(
      expect.stringContaining("/missing-route")
    );
  });
});

describe("history mode", () => {
  it.each([
    ["hash", { kind: "hash", base: "" }],
    ["h5", { kind: "h5", base: "" }],
    ["hash,/admin", { kind: "hash", base: "/admin" }],
    ["h5,/admin", { kind: "h5", base: "/admin" }],
    ["invalid", { kind: "hash", base: "" }],
    ["invalid,/admin", { kind: "hash", base: "" }]
  ])("maps %s to the expected history", (mode, expected) => {
    expect(getHistoryMode(mode)).toEqual(expected);
  });
});

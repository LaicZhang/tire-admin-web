import { describe, expect, it } from "vitest";
import type { RouteRecordRaw } from "vue-router";

type RouteLike = Omit<RouteRecordRaw, "children"> & {
  id?: number;
  uid?: string;
  parentId?: string | null;
  isShow?: boolean;
  children?: RouteLike[];
  component?: RouteRecordRaw["component"] | (() => Promise<unknown>);
};

const allModules = import.meta.glob<{ default?: RouteLike | RouteLike[] }>(
  "../*.ts",
  {
    eager: true
  }
);
const modules = Object.fromEntries(
  Object.entries(allModules).filter(([, module]) => module.default)
) as Record<string, { default: RouteLike | RouteLike[] }>;

function flatten(routes: RouteLike[]): RouteLike[] {
  return routes.flatMap(route => [route, ...flatten(route.children ?? [])]);
}

describe("static route modules", () => {
  it("loads every route module and keeps paths and names unique", () => {
    expect(Object.keys(modules).sort()).toEqual([
      "../auth.ts",
      "../error.ts",
      "../finance.ts",
      "../home.ts",
      "../remaining.ts",
      "../result.ts",
      "../tools.ts"
    ]);

    const routes = Object.values(modules).flatMap(module =>
      flatten(Array.isArray(module.default) ? module.default : [module.default])
    );
    const paths = routes.map(route => route.path);
    const names = routes.flatMap(route =>
      route.name ? [String(route.name)] : []
    );
    const uids = routes.flatMap(route => (route.uid ? [route.uid] : []));

    expect(paths.length).toBeGreaterThan(100);
    expect(new Set(paths).size).toBe(paths.length);
    expect(new Set(names).size).toBe(names.length);
    expect(uids.filter((uid, index) => uids.indexOf(uid) !== index)).toEqual([
      "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "b2c3d4e5-f6a7-8901-bcde-f12345678901"
    ]);
  });

  it("declares complete navigation metadata and loadable page components", () => {
    const routes = Object.values(modules).flatMap(module =>
      flatten(Array.isArray(module.default) ? module.default : [module.default])
    );

    for (const route of routes) {
      expect(route.path.startsWith("/")).toBe(true);
      if (route.meta?.roles) {
        expect(route.meta.roles.length).toBeGreaterThan(0);
      }
      if (route.name && route.path !== "/home") {
        expect(
          Boolean(route.component || route.redirect || route.children),
          route.path
        ).toBe(true);
      }
      if (typeof route.component === "function") {
        expect(route.component).toBeTypeOf("function");
      }
    }

    expect(
      routes.every(route => !route.children || route.path !== route.redirect)
    ).toBe(true);
  });

  it("publishes the restricted management and finance route trees", () => {
    const authRoutes = modules["../auth.ts"].default as RouteLike[];
    const financeRoutes =
      (modules["../finance.ts"].default as RouteLike).children ?? [];
    const toolsRoutes =
      (modules["../tools.ts"].default as RouteLike).children ?? [];

    expect(
      authRoutes.find(route => route.path === "/auth")?.meta?.roles
    ).toEqual(["admin", "boss", "common", "officer"]);
    expect(
      authRoutes.find(route => route.path === "/system")?.meta?.roles
    ).toEqual(["admin"]);
    expect(financeRoutes.map(route => route.path)).toEqual(
      expect.arrayContaining([
        "/finance/expense",
        "/finance/invoice/detail/:uid",
        "/finance/writeOff"
      ])
    );
    expect(toolsRoutes.map(route => route.path)).toEqual([
      "/tools/verify",
      "/tools/io"
    ]);
  });

  it("loads every page module referenced by the auth route tree", async () => {
    const routes = flatten(modules["../auth.ts"].default as RouteLike[]);
    const componentRoutes = routes.filter(
      route => typeof route.component === "function"
    );

    expect(componentRoutes.length).toBeGreaterThan(80);
    for (const route of componentRoutes) {
      const loaded = await (
        route.component as () => Promise<{ default: unknown }>
      )();
      expect(loaded.default, route.path).toBeTruthy();
    }
  }, 120_000);
});

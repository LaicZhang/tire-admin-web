import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const mocks = vi.hoisted(() => ({
  storage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  },
  config: { MaxTagsLevel: 4 },
  flatteningRoutes: [] as Array<Record<string, unknown>>
}));

vi.mock("@/store/utils", () => ({
  routerArrays: [
    {
      path: "/",
      name: "home",
      meta: { title: "首页", showLink: true },
      query: {},
      params: {}
    },
    { path: "/missing-name", meta: { title: "缺少名称" } }
  ],
  storageLocal: () => mocks.storage,
  responsiveStorageNameSpace: () => "test-",
  getConfig: () => mocks.config,
  isUrl: (value: unknown) =>
    typeof value === "string" && /^https?:/.test(value),
  isEqual: (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b),
  isNumber: (value: unknown) => typeof value === "number",
  isBoolean: (value: unknown) => typeof value === "boolean"
}));

vi.mock("../permission", () => ({
  usePermissionStoreHook: () => ({ flatteningRoutes: mocks.flatteningRoutes })
}));

import { useMultiTagsStore } from "../multiTags";

type Tag = {
  path: string;
  name: string;
  meta?: Record<string, unknown>;
  query?: unknown;
};

function tag(
  path: string,
  title = path,
  extra: Record<string, unknown> = {}
): Tag {
  return { path, name: path, meta: { title, ...extra } };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.storage.getItem.mockReturnValue(null);
  mocks.config.MaxTagsLevel = 4;
  mocks.flatteningRoutes = [];
  setActivePinia(createPinia());
});

describe("multi tags state", () => {
  it("builds default and fixed tags while ignoring malformed routes", () => {
    mocks.flatteningRoutes = [
      {
        path: "/fixed",
        name: "fixed",
        meta: { fixedTag: true, title: "固定", icon: 2 }
      },
      { name: "missing-path", meta: { fixedTag: true } },
      { path: "/not-fixed", name: "not-fixed", meta: {} }
    ];

    const store = useMultiTagsStore();

    expect(store.multiTags).toEqual([
      expect.objectContaining({ path: "/", name: "home" }),
      expect.objectContaining({ path: "/fixed", name: "fixed" })
    ]);
    expect(store.multiTags[1].meta).toEqual({ title: "固定", icon: undefined });
  });

  it("restores cached tags only when caching is enabled", () => {
    mocks.storage.getItem.mockImplementation((key: string) => {
      if (key === "test-configure") return { multiTagsCache: true };
      if (key === "test-tags") return [tag("/cached")];
      return null;
    });

    const store = useMultiTagsStore();
    expect(store.multiTags).toEqual([tag("/cached")]);
    expect(store.getMultiTagsCache).toBe(true);
  });

  it("ignores a non-array cache", () => {
    mocks.storage.getItem.mockImplementation((key: string) =>
      key === "test-configure" ? { multiTagsCache: true } : { broken: true }
    );

    expect(useMultiTagsStore().multiTags[0].path).toBe("/");
  });

  it("persists or removes cached tags when the setting changes", () => {
    const store = useMultiTagsStore();
    store.multiTags = [tag("/one")];

    store.multiTagsCacheChange(true);
    expect(mocks.storage.setItem).toHaveBeenCalledWith(
      "test-tags",
      store.multiTags
    );

    store.multiTagsCacheChange(false);
    expect(mocks.storage.removeItem).toHaveBeenCalledWith("test-tags");
  });

  it("only caches tags while caching is enabled", () => {
    const store = useMultiTagsStore();
    store.tagsCache([tag("/one")]);
    expect(mocks.storage.setItem).not.toHaveBeenCalled();

    store.multiTagsCache = true;
    store.tagsCache([tag("/two")]);
    expect(mocks.storage.setItem).toHaveBeenCalledWith("test-tags", [
      tag("/two")
    ]);
  });
});

describe("handleTags", () => {
  it("replaces all tags with equal and ignores non-array values", () => {
    const store = useMultiTagsStore();
    store.handleTags("equal", [tag("/one")]);
    expect(store.multiTags).toEqual([tag("/one")]);

    store.handleTags("equal", "bad" as never);
    expect(store.multiTags).toEqual([]);
  });

  it.each([
    ["hidden tag", tag("/hidden", "隐藏", { hiddenTag: true })],
    ["external url", { path: "/external", name: "https://example.com" }],
    ["empty title", tag("/empty", "")],
    ["hidden link", tag("/hidden-link", "隐藏链接", { showLink: false })]
  ])("skips %s", (_label, value) => {
    const store = useMultiTagsStore();
    const before = store.multiTags.length;
    store.handleTags("push", value as Tag);
    expect(store.multiTags).toHaveLength(before);
  });

  it("skips exact duplicates including query and params", () => {
    const store = useMultiTagsStore();
    const value = {
      ...tag("/same", "相同"),
      query: { page: 1 },
      params: { id: 2 }
    };
    store.handleTags("push", value);
    store.handleTags("push", { ...value });
    expect(store.multiTags.filter(item => item.path === "/same")).toHaveLength(
      1
    );
  });

  it("replaces the oldest dynamic tag at dynamicLevel and trims the oldest after max", () => {
    const store = useMultiTagsStore();
    store.multiTags = [tag("/"), tag("/dynamic", "一")];
    store.handleTags("push", {
      ...tag("/dynamic", "二"),
      query: { id: 2 },
      meta: { title: "二", dynamicLevel: 1 }
    } as Tag);

    expect(store.multiTags.map(item => item.meta?.title)).toEqual(["/", "二"]);

    store.multiTags = [tag("/"), tag("/a"), tag("/b"), tag("/c")];
    store.handleTags("push", tag("/d", "D"));
    expect(store.multiTags.map(item => item.path)).toEqual([
      "/",
      "/b",
      "/c",
      "/d"
    ]);
  });

  it("ignores an invalid max tag setting", () => {
    mocks.config.MaxTagsLevel = Number.NaN;
    const store = useMultiTagsStore();
    store.handleTags("push", tag("/one", "一"));
    store.handleTags("push", tag("/two", "二"));
    expect(store.multiTags).toHaveLength(3);
  });

  it("removes by path, by position and returns undefined for invalid splices", () => {
    const store = useMultiTagsStore();
    store.multiTags = [tag("/"), tag("/a"), tag("/b")];

    expect(store.handleTags("splice", 1 as never)).toBeUndefined();
    expect(store.handleTags("splice", "/missing")).toBeUndefined();
    expect(store.handleTags("splice", "/a")).toEqual([tag("/"), tag("/b")]);
    expect(store.handleTags("splice", undefined, { startIndex: 1 })).toEqual([
      tag("/")
    ]);
  });
});

describe("slice and unknown modes", () => {
  it("returns the final tag and undefined for unknown modes", () => {
    const store = useMultiTagsStore();
    store.multiTags = [tag("/"), tag("/last")];
    expect(store.handleTags("slice")).toEqual([tag("/last")]);
    expect(store.handleTags("unknown")).toBeUndefined();
  });
});

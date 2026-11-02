import { flushPromises, shallowMount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import SearchModal from "../SearchModal.vue";

const mocks = vi.hoisted(() => {
  const storage = new Map<string, unknown>();
  return {
    storage,
    getDocument: vi.fn(),
    match: vi.fn((text: string, key: string) =>
      text.includes(key) ? [key] : []
    )
  };
});

vi.mock("pinyin-pro", () => ({ match: mocks.match }));
vi.mock("@/config", () => ({
  getConfig: () => ({ MenuSearchHistory: 3 })
}));
vi.mock("@/layout/hooks/useNav", () => ({
  useNav: () => ({ device: "desktop" })
}));
vi.mock("@/api/document-center", () => ({
  getDocumentByNoApi: mocks.getDocument
}));
vi.mock("@pureadmin/utils", async importOriginal => {
  const actual = await importOriginal<typeof import("@pureadmin/utils")>();
  return {
    ...actual,
    storageLocal: () => ({
      getItem: (key: string) => mocks.storage.get(key),
      setItem: (key: string, value: unknown) => mocks.storage.set(key, value),
      removeItem: (key: string) => mocks.storage.delete(key)
    })
  };
});

const menus = vi.hoisted(() => ({
  current: [] as Array<Record<string, any>>
}));
vi.mock("@/store/modules/permission", () => ({
  usePermissionStoreHook: () => ({ wholeMenus: menus.current })
}));

function menu(
  path: string,
  title: string,
  children?: Array<Record<string, any>>
) {
  return { path, type: "history", meta: { title }, children };
}

async function mountModal() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: { template: "<div />" } },
      { path: "/:pathMatch(.*)*", component: { template: "<div />" } }
    ]
  });
  await router.push("/");
  await router.isReady();
  const wrapper = shallowMount(SearchModal, {
    props: { value: true },
    global: {
      plugins: [router],
      stubs: {
        ElDialog: { template: "<div><slot /><slot name='footer' /></div>" },
        ElInput: {
          template: "<input />",
          methods: { focus: vi.fn(), blur: vi.fn() }
        },
        ElScrollbar: {
          template: "<div><slot /></div>",
          methods: { setScrollTop: vi.fn() }
        },
        ElEmpty: true,
        SearchHistory: true,
        SearchResult: true,
        SearchFooter: true,
        IconifyIconOffline: true
      }
    }
  });
  await flushPromises();
  return { wrapper, router };
}

function stateOf(wrapper: Awaited<ReturnType<typeof mountModal>>["wrapper"]) {
  return wrapper.vm.$.setupState as Record<string, any>;
}

describe("SearchModal behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.storage.clear();
    menus.current = [
      menu("/sales", "销售", [
        menu("/sales/order", "销售订单"),
        menu("/sales/quote", "Sales Quotation")
      ]),
      menu("/fund", "资金")
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("flattens menu trees and maps every document category", async () => {
    const { wrapper } = await mountModal();
    const state = stateOf(wrapper);
    try {
      expect(state.flatTree(menus.current).map(item => item.path)).toEqual([
        "/sales",
        "/sales/order",
        "/sales/quote",
        "/fund"
      ]);
      expect(state.documentListPath("SALE_ORDER")).toBe("/sales/documents");
      expect(state.documentListPath("COMMISSION")).toBe("/sales/documents");
      expect(state.documentListPath("SPECIAL_PRICE")).toBe("/sales/documents");
      expect(state.documentListPath("PURCHASE_ORDER")).toBe(
        "/purchase/documents"
      );
      expect(state.documentListPath("SUPPLIER_CLAIM")).toBe(
        "/purchase/documents"
      );
      expect(state.documentListPath("SUPPLIER_PROMOTION")).toBe(
        "/purchase/documents"
      );
      expect(state.documentListPath("INVENTORY_CHECK")).toBe(
        "/inventory/documents"
      );
      expect(state.documentListPath("STOCKTAKING")).toBe(
        "/inventory/documents"
      );
      expect(state.documentListPath("OTHER_INBOUND")).toBe(
        "/inventory/documents"
      );
      expect(state.documentListPath("OTHER_OUTBOUND")).toBe(
        "/inventory/documents"
      );
      expect(state.documentListPath("ASSEMBLY")).toBe("/inventory/documents");
      expect(state.documentListPath("DISASSEMBLY")).toBe(
        "/inventory/documents"
      );
      expect(state.documentListPath("COST_ADJUST")).toBe(
        "/inventory/documents"
      );
      expect(state.documentListPath("RECEIPT")).toBe("/fund/documents");
      expect(
        state.mapDocumentHit({ type: "SALE_ORDER", billNo: "SO 1", uid: "u/1" })
      ).toMatchObject({
        path: "/sales/documents?keyword=SO%201&uid=u%2F1",
        meta: { title: "[单据] SALE_ORDER SO 1" }
      });
    } finally {
      wrapper.unmount();
    }
  });

  it("searches menu titles and document numbers by exact length rules", async () => {
    const { wrapper } = await mountModal();
    const state = stateOf(wrapper);
    try {
      state.keyword = "销售";
      await state.search();
      expect(state.resultOptions.map(item => item.path)).toEqual([
        "/sales",
        "/sales/order"
      ]);
      expect(mocks.getDocument).not.toHaveBeenCalled();

      state.keyword = "Quotation";
      await state.search();
      expect(state.resultOptions.map(item => item.path)).toEqual([
        "/sales/quote"
      ]);
      expect(mocks.match).toHaveBeenCalledWith("销售", "quotation");

      state.keyword = "SO-1";
      mocks.getDocument.mockResolvedValueOnce({
        data: [{ type: "SALE_ORDER", billNo: "SO-1", uid: "uid-1" }]
      });
      await state.search();
      expect(mocks.getDocument).toHaveBeenCalledWith("SO-1");
      expect(state.documentOptions[0].path).toContain("keyword=SO-1");
      expect(state.activePath).toBe(state.documentOptions[0].path);

      mocks.getDocument.mockResolvedValueOnce({});
      await state.search();
      expect(state.documentOptions).toEqual([]);
      mocks.getDocument.mockResolvedValueOnce({ data: "invalid" });
      await state.search();
      expect(state.documentOptions).toEqual([]);
      mocks.getDocument.mockRejectedValueOnce(new Error("offline"));
      await state.search();
      expect(state.documentOptions).toEqual([]);

      state.keyword = "a".repeat(101);
      await state.search();
      expect(mocks.getDocument).toHaveBeenCalledTimes(5);
    } finally {
      wrapper.unmount();
    }
  });

  it("loads, deletes, collects and de-duplicates history records", async () => {
    mocks.storage.set("menu-search-history", [
      menu("/old", "旧记录"),
      menu("/same", "重复")
    ]);
    mocks.storage.set("menu-search-collect", [menu("/favorite", "收藏")]);
    const { wrapper } = await mountModal();
    const state = stateOf(wrapper);
    try {
      state.getHistory();
      expect(state.historyOptions).toHaveLength(3);
      expect(state.historyPath).toBe("/old");

      state.handleDelete(menu("/old", "旧记录"));
      expect(mocks.storage.get("menu-search-history")).toHaveLength(1);

      state.handleDelete({ ...menu("/favorite", "收藏"), type: "collect" });
      expect(mocks.storage.get("menu-search-collect")).toHaveLength(0);

      state.handleCollect({
        path: "/same",
        type: "history",
        meta: { title: "重复" }
      });
      expect(mocks.storage.get("menu-search-history")).toHaveLength(0);
      expect(mocks.storage.get("menu-search-collect")).toHaveLength(1);

      state.handleCollect({
        path: "/same",
        type: "history",
        meta: { title: "重复" }
      });
      expect(mocks.storage.get("menu-search-collect")).toHaveLength(1);
    } finally {
      wrapper.unmount();
    }
  });

  it("saves new history once, updates duplicates and respects the limit", async () => {
    const { wrapper } = await mountModal();
    const state = stateOf(wrapper);
    try {
      state.resultOptions = [menu("/one", "一"), menu("/two", "二")];
      state.activePath = "/missing";
      state.saveHistory();
      expect(mocks.storage.get("menu-search-history")).toBeUndefined();

      mocks.storage.set("menu-search-collect", [menu("/one", "一")]);
      state.activePath = "/one";
      state.saveHistory();
      expect(mocks.storage.get("menu-search-history")).toBeUndefined();

      mocks.storage.set("menu-search-collect", []);
      mocks.storage.set("menu-search-history", [
        menu("/a", "A"),
        menu("/b", "B"),
        menu("/c", "C")
      ]);
      state.activePath = "/two";
      state.saveHistory();
      expect(mocks.storage.get("menu-search-history")).toEqual([
        menu("/two", "二"),
        menu("/a", "A"),
        menu("/b", "B")
      ]);

      state.resultOptions = [...state.resultOptions, menu("/b", "B")];
      state.activePath = "/b";
      state.saveHistory();
      expect(mocks.storage.get("menu-search-history")[0]).toMatchObject({
        path: "/b"
      });

      mocks.storage.set("menu-search-history", [menu("/z", "Z")]);
      state.historyPath = "/z";
      state.updateHistory();
      expect(mocks.storage.get("menu-search-history")[0].path).toBe("/z");
      state.historyPath = "/absent";
      state.updateHistory();
      expect(mocks.storage.get("menu-search-history")).toHaveLength(1);
    } finally {
      wrapper.unmount();
    }
  });

  it("navigates results and history with keyboard paths", async () => {
    const { wrapper, router } = await mountModal();
    const state = stateOf(wrapper);
    const resultHandle = vi.fn((index: number) => index + 5);
    const historyHandle = vi.fn((index: number) => index + 9);
    state.resultRef = { handleScroll: resultHandle };
    state.historyRef = { handleScroll: historyHandle };
    state.scrollbarRef = { setScrollTop: vi.fn() };
    try {
      state.handleUp();
      state.handleDown();
      state.handleEnter();
      expect(resultHandle).not.toHaveBeenCalled();

      state.resultOptions = [menu("/one", "一"), menu("/two", "二")];
      state.activePath = "/one";
      state.handleUp();
      expect(state.activePath).toBe("/two");
      expect(state.scrollbarRef.setScrollTop).toHaveBeenLastCalledWith(6);
      state.handleDown();
      expect(state.activePath).toBe("/one");
      expect(state.scrollbarRef.setScrollTop).toHaveBeenLastCalledWith(5);

      state.historyOptions = [menu("/h1", "H1"), menu("/h2", "H2")];
      mocks.storage.set("menu-search-history", state.historyOptions);
      state.historyPath = "/h1";
      state.resultOptions = [];
      state.handleUp();
      expect(state.historyPath).toBe("/h2");
      expect(state.scrollbarRef.setScrollTop).toHaveBeenLastCalledWith(10);

      state.activePath = "/missing";
      state.handleEnter();
      await flushPromises();
      expect(mocks.storage.get("menu-search-history")[0].path).toBe("/h2");

      state.historyPath = "/h1";
      state.handleEnter();
      await flushPromises();
      expect(mocks.storage.get("menu-search-history")[0].path).toBe("/h1");
      expect(wrapper.emitted("update:value")?.at(-1)).toEqual([false]);
    } finally {
      wrapper.unmount();
    }
  });

  it("saves selected result, closes and clears state after delay", async () => {
    vi.useFakeTimers();
    const { wrapper, router } = await mountModal();
    const state = stateOf(wrapper);
    try {
      state.keyword = "销售订单";
      state.resultOptions = [menu("/sales/order", "销售订单")];
      state.activePath = "/sales/order";
      state.handleEnter();
      await flushPromises();
      expect(mocks.storage.get("menu-search-history")[0].path).toBe(
        "/sales/order"
      );
      expect(router.currentRoute.value.path).toBe("/sales/order");
      expect(wrapper.emitted("update:value")?.at(-1)).toEqual([false]);

      state.documentOptions = [menu("/doc", "单据")];
      state.historyPath = "/history";
      state.keyword = "销售订单";
      state.handleClose();
      expect(wrapper.emitted("update:value")?.at(-1)).toEqual([false]);
      vi.advanceTimersByTime(200);
      await flushPromises();
      expect(state.resultOptions).toEqual([]);
      expect(state.documentOptions).toEqual([]);
      expect(state.keyword).toBe("");
      expect(state.historyPath).toBe("");
    } finally {
      wrapper.unmount();
    }
  });

  it("reorders collections and derives empty/history/result visibility", async () => {
    const { wrapper } = await mountModal();
    const state = stateOf(wrapper);
    try {
      mocks.storage.set("menu-search-history", []);
      mocks.storage.set("menu-search-collect", [
        menu("/a", "A"),
        menu("/b", "B")
      ]);
      state.handleDrag({ oldIndex: 0, newIndex: 1 });
      expect(
        mocks.storage.get("menu-search-collect").map((item: any) => item.path)
      ).toEqual(["/b", "/a"]);
      expect(state.historyPath).toBe("/a");

      state.keyword = "";
      state.historyOptions = [];
      expect(state.showEmpty).toBe(true);
      expect(state.showSearchHistory).toBe(false);
      state.historyOptions = [menu("/h", "H")];
      expect(state.showEmpty).toBeFalsy();
      expect(state.showSearchHistory).toBe(true);
      state.keyword = "x";
      expect(state.showEmpty).toBe(true);
      state.resultOptions = [menu("/r", "R")];
      expect(state.showEmpty).toBe(false);
      expect(state.showSearchResult).toBeTruthy();
      state.resultOptions = [];
      state.documentOptions = [menu("/d", "D")];
      expect(state.showEmpty).toBe(false);
      expect(state.showSearchResult).toBeTruthy();
    } finally {
      wrapper.unmount();
    }
  });
});

// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCrud } from "../useCrud";
import { nextTick, defineComponent, createApp, h } from "vue";

function withSetup<T>(composable: () => T) {
  let result: T;
  const Comp = defineComponent({
    setup() {
      result = composable();
      return () => h("div");
    }
  });
  const app = createApp(Comp);
  const container = document.createElement("div");
  app.mount(container);

  return {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    result: result!,
    app,
    unmount: () => app.unmount()
  };
}

describe("useCrud", () => {
  const mockApi = vi.fn();
  const mockDeleteApi = vi.fn();

  beforeEach(() => {
    mockApi.mockReset();
    mockDeleteApi.mockReset();
  });

  it("should initialize correctly", () => {
    const { result } = withSetup(() =>
      useCrud({ api: mockApi, immediate: false })
    );
    const { loading, dataList, pagination } = result;

    expect(loading.value).toBe(false);
    expect(dataList.value).toEqual([]);
    expect(pagination.value.currentPage).toBe(1);
    expect(pagination.value.pageSize).toBe(10);
    expect(pagination.value.total).toBe(0);
  });

  it("should fetch data successfully", async () => {
    const mockData = { list: [{ id: 1, name: "test" }], total: 1 };
    mockApi.mockResolvedValue(mockData);

    const { result } = withSetup(() =>
      useCrud({ api: mockApi, immediate: false })
    );
    const { fetchData, dataList, pagination, loading } = result;

    const promise = fetchData();
    expect(loading.value).toBe(true);

    await promise;

    expect(loading.value).toBe(false);
    expect(dataList.value).toEqual(mockData.list);
    expect(pagination.value.total).toBe(1);
  });

  it("should fetch data with custom transform", async () => {
    const mockData = { items: [{ id: 1, name: "test" }], count: 1 };
    mockApi.mockResolvedValue(mockData);

    const { result } = withSetup(() =>
      useCrud({
        api: mockApi,
        immediate: false,
        transform: (res: { items: Array<{ id: number }>; count: number }) => ({
          list: res.items,
          total: res.count
        })
      })
    );
    const { fetchData, dataList, pagination } = result;

    await fetchData();

    expect(dataList.value).toEqual(mockData.items);
    expect(pagination.value.total).toBe(1);
  });

  it("should handle pagination changes", async () => {
    mockApi.mockResolvedValue({ list: [], total: 0 });
    const { result } = withSetup(() =>
      useCrud({ api: mockApi, immediate: false })
    );
    const { onCurrentChange, onSizeChange, pagination } = result;

    // Change page
    onCurrentChange(2);
    await nextTick();
    // Watcher triggers fetch
    expect(pagination.value.currentPage).toBe(2);
    expect(mockApi).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));

    mockApi.mockClear();

    // Change size
    onSizeChange(20);
    await nextTick();
    expect(pagination.value.pageSize).toBe(20);
    expect(pagination.value.currentPage).toBe(1);
    expect(mockApi).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 20, page: 1 })
    );
  });

  it("should handle delete", async () => {
    mockApi.mockResolvedValue({ list: [], total: 0 });
    mockDeleteApi.mockResolvedValue({ success: true });

    const { result } = withSetup(() =>
      useCrud({
        api: mockApi,
        deleteApi: mockDeleteApi,
        immediate: false
      })
    );
    const { handleDelete } = result;

    await handleDelete(1);

    expect(mockDeleteApi).toHaveBeenCalledWith(1);
    expect(mockApi).toHaveBeenCalled();
  });

  it("should abort previous request", async () => {
    let resolveFirst: Function;
    mockApi.mockImplementationOnce(() => new Promise(r => (resolveFirst = r)));
    mockApi.mockResolvedValueOnce({ list: [{ id: 2 }], total: 1 });

    const { result } = withSetup(() =>
      useCrud({ api: mockApi, immediate: false })
    );
    const { fetchData, dataList } = result;

    const p1 = fetchData();
    const p2 = fetchData();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    resolveFirst!({ list: [{ id: 1 }], total: 1 });

    await p1;
    await p2;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect((dataList.value[0] as { id: number })!.id).toBe(2);
  });

  it("should cleanup abortController on unmount", () => {
    // Mock AbortController
    const abortSpy = vi.fn();
    const OriginalController = global.AbortController;

    // Inject spy into the global scope or mock it if we can
    // But useCrud uses `new AbortController()`.
    // We can spy on the instance prototype?
    // Or replace global.AbortController

    global.AbortController = class extends OriginalController {
      abort() {
        abortSpy();
        super.abort();
      }
    } as typeof global.AbortController;

    const { result, unmount } = withSetup(() =>
      useCrud({ api: mockApi, immediate: false })
    );
    const { fetchData } = result;

    fetchData(); // Create a controller

    unmount();

    expect(abortSpy).toHaveBeenCalled();

    global.AbortController = OriginalController;
  });

  it("should handle fetchData error", async () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockApi.mockRejectedValue(new Error("Network error"));

    const { result } = withSetup(() =>
      useCrud({ api: mockApi, immediate: false })
    );

    const { fetchData, dataList } = result;

    await fetchData();

    expect(dataList.value).toEqual([]);

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should handle handleDelete error", async () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockDeleteApi.mockRejectedValue(new Error("Delete failed"));

    const { result } = withSetup(() =>
      useCrud({
        api: mockApi,

        deleteApi: mockDeleteApi,

        immediate: false
      })
    );

    const { handleDelete } = result;

    await handleDelete(1);

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should not error on unmount if no request pending", () => {
    const { unmount } = withSetup(() =>
      useCrud({ api: mockApi, immediate: false })
    );

    // No fetchData called

    unmount();

    // Should pass without error
  });
});

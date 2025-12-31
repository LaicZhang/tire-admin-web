// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCrud } from "../../src/hooks/useCrud";
import { flushPromises, mount } from "@vue/test-utils";
import { nextTick, defineComponent } from "vue";

// Helper to run composable within a Vue component context
function withSetup<T>(composable: () => T) {
  let result!: T;
  const wrapper = mount(
    defineComponent({
      setup() {
        result = composable();
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => {};
      }
    })
  );
  return { result, wrapper };
}

describe("useCrud", () => {
  const mockApi = vi.fn();
  const mockDeleteApi = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = withSetup(() =>
      useCrud({
        api: mockApi,
        immediate: false
      })
    );
    const { loading, dataList, pagination } = result;

    expect(loading.value).toBe(false);
    expect(dataList.value).toEqual([]);
    expect(pagination.value.currentPage).toBe(1);
    expect(pagination.value.pageSize).toBe(10);
    expect(pagination.value.total).toBe(0);
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("should fetch data successfully with immediate: true", async () => {
    const mockData = { list: [{ id: 1, name: "Test" }], total: 1 };
    mockApi.mockResolvedValue(mockData);

    const { result } = withSetup(() =>
      useCrud({
        api: mockApi,
        immediate: true
      })
    );
    const { loading, dataList, pagination } = result;

    expect(loading.value).toBe(true);
    await flushPromises();

    expect(loading.value).toBe(false);
    expect(dataList.value).toEqual(mockData.list);
    expect(pagination.value.total).toBe(1);
  });

  it("should handle API returning array directly", async () => {
    const mockData = [{ id: 1 }, { id: 2 }];
    mockApi.mockResolvedValue(mockData);

    const { result } = withSetup(() =>
      useCrud({
        api: mockApi,
        immediate: false
      })
    );
    const { dataList, pagination, fetchData } = result;

    await fetchData();

    expect(dataList.value).toEqual(mockData);
    expect(pagination.value.total).toBe(2);
  });

  it("should handle API returning { data: { list: [], total: 0 } } structure", async () => {
    const mockData = { data: { list: [{ id: 1 }], total: 5 } };
    mockApi.mockResolvedValue(mockData);

    const { result } = withSetup(() =>
      useCrud({
        api: mockApi,
        immediate: false
      })
    );
    const { dataList, pagination, fetchData } = result;

    await fetchData();

    expect(dataList.value).toEqual(mockData.data.list);
    expect(pagination.value.total).toBe(5);
  });

  it("should handle API returning { data: [] } structure", async () => {
    const mockData = { data: [{ id: 1 }, { id: 2 }] };
    mockApi.mockResolvedValue(mockData);

    const { result } = withSetup(() =>
      useCrud({
        api: mockApi,
        immediate: false
      })
    );
    const { dataList, pagination, fetchData } = result;

    await fetchData();

    expect(dataList.value).toEqual(mockData.data);
    expect(pagination.value.total).toBe(2);
  });

  it("should handle fetch errors gracefully", async () => {
    mockApi.mockRejectedValue(new Error("Network Error"));
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = withSetup(() =>
      useCrud({
        api: mockApi,
        immediate: false
      })
    );
    const { loading, dataList, fetchData } = result;

    await fetchData();

    expect(loading.value).toBe(false);
    expect(dataList.value).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should re-fetch when pagination changes via helpers", async () => {
    mockApi.mockResolvedValue({ list: [], total: 0 });
    const { result } = withSetup(() =>
      useCrud({
        api: mockApi,
        immediate: false
      })
    );
    const { pagination, onCurrentChange, onSizeChange } = result;

    // Change page
    onCurrentChange(2);
    await nextTick();
    await flushPromises();

    expect(mockApi).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    expect(pagination.value.currentPage).toBe(2);

    // Change size
    onSizeChange(20);
    await nextTick();
    await flushPromises();

    expect(mockApi).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 20, page: 1 })
    );
    expect(pagination.value.pageSize).toBe(20);
    expect(pagination.value.currentPage).toBe(1);
  });

  it("should transform response data", async () => {
    const rawData = { data: [{ id: 1, val: "raw" }], count: 10 };
    mockApi.mockResolvedValue(rawData);

    const transform = vi.fn(
      (res: { data: Array<{ id: number; val: string }>; count: number }) => ({
        list: res.data.map(i => ({ ...i, val: "transformed" })),
        total: res.count
      })
    );

    const { result } = withSetup(() =>
      useCrud({
        api: mockApi,
        immediate: false,
        transform
      })
    );
    const { dataList, pagination, fetchData } = result;

    await fetchData();

    expect(transform).toHaveBeenCalledWith(rawData);
    expect(dataList.value[0].val).toBe("transformed");
    expect(pagination.value.total).toBe(10);
  });

  it("should cancel concurrent requests", async () => {
    let resolveFirst:
      | ((value: { list: string[]; total: number }) => void)
      | undefined;
    const firstPromise = new Promise<{ list: string[]; total: number }>(
      resolve => {
        resolveFirst = resolve;
      }
    );

    let resolveSecond:
      | ((value: { list: string[]; total: number }) => void)
      | undefined;
    const secondPromise = new Promise<{ list: string[]; total: number }>(
      resolve => {
        resolveSecond = resolve;
      }
    );

    mockApi.mockReturnValueOnce(firstPromise);
    mockApi.mockReturnValueOnce(secondPromise);

    const { result } = withSetup(() =>
      useCrud({
        api: mockApi,
        immediate: false
      })
    );
    const { fetchData, dataList } = result;

    // Start first request
    const p1 = fetchData();
    expect(dataList.value).toEqual([]);

    // Start second request immediately
    const p2 = fetchData();

    // Resolve first request
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    resolveFirst!({ list: ["first"], total: 1 });
    await p1;

    // First request should be ignored
    expect(dataList.value).toEqual([]);

    // Resolve second request
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    resolveSecond!({ list: ["second"], total: 1 });
    await p2;

    // Second request should succeed
    expect(dataList.value).toEqual(["second"]);
  });

  it("should abort request on unmount", async () => {
    let resolveRequest:
      | ((value: { list: string[]; total: number }) => void)
      | undefined;
    const requestPromise = new Promise<{ list: string[]; total: number }>(
      resolve => {
        resolveRequest = resolve;
      }
    );
    mockApi.mockReturnValue(requestPromise);

    const { result, wrapper } = withSetup(() =>
      useCrud({
        api: mockApi,
        immediate: false
      })
    );
    const { fetchData, dataList } = result;

    const p = fetchData();

    // Unmount the component
    wrapper.unmount();

    // Resolve the request after unmount
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    resolveRequest!({ list: ["test"], total: 1 });
    await p;

    // Logic: AbortController.abort() is called on unmount.
    // However, the catch block in fetchData ignores AbortError.
    // If aborted, the code `if (myController.signal.aborted) return;` prevents state update.
    // BUT since we resolve AFTER unmount, the `await api` completes.
    // We need to ensure that the abort signal was triggered effectively.
    // Since we mocked api, we can't easily check if it "threw" AbortError unless we mock implementation to listen to signal.
    // But we can check if dataList remained empty.

    // If AbortController was triggered, `myController.signal.aborted` should be true.
    expect(dataList.value).toEqual([]);
  });

  it("should handle delete operation", async () => {
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

    await handleDelete(123);

    expect(mockDeleteApi).toHaveBeenCalledWith(123);
    // Should re-fetch after delete
    expect(mockApi).toHaveBeenCalled();
  });

  it("should handle delete error", async () => {
    mockDeleteApi.mockRejectedValue(new Error("Delete Failed"));
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = withSetup(() =>
      useCrud({
        api: mockApi,
        deleteApi: mockDeleteApi,
        immediate: false
      })
    );
    const { handleDelete } = result;

    await handleDelete(123);

    expect(consoleSpy).toHaveBeenCalled();
    // Should NOT re-fetch if delete fails
    expect(mockApi).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should ignore AbortError in fetchData", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    mockApi.mockRejectedValue(abortError);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = withSetup(() =>
      useCrud({
        api: mockApi,
        immediate: false
      })
    );
    const { loading, fetchData } = result;

    await fetchData();

    expect(loading.value).toBe(false);
    // Should NOT log error for AbortError
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should do nothing in handleDelete if deleteApi is not provided", async () => {
    const { result } = withSetup(() =>
      useCrud({
        api: mockApi,
        immediate: false
      })
    );
    const { handleDelete } = result;

    await handleDelete(123);

    expect(mockDeleteApi).not.toHaveBeenCalled();
    expect(mockApi).not.toHaveBeenCalled();
  });
});

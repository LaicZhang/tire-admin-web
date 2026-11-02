import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { useFormState, usePageState } from "../usePageState";

const { messageMock } = vi.hoisted(() => ({ messageMock: vi.fn() }));

vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: messageMock
}));

function mountState<T>(factory: () => T) {
  return mount(
    defineComponent({
      setup() {
        return factory();
      },
      render: () => h("div")
    })
  );
}

describe("usePageState", () => {
  beforeEach(() => {
    messageMock.mockClear();
  });

  it("loads the first page immediately and exposes pagination state", async () => {
    const api = vi.fn().mockResolvedValue({
      code: 200,
      data: { total: 12, list: [{ uid: "one", name: "A" }] }
    });
    const wrapper = mountState(() =>
      usePageState({
        api,
        initialParams: { keyword: "tire" },
        initialPageSize: 20
      })
    );
    await nextTick();
    await Promise.resolve();

    expect(api).toHaveBeenCalledWith(1, 20, { keyword: "tire" });
    expect(wrapper.vm.dataList).toEqual([{ uid: "one", name: "A" }]);
    expect(wrapper.vm.pagination.total).toBe(12);
    expect(wrapper.vm.total).toBe(12);
    expect(wrapper.vm.hasData).toBe(true);
    expect(wrapper.vm.loading).toBe(false);
  });

  it("supports immediate false, transforms, search, reset and pagination changes", async () => {
    const api = vi
      .fn()
      .mockResolvedValueOnce({
        code: 200,
        data: { total: 2, list: [{ uid: "a" }] }
      })
      .mockResolvedValueOnce({
        code: 200,
        data: { total: 3, list: [{ uid: "b" }] }
      })
      .mockResolvedValueOnce({ code: 200, data: { total: 4, list: [] } });
    const wrapper = mountState(() =>
      usePageState<{ uid: string; display?: string }>({
        api,
        immediate: false,
        initialParams: { keyword: "start" },
        transform: rows => rows.map(row => ({ ...row, display: row.uid })),
        initialPageSize: 10
      })
    );

    await wrapper.vm.search({ keyword: "next" });
    expect(api).toHaveBeenLastCalledWith(1, 10, { keyword: "next" });
    expect(wrapper.vm.dataList).toEqual([{ uid: "a", display: "a" }]);

    await wrapper.vm.handleCurrentChange(3);
    expect(api).toHaveBeenLastCalledWith(3, 10, { keyword: "next" });
    expect(wrapper.vm.pagination.currentPage).toBe(3);

    await wrapper.vm.handleSizeChange(50);
    expect(api).toHaveBeenLastCalledWith(1, 50, { keyword: "next" });
    expect(wrapper.vm.pagination.currentPage).toBe(1);
    expect(wrapper.vm.hasData).toBe(false);

    wrapper.vm.setQueryParams({ keyword: "manual" });
    wrapper.vm.setPagination({ total: 99, currentPage: 2 });
    await wrapper.vm.refresh();
    expect(api).toHaveBeenLastCalledWith(2, 50, { keyword: "manual" });

    await wrapper.vm.resetSearch();
    expect(api).toHaveBeenLastCalledWith(1, 50, { keyword: "start" });
  });

  it("reports envelope failures and rejected requests without leaving loading on", async () => {
    const api = vi
      .fn()
      .mockResolvedValueOnce({ code: 500, msg: "boom", data: { list: [] } })
      .mockRejectedValueOnce(new Error("network"));
    const wrapper = mountState(() => usePageState({ api, immediate: false }));

    await wrapper.vm.fetchData(2);
    expect(messageMock).toHaveBeenCalledWith("boom", { type: "error" });
    expect(wrapper.vm.loading).toBe(false);

    await wrapper.vm.fetchData();
    expect(messageMock).toHaveBeenCalledWith("获取数据失败", { type: "error" });
    expect(wrapper.vm.loading).toBe(false);
  });

  it("deletes and restores rows with a valid uid", async () => {
    const api = vi.fn().mockResolvedValue({
      code: 200,
      data: { total: 1, list: [{ uid: "row-1" }] }
    });
    const deleteApi = vi.fn().mockResolvedValue({ code: 200 });
    const restoreApi = vi.fn().mockResolvedValue({ code: 200 });
    const wrapper = mountState(() =>
      usePageState({
        api,
        deleteApi,
        restoreApi,
        enableRestore: true,
        immediate: false
      })
    );

    await wrapper.vm.handleDelete({ uid: "row-1" });
    expect(deleteApi).toHaveBeenCalledWith("row-1");
    expect(messageMock).toHaveBeenCalledWith("删除成功", { type: "success" });
    expect(api).toHaveBeenCalled();

    await wrapper.vm.handleRestore?.({ uid: "row-1" });
    expect(restoreApi).toHaveBeenCalledWith("row-1");
    expect(messageMock).toHaveBeenCalledWith("恢复成功", { type: "success" });
  });

  it("guards missing APIs, missing uids and delete failures", async () => {
    const api = vi
      .fn()
      .mockResolvedValue({ code: 200, data: { total: 0, list: [] } });
    const withoutActions = mountState(() =>
      usePageState({ api, immediate: false })
    );
    await withoutActions.vm.handleDelete({ uid: "row-1" });
    expect(withoutActions.vm.handleRestore).toBeUndefined();

    const deleteApi = vi.fn().mockRejectedValue(new Error("denied"));
    const restoreApi = vi.fn().mockRejectedValue(new Error("denied"));
    const withActions = mountState(() =>
      usePageState({
        api,
        deleteApi,
        restoreApi,
        enableRestore: true,
        immediate: false
      })
    );
    await withActions.vm.handleDelete({ name: "no uid" });
    await withActions.vm.handleDelete({ uid: "fail" });
    await withActions.vm.handleRestore?.({ name: "no uid" });
    await withActions.vm.handleRestore?.({ uid: "fail" });
    expect(deleteApi).toHaveBeenCalledWith("fail");
    expect(restoreApi).toHaveBeenCalledWith("fail");
    expect(messageMock).toHaveBeenCalledWith("删除失败", { type: "error" });
    expect(messageMock).toHaveBeenCalledWith("恢复失败", { type: "error" });
  });
});

describe("useFormState", () => {
  it("runs submit hooks and resets state", async () => {
    const afterSubmit = vi.fn();
    const state = useFormState<{ name: string; count: number }>({
      initialValues: { name: "before", count: 1 },
      beforeSubmit: data => ({ ...data, name: data.name.toUpperCase() }),
      afterSubmit
    });
    const submitFn = vi.fn(async data => ({ id: 1, data }));
    const result = await state.submit(submitFn);

    expect(submitFn).toHaveBeenCalledWith({ name: "BEFORE", count: 1 });
    expect(afterSubmit).toHaveBeenCalledWith(result);
    expect(state.loading.value).toBe(false);
    state.setFieldValue("count", 5);
    expect(state.getFormData()).toEqual({ name: "before", count: 5 });
    expect(await state.validate()).toBe(true);
    state.reset();
    expect(state.formData.value).toEqual({ name: "before", count: 1 });
  });

  it("reports errors and still unlocks loading", async () => {
    const error = new Error("save failed");
    const onSubmitError = vi.fn();
    const state = useFormState({ onSubmitError });
    await expect(state.submit(async () => Promise.reject(error))).rejects.toBe(
      error
    );
    expect(onSubmitError).toHaveBeenCalledWith(error);
    expect(state.loading.value).toBe(false);
  });
});

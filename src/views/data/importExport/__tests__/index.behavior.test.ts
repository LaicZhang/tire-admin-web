import { flushPromises } from "@vue/test-utils";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  message: vi.fn(),
  downloadTemplate: vi.fn(),
  export: vi.fn(),
  schema: vi.fn(),
  import: vi.fn(),
  downloadBlob: vi.fn(),
  downloadUrl: vi.fn(),
  filename: vi.fn(() => "generated.xlsx")
}));

vi.mock("@/api/tools", () => ({
  downloadImportTemplateApi: mocks.downloadTemplate,
  exportDataApi: mocks.export,
  getExportSchemaApi: mocks.schema,
  importDataApi: mocks.import
}));
vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: mocks.message
}));
vi.mock("@/utils/download", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils/download")>()),
  downloadBlob: mocks.downloadBlob,
  downloadFromUrl: mocks.downloadUrl,
  generateFilenameWithTimestamp: mocks.filename
}));

import ImportExport from "../index.vue";

async function mountPage() {
  const wrapper = await mountSmokeComponent(
    async () => ({ default: ImportExport }),
    "data/importExport/index.vue",
    { keepMounted: true }
  );
  await flushPromises();
  return wrapper;
}

type Wrapper = Awaited<ReturnType<typeof mountPage>>;
const state = (wrapper: Wrapper) =>
  wrapper.vm.$.setupState as Record<string, any>;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.schema.mockResolvedValue({
    code: 200,
    data: {
      fields: [
        { key: "required", label: "必填", required: true },
        { key: "default", label: "默认", defaultSelected: true },
        { key: "optional", label: "可选" }
      ]
    }
  });
  mocks.downloadTemplate.mockResolvedValue(new Blob(["template"]));
  mocks.import.mockResolvedValue({ code: 200, data: { total: 2, success: 2 } });
  mocks.export.mockResolvedValue(new Blob(["export"]));
  mocks.downloadUrl.mockResolvedValue(undefined);
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("import export workspace behavior", () => {
  it("maps every supported module and rejects an unknown module", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    const expected = {
      tire: "tire",
      customer: "customer",
      provider: "provider",
      repo: "repo",
      employee: "employee",
      initialStock: "stock-init",
      customerBalance: "customer-balance",
      supplierBalance: "supplier-balance"
    };
    for (const [module, type] of Object.entries(expected)) {
      expect(vm.resolveToolType(module)).toBe(type);
    }
    expect(() => vm.resolveToolType("missing")).toThrow("无效的导入导出模块");
    wrapper.unmount();
  });

  it("loads schema defaults, handles every field combination and skips blank modules", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    await flushPromises();
    expect(mocks.schema).toHaveBeenCalledWith("tire");
    expect(vm.exportFields).toEqual([
      { key: "required", label: "必填", selected: true, required: true },
      { key: "default", label: "默认", selected: true, required: undefined },
      {
        key: "optional",
        label: "可选",
        selected: undefined,
        required: undefined
      }
    ]);
    expect(vm.allSelected).toBeFalsy();
    expect(vm.someSelected).toBe(true);

    await vm.loadExportSchema("");
    expect(mocks.schema).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it("reports schema failures with server text and fallbacks, clearing stale fields", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    await flushPromises();
    mocks.schema.mockResolvedValueOnce({ code: 500, msg: "server schema" });
    await vm.loadExportSchema("customer");
    expect(mocks.message).toHaveBeenCalledWith("server schema", {
      type: "error"
    });
    expect(vm.exportFields).toEqual([]);

    mocks.schema.mockResolvedValueOnce({ code: 500, data: null });
    await vm.loadExportSchema("provider");
    expect(mocks.message).toHaveBeenCalledWith("获取导出字段失败", {
      type: "error"
    });

    mocks.schema.mockRejectedValueOnce(new Error("network"));
    await vm.loadExportSchema("repo");
    expect(mocks.message).toHaveBeenLastCalledWith("获取导出字段失败", {
      type: "error"
    });
    expect(vm.exportFields).toEqual([]);
    wrapper.unmount();
  });

  it("downloads a template with the mapped tool name", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.selectedModule = "initialStock";
    await vm.handleDownloadTemplate();
    expect(mocks.downloadTemplate).toHaveBeenCalledWith("stock-init");
    expect(mocks.downloadBlob).toHaveBeenCalledWith(
      expect.any(Blob),
      "stock-init_import_template.xlsx",
      { showMessage: true }
    );

    mocks.downloadTemplate.mockRejectedValueOnce(new Error("template"));
    await vm.handleDownloadTemplate();
    expect(mocks.message).toHaveBeenLastCalledWith("模板下载失败", {
      type: "error"
    });

    vm.selectedModule = "missing";
    await vm.handleDownloadTemplate();
    expect(mocks.message).toHaveBeenLastCalledWith("模板下载失败", {
      type: "error"
    });
    wrapper.unmount();
  });

  it("validates upload extension and size through the shared Excel validator", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    expect(
      vm.beforeUpload(
        new File(["x"], "good.xlsx", {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        })
      )
    ).toBe(true);
    expect(
      vm.beforeUpload(new File(["x"], "bad.txt", { type: "text/plain" }))
    ).toBe(false);
    expect(
      vm.beforeUpload(
        new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.xlsx", {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        })
      )
    ).toBe(false);
    wrapper.unmount();
  });

  it("imports a successful file, forwards progress and persists a task", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    await flushPromises();
    const onProgress = vi.fn();
    const onSuccess = vi.fn();
    await vm.handleUpload({
      file: new File(["row"], "rows.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }),
      method: "POST",
      action: "/upload",
      onProgress,
      onSuccess
    });
    expect(mocks.import).toHaveBeenCalledWith(
      "tire",
      expect.any(FormData),
      expect.any(Function)
    );
    const progress = mocks.import.mock.calls[0][2];
    progress(45);
    expect(onProgress).toHaveBeenCalledWith({ percent: 45 });
    expect(onSuccess).toHaveBeenCalledWith({ total: 2, success: 2 });
    expect(vm.taskList[0]).toMatchObject({
      type: "import",
      module: "tire",
      fileName: "rows.xlsx",
      status: "success",
      totalRows: 2,
      successRows: 2
    });
    expect(mocks.message).toHaveBeenCalledWith("导入成功：2条", {
      type: "success"
    });
    wrapper.unmount();
  });

  it("persists partial import failures with fallback counts and warning", async () => {
    mocks.import.mockResolvedValueOnce({ code: 200, data: {} });
    const wrapper = await mountPage();
    const vm = state(wrapper);
    await vm.handleUpload({
      file: new File(["row"], "partial.xlsx"),
      onSuccess: vi.fn()
    });
    expect(vm.taskList[0].status).toBe("success");
    expect(mocks.message).toHaveBeenCalledWith("导入成功：0条", {
      type: "success"
    });

    mocks.import.mockResolvedValueOnce({
      code: 200,
      data: { total: 3, success: 1, failed: 2 }
    });
    await vm.handleUpload({
      file: new File(["row"], "failed.xlsx"),
      onSuccess: vi.fn()
    });
    expect(vm.taskList[0].status).toBe("failed");
    expect(mocks.message).toHaveBeenLastCalledWith(
      "导入完成：成功1条，失败2条",
      { type: "warning" }
    );
    wrapper.unmount();
  });

  it("converts import envelopes and exceptions into upload errors", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    const onError = vi.fn();
    mocks.import.mockResolvedValueOnce({ code: 422, msg: "" });
    await vm.handleUpload({
      file: new File(["x"], "a.xlsx"),
      method: "POST",
      action: "/a",
      onError
    });
    expect(mocks.message).toHaveBeenLastCalledWith("导入失败", {
      type: "error"
    });
    expect(onError.mock.calls[0][0]).toMatchObject({
      name: "UploadAjaxError",
      message: "导入失败",
      status: 0,
      method: "POST",
      url: "/a"
    });

    const error = Object.assign(new Error("network down"), {
      name: "UploadAjaxError",
      status: 503,
      method: "PUT",
      url: "/existing"
    });
    mocks.import.mockRejectedValueOnce(error);
    await vm.handleUpload({
      file: new File(["x"], "a.xlsx"),
      method: "POST",
      action: "/a",
      onError
    });
    expect(mocks.message).toHaveBeenLastCalledWith("network down", {
      type: "error"
    });
    expect(onError.mock.calls[1][0]).toMatchObject({
      status: 503,
      method: "PUT",
      url: "/existing"
    });

    mocks.import.mockRejectedValueOnce("plain failure");
    await vm.handleUpload({ file: new File(["x"], "a.xlsx"), onError });
    expect(mocks.message).toHaveBeenLastCalledWith("导入失败", {
      type: "error"
    });
    expect(onError.mock.calls[2][0].message).toBe("plain failure");
    wrapper.unmount();
  });

  it("requires selected export fields and exports the mapped module", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    await flushPromises();
    vm.exportFields = [
      { key: "required", label: "必填", selected: true, required: true },
      { key: "optional", label: "可选", selected: false }
    ];
    vm.handleSelectAll(false);
    expect(vm.exportFields.map((field: any) => field.selected)).toEqual([
      true,
      false
    ]);
    vm.handleToggleField(vm.exportFields[0], false);
    vm.handleToggleField(vm.exportFields[1], true);
    expect(vm.exportFields.map((field: any) => field.selected)).toEqual([
      true,
      true
    ]);

    vm.exportModule = "customerBalance";
    vm.handleExport();
    await flushPromises();
    expect(mocks.export).toHaveBeenCalledWith("customer-balance", {
      fields: ["required", "optional"]
    });
    expect(mocks.downloadBlob).toHaveBeenCalledWith(
      expect.any(Blob),
      "generated.xlsx",
      { showMessage: true }
    );
    expect(vm.taskList[0]).toMatchObject({
      type: "export",
      module: "customerBalance",
      fileName: "generated.xlsx"
    });
    expect(mocks.filename).toHaveBeenCalledWith(
      "customer-balance_export",
      "xlsx"
    );
    wrapper.unmount();
  });

  it("handles empty selection, export failure and unknown export modules", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    await flushPromises();
    vm.exportFields = [{ key: "a", label: "A", selected: false }];
    vm.handleExport();
    expect(mocks.message).toHaveBeenCalledWith("请至少选择一个导出字段", {
      type: "warning"
    });
    expect(mocks.export).not.toHaveBeenCalled();

    vm.exportFields = [{ key: "a", label: "A", selected: true }];
    mocks.export.mockRejectedValueOnce(new Error("export"));
    vm.handleExport();
    await flushPromises();
    expect(mocks.message).toHaveBeenLastCalledWith("导出失败", {
      type: "error"
    });
    expect(vm.loading).toBe(false);

    vm.exportModule = "missing";
    expect(() => vm.handleExport()).toThrow("无效的导入导出模块");
    wrapper.unmount();
  });

  it("downloads task files with fallbacks and warns for missing URLs", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.handleDownload({ downloadUrl: "", fileName: "x", module: "tire" });
    expect(mocks.message).toHaveBeenCalledWith("该任务无可下载文件", {
      type: "warning"
    });
    vm.handleDownload({
      downloadUrl: "/a",
      fileName: "named.xlsx",
      module: "tire"
    });
    vm.handleDownload({ downloadUrl: "/b", fileName: "", module: "customer" });
    expect(mocks.downloadUrl).toHaveBeenNthCalledWith(1, "/a", "named.xlsx");
    expect(mocks.downloadUrl).toHaveBeenNthCalledWith(2, "/b", "customer.xlsx");

    mocks.downloadUrl.mockRejectedValueOnce(new Error("download"));
    vm.handleDownload({
      downloadUrl: "/c",
      fileName: "c.xlsx",
      module: "tire"
    });
    await flushPromises();
    wrapper.unmount();
  });

  it("updates and deletes persisted tasks and refreshes the list with loading settled", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    await flushPromises();
    const task = {
      id: 7,
      uid: "task-7",
      type: "export",
      module: "tire",
      fileName: "x.xlsx",
      status: "success",
      createdAt: vm.nowText(),
      completedAt: vm.nowText()
    };
    localStorage.setItem("data:import-export:tasks", JSON.stringify([task]));
    const getTaskList = vi.spyOn(vm, "getTaskList");
    await vm.handleDelete(task);
    expect(vm.taskList).toEqual([]);
    expect(mocks.message).toHaveBeenCalledWith("删除任务7成功", {
      type: "success"
    });

    vm.loading = true;
    vm.getTaskList();
    expect(getTaskList).toHaveBeenCalled();
    expect(vm.loading).toBe(false);
    expect(vm.taskList).toEqual([]);
    wrapper.unmount();
  });

  it("renders task history branches for imports, processing, completed and download states", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    await flushPromises();
    vm.taskList = [
      {
        id: 1,
        uid: "a",
        type: "import",
        module: "tire",
        fileName: "a",
        status: "processing",
        createdAt: "",
        totalRows: 10,
        successRows: 5
      },
      {
        id: 2,
        uid: "b",
        type: "export",
        module: "tire",
        fileName: "b",
        status: "failed",
        createdAt: "",
        totalRows: 4,
        successRows: 3,
        failedRows: 1,
        downloadUrl: "/b"
      },
      {
        id: 3,
        uid: "c",
        type: "import",
        module: "tire",
        fileName: "c",
        status: "success",
        createdAt: ""
      }
    ];
    await flushPromises();
    expect(wrapper.html()).toContain('status="processing"');
    expect(wrapper.html()).toContain('percentage="50"');
    expect(wrapper.html()).toContain("3/4");
    expect(wrapper.html()).toContain("失败1");
    expect(wrapper.html()).toContain("下载");
    expect(wrapper.html()).toContain("-");
    wrapper.unmount();
  });
});

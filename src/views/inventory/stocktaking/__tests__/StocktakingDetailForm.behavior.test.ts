import { flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";
import StocktakingDetailForm from "../StocktakingDetailForm.vue";
import { StocktakingStatus, type StocktakingTask } from "../types";

const mocks = vi.hoisted(() => ({
  addDialog: vi.fn(),
  confirm: vi.fn(),
  downloadBlob: vi.fn(),
  exportSystem: vi.fn(),
  exportResult: vi.fn(),
  getTask: vi.fn(),
  importDetails: vi.fn(),
  saveTask: vi.fn(),
  updateDetails: vi.fn(),
  message: vi.fn(),
  handleApiError: vi.fn(),
  filename: vi.fn((name: string, ext: string) => `${name}.${ext}`)
}));

vi.mock("@/api/business/inventory-check", () => ({
  exportInventoryCheckResultApi: mocks.exportResult,
  exportInventoryCheckSystemStockApi: mocks.exportSystem,
  getInventoryCheckTaskApi: mocks.getTask,
  importInventoryCheckDetailsApi: mocks.importDetails,
  saveInventoryCheckTaskApi: mocks.saveTask,
  updateInventoryCheckDetailsApi: mocks.updateDetails
}));
vi.mock("@/composables/useDialogService", () => ({
  addDialog: mocks.addDialog
}));
vi.mock("@/utils/download", () => ({
  downloadBlob: mocks.downloadBlob,
  generateFilenameWithTimestamp: mocks.filename
}));
vi.mock("@/utils", async importOriginal => {
  const actual = await importOriginal<typeof import("@/utils")>();
  return {
    ...actual,
    handleApiError: mocks.handleApiError,
    message: mocks.message
  };
});
vi.mock("element-plus", async importOriginal => {
  const actual = await importOriginal<typeof import("element-plus")>();
  return {
    ...actual,
    ElMessageBox: { ...actual.ElMessageBox, confirm: mocks.confirm }
  };
});

function task(overrides: Partial<StocktakingTask> = {}): StocktakingTask {
  return {
    id: 12,
    uid: "task-12",
    companyId: "company-1",
    repoId: "repo-1",
    status: StocktakingStatus.IN_PROGRESS,
    mode: "quantity",
    startedAt: "2026-01-01",
    createdBy: "user-1",
    createdAt: "2026-01-01",
    ...overrides
  };
}

function detail(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    taskId: 12,
    tireId: "tire-1",
    tireName: "Tire 1",
    bookCount: 2,
    ...overrides
  };
}

async function mountForm(taskValue: StocktakingTask | null) {
  return mountSmokeComponent(
    async () => ({ default: StocktakingDetailForm }),
    "../inventory/stocktaking/StocktakingDetailForm.vue",
    {
      keepMounted: true,
      fillSlots: true,
      props: { formInline: { task: taskValue } }
    }
  );
}

describe("stocktaking detail form behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTask.mockResolvedValue({
      code: 200,
      data: { details: [detail()] }
    });
    mocks.saveTask.mockResolvedValue({ code: 200 });
    mocks.exportSystem.mockResolvedValue(new Blob(["system"]));
    mocks.exportResult.mockResolvedValue(new Blob(["result"]));
    mocks.importDetails.mockResolvedValue({ code: 200 });
    mocks.updateDetails.mockResolvedValue({ code: 200 });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("loads details for active tasks and ignores null tasks", async () => {
    const active = await mountForm(task());
    try {
      await flushPromises();
      expect(mocks.getTask).toHaveBeenCalledWith(12);
      expect(active.vm.$.setupState.detailList).toEqual([detail()]);
      expect(active.findAll(".reset-margin")).toHaveLength(0);
    } finally {
      active.unmount();
    }

    const empty = await mountForm(null);
    try {
      expect(empty.vm.$.setupState.detailList).toEqual([]);
      expect(mocks.getTask).toHaveBeenCalledTimes(1);
      await empty.vm.$.setupState.loadDetails();
      expect(mocks.getTask).toHaveBeenCalledTimes(1);
    } finally {
      empty.unmount();
    }
  });

  it("keeps a loading state and handles detail load failures", async () => {
    mocks.getTask.mockRejectedValueOnce(new Error("offline"));
    const wrapper = await mountForm(task());
    try {
      await flushPromises();
      expect(mocks.handleApiError).toHaveBeenCalledWith(
        expect.any(Error),
        "获取盘点明细失败"
      );
      expect(wrapper.vm.$.setupState.detailLoading).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });

  it("handles save and both export success and failure paths", async () => {
    const wrapper = await mountForm(task());
    const state = wrapper.vm.$.setupState as Record<string, any>;
    try {
      await state.handleSave();
      expect(mocks.saveTask).toHaveBeenCalledWith(12);
      expect(mocks.message).toHaveBeenCalledWith("盘点结果已保存", {
        type: "success"
      });

      await state.handleExportSystemStock();
      expect(mocks.exportSystem).toHaveBeenCalledWith(12);
      expect(mocks.downloadBlob).toHaveBeenCalledWith(
        expect.any(Blob),
        "inventory-check-system-12.xlsx",
        { showMessage: true }
      );

      await state.handleExportResult();
      expect(mocks.exportResult).toHaveBeenCalledWith(12);
      expect(mocks.downloadBlob).toHaveBeenLastCalledWith(
        expect.any(Blob),
        "inventory-check-result-12.xlsx",
        { showMessage: true }
      );

      mocks.saveTask.mockRejectedValueOnce(new Error("save"));
      mocks.exportSystem.mockRejectedValueOnce(new Error("system"));
      mocks.exportResult.mockRejectedValueOnce(new Error("result"));
      await state.handleSave();
      await state.handleExportSystemStock();
      await state.handleExportResult();
      expect(mocks.handleApiError).toHaveBeenCalledWith(
        expect.any(Error),
        "保存盘点结果失败"
      );
      expect(mocks.handleApiError).toHaveBeenCalledWith(
        expect.any(Error),
        "导出系统库存失败"
      );
      expect(mocks.handleApiError).toHaveBeenCalledWith(
        expect.any(Error),
        "导出盘点结果失败"
      );

      await wrapper.setProps({ formInline: { task: null } });
      await state.handleSave();
      await state.handleExportSystemStock();
      await state.handleExportResult();
      expect(mocks.saveTask).toHaveBeenCalledTimes(2);
    } finally {
      wrapper.unmount();
    }
  });

  it("chooses replace or accumulate import modes and ignores close", async () => {
    const wrapper = await mountForm(task());
    const state = wrapper.vm.$.setupState as Record<string, any>;
    const input = wrapper.find("input[type=file]");
    try {
      const click = vi.spyOn(input.element as HTMLInputElement, "click");
      mocks.confirm.mockResolvedValueOnce("confirm");
      await state.handleImportClick();
      expect(click).toHaveBeenCalled();
      expect(input.attributes("data-mode")).toBe("replace");

      mocks.confirm.mockRejectedValueOnce("cancel");
      await state.handleImportClick();
      expect(input.attributes("data-mode")).toBe("accumulate");

      mocks.confirm.mockRejectedValueOnce("close");
      await state.handleImportClick();
      expect(mocks.handleApiError).not.toHaveBeenCalled();

      mocks.confirm.mockRejectedValueOnce(new Error("dialog"));
      await state.handleImportClick();
      expect(mocks.handleApiError).toHaveBeenCalledWith(
        expect.any(Error),
        "选择导入模式失败"
      );

      await wrapper.setProps({ formInline: { task: null } });
      await state.handleImportClick();
      expect(mocks.confirm).toHaveBeenCalledTimes(4);
    } finally {
      wrapper.unmount();
    }
  });

  it("imports selected files with explicit and default modes", async () => {
    const wrapper = await mountForm(task());
    const state = wrapper.vm.$.setupState as Record<string, any>;
    try {
      const input = wrapper.find("input[type=file]");
      const element = input.element as HTMLInputElement;
      Object.defineProperty(element, "files", {
        configurable: true,
        value: [new File(["replace"], "replace.xlsx")]
      });
      element.setAttribute("data-mode", "accumulate");
      await state.handleFileChange({ target: element });
      expect(mocks.importDetails).toHaveBeenCalledWith(
        12,
        expect.any(File),
        "accumulate"
      );
      expect(mocks.message).toHaveBeenCalledWith("累加导入成功", {
        type: "success"
      });
      expect(element.value).toBe("");
      expect(element.hasAttribute("data-mode")).toBe(false);

      element.setAttribute("data-mode", "replace");
      await state.handleFileChange({ target: element });
      expect(mocks.message).toHaveBeenCalledWith("覆盖导入成功", {
        type: "success"
      });

      element.removeAttribute("data-mode");
      await state.handleFileChange({ target: element });
      expect(mocks.importDetails).toHaveBeenLastCalledWith(
        12,
        expect.any(File),
        "replace"
      );

      Object.defineProperty(element, "files", {
        configurable: true,
        value: []
      });
      await state.handleFileChange({ target: element });
      expect(mocks.importDetails).toHaveBeenCalledTimes(3);

      Object.defineProperty(element, "files", {
        configurable: true,
        value: [new File(["bad"], "bad.xlsx")]
      });
      mocks.importDetails.mockRejectedValueOnce(new Error("import"));
      await state.handleFileChange({ target: element });
      expect(mocks.handleApiError).toHaveBeenCalledWith(
        expect.any(Error),
        "导入盘点库存失败"
      );

      await wrapper.setProps({ formInline: { task: null } });
      await state.handleFileChange({ target: element });
      expect(mocks.importDetails).toHaveBeenCalledTimes(4);
    } finally {
      wrapper.unmount();
    }
  });

  it("opens the editor and only updates after a valid form", async () => {
    const wrapper = await mountForm(
      task({ status: StocktakingStatus.IN_PROGRESS })
    );
    const state = wrapper.vm.$.setupState as Record<string, any>;
    const row = detail();
    try {
      await state.handleUpdateDetail(row);
      const options = mocks.addDialog.mock.calls[0][0];
      expect(options).toMatchObject({
        title: "更新盘点明细",
        width: "640px",
        closeOnClickModal: false,
        props: { detail: row, mode: "quantity" }
      });
      expect(options.contentRenderer({ options }).type).toBeTruthy();

      const done = vi.fn();
      state.detailEditorRef = null;
      await options.beforeSure(done);
      expect(mocks.updateDetails).not.toHaveBeenCalled();

      const validate = vi.fn().mockResolvedValue(false);
      state.detailEditorRef = {
        formRef: { validate },
        getPayload: vi.fn()
      };
      await options.beforeSure(done);
      expect(done).not.toHaveBeenCalled();

      validate.mockResolvedValueOnce(true);
      const payload = { detailId: 1, actualCount: 2 };
      const getPayload = vi.fn(() => payload);
      state.detailEditorRef = { formRef: { validate }, getPayload };
      await options.beforeSure(done);
      expect(mocks.updateDetails).toHaveBeenCalledWith(12, {
        details: [payload]
      });
      expect(done).toHaveBeenCalled();
      expect(mocks.message).toHaveBeenCalledWith("更新成功", {
        type: "success"
      });

      validate.mockResolvedValueOnce(true);
      mocks.updateDetails.mockRejectedValueOnce(new Error("update"));
      await options.beforeSure(done);
      expect(mocks.handleApiError).toHaveBeenCalledWith(
        expect.any(Error),
        "更新失败"
      );

      await wrapper.setProps({ formInline: { task: null } });
      await state.handleUpdateDetail(row);
      expect(mocks.addDialog).toHaveBeenCalledTimes(1);
    } finally {
      wrapper.unmount();
    }
  });

  it("renders quantity and serial columns with empty and signed values", async () => {
    const quantity = await mountForm(task({ mode: "quantity" }));
    const quantityState = quantity.vm.$.setupState as Record<string, any>;
    try {
      quantityState.detailList = [
        detail({ actualCount: undefined, difference: undefined }),
        detail({ id: 2, actualCount: 3, difference: 1 }),
        detail({ id: 3, actualCount: 1, difference: -1 }),
        detail({ id: 4, actualCount: 2, difference: 0 })
      ];
      await nextTick();
      expect(quantity.text()).toContain("未录入");
      expect(quantity.text()).toContain("+1");
      expect(quantity.text()).toContain("-1");
      expect(quantity.findAll(".text-green-600")).toHaveLength(1);
      expect(quantity.findAll(".text-red-600")).toHaveLength(1);
      expect(quantity.text()).not.toContain("账面胎号");
    } finally {
      quantity.unmount();
    }

    const serial = await mountForm(
      task({ mode: "serial", status: StocktakingStatus.COMPLETED })
    );
    const serialState = serial.vm.$.setupState as Record<string, any>;
    try {
      serialState.detailList = [
        detail({
          bookSerialNos: ["B-1", "B-2"],
          actualSerialNos: ["A-1"]
        }),
        detail({ id: 2, bookSerialNos: [], actualSerialNos: [] })
      ];
      await nextTick();
      expect(serial.text()).toContain("B-1");
      expect(serial.text()).toContain("A-1");
      expect(serial.text()).toContain("未录入");
      expect(serial.text()).toContain("-");
      expect(serial.findAll(".reset-margin")).toHaveLength(0);
    } finally {
      serial.unmount();
    }
  });
});

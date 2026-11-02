import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  exportReport: vi.fn(),
  downloadBlob: vi.fn(),
  message: vi.fn(),
  handleError: vi.fn(),
  confirm: vi.fn()
}));

vi.mock("@/api/analysis", () => ({
  getReportSubscriptionsApi: mocks.list,
  createReportSubscriptionApi: mocks.create,
  updateReportSubscriptionApi: mocks.update,
  deleteReportSubscriptionApi: mocks.remove,
  exportReportApi: mocks.exportReport
}));
vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  downloadBlob: mocks.downloadBlob,
  message: mocks.message,
  handleApiError: mocks.handleError
}));
vi.mock("element-plus", async importOriginal => ({
  ...(await importOriginal<typeof import("element-plus")>()),
  ElMessageBox: { confirm: mocks.confirm }
}));

function subscription(overrides: Record<string, unknown> = {}) {
  return {
    uid: "sub-1",
    name: "每日销售",
    reportType: "sales_summary",
    frequency: "daily",
    channels: ["email"],
    recipients: ["sales@example.com"],
    status: true,
    nextRunAt: "2026-01-02T10:00:00Z",
    lastRunAt: "2026-01-01T10:00:00Z",
    ...overrides
  };
}

async function mountPage() {
  const wrapper = await mountSmokeComponent(
    () => import("../index.vue"),
    "analysis/subscriptions/index.vue",
    { keepMounted: true, deep: true }
  );
  await vi.waitFor(() => expect(mocks.list).toHaveBeenCalled());
  await flushPromises();
  return wrapper;
}

type Wrapper = Awaited<ReturnType<typeof mountPage>>;
const state = (wrapper: Wrapper) =>
  wrapper.vm.$.setupState as Record<string, any>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.list.mockResolvedValue({ code: 200, data: [subscription()] });
  mocks.create.mockResolvedValue({ code: 200 });
  mocks.update.mockResolvedValue({ code: 200 });
  mocks.remove.mockResolvedValue({ code: 200 });
  mocks.exportReport.mockResolvedValue(
    new Blob(["report"], { type: "application/pdf" })
  );
  mocks.confirm.mockResolvedValue("confirm");
});

describe("analysis report subscriptions", () => {
  it("loads the list and maps report, frequency, channel and date display fallbacks", async () => {
    mocks.list.mockResolvedValueOnce({
      code: 200,
      data: [
        subscription({
          channels: ["email", "sms", "wechat"],
          recipients: [],
          nextRunAt: null,
          lastRunAt: "bad-date"
        }),
        subscription({
          uid: "sub-2",
          reportType: "custom",
          frequency: "hourly"
        })
      ]
    });
    const wrapper = await mountPage();
    const vm = state(wrapper);

    expect(vm.list).toHaveLength(2);
    expect(vm.reportTypeLabel("sales_summary")).toBe("销售汇总");
    expect(vm.reportTypeLabel("custom")).toBe("custom");
    expect(vm.frequencyLabel("daily")).toBe("每日");
    expect(vm.frequencyLabel("hourly")).toBe("hourly");
    expect(vm.formatDateTime()).toBe("—");
    expect(vm.formatDateTime("bad-date")).toBe("bad-date");
    expect(vm.formatDateTime("2026-01-01T00:00:00Z")).toMatch(
      /^2026-01-0[12] 0[78]:00$/
    );
    wrapper.unmount();
  });

  it("passes only selected filters to the list API", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    mocks.list.mockClear();

    vm.filters.reportType = "inventory_summary";
    vm.filters.status = "false";
    await vm.loadList();
    expect(mocks.list).toHaveBeenLastCalledWith({
      reportType: "inventory_summary",
      status: false
    });

    vm.filters.reportType = "";
    vm.filters.status = "true";
    await vm.loadList();
    expect(mocks.list).toHaveBeenLastCalledWith({ status: true });

    vm.filters.status = "";
    await vm.loadList();
    expect(mocks.list).toHaveBeenLastCalledWith({});
    expect(vm.loading).toBe(false);
    wrapper.unmount();
  });

  it("clears the list for non-success and failed list loads", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.list = [subscription()];

    mocks.list.mockResolvedValueOnce({ code: 500, data: [subscription()] });
    await vm.loadList();
    expect(vm.list).toEqual([]);
    expect(mocks.message).toHaveBeenCalledWith("加载订阅列表失败", {
      type: "error"
    });

    mocks.list.mockRejectedValueOnce(new Error("network"));
    await vm.loadList();
    expect(vm.list).toEqual([]);
    expect(mocks.handleError).toHaveBeenCalledWith(
      expect.any(Error),
      "加载订阅列表失败"
    );
    wrapper.unmount();
  });

  it("resets create defaults and opens the create dialog", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.form.name = "old";
    vm.loading = true;

    vm.openCreate();
    expect(vm.form).toMatchObject({
      name: "",
      reportType: "sales_summary",
      frequency: "daily",
      channels: ["email"],
      recipientsText: "",
      status: true
    });
    expect(vm.editingUid).toBeNull();
    expect(vm.dialogVisible).toBe(true);
    expect(vm.dialogTitle).toBe("新建报表订阅");
    wrapper.unmount();
  });

  it("edits rows while normalizing missing and non-array fields", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);

    vm.openEdit(
      subscription({
        channels: ["sms"],
        recipients: ["a@x.com", "b@x.com"],
        status: false
      })
    );
    expect(vm.form.channels).toEqual(["sms"]);
    expect(vm.form.recipientsText).toBe("a@x.com\nb@x.com");
    expect(vm.form.status).toBe(false);
    expect(vm.dialogTitle).toBe("编辑报表订阅");

    vm.openEdit(
      subscription({
        channels: undefined,
        recipients: undefined,
        reportType: undefined,
        frequency: undefined
      })
    );
    expect(vm.form.channels).toEqual(["email"]);
    expect(vm.form.recipientsText).toBe("");
    expect(vm.form.reportType).toBe("sales_summary");
    expect(vm.form.frequency).toBe("daily");
    wrapper.unmount();
  });

  it("parses every supported recipient separator and removes blanks", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    expect(
      vm.parseRecipients(
        "a@x.com\n b@x.com, c@x.com; d@x.com，e@x.com；f@x.com  "
      )
    ).toEqual([
      "a@x.com",
      "b@x.com",
      "c@x.com",
      "d@x.com",
      "e@x.com",
      "f@x.com"
    ]);
    expect(vm.parseRecipients(" \n , ; ")).toEqual([]);
    wrapper.unmount();
  });

  it("validates name, channels and recipients before saving", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.openCreate();

    vm.form.name = "   ";
    await vm.handleSave();
    expect(mocks.message).toHaveBeenCalledWith("请填写订阅名称", {
      type: "warning"
    });

    vm.form.name = "摘要";
    vm.form.channels = [];
    await vm.handleSave();
    expect(mocks.message).toHaveBeenCalledWith("请至少选择一个推送渠道", {
      type: "warning"
    });

    vm.form.channels = ["email"];
    vm.form.recipientsText = " , ";
    await vm.handleSave();
    expect(mocks.message).toHaveBeenCalledWith("请填写至少一个接收地址", {
      type: "warning"
    });
    expect(mocks.create).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("creates a subscription with normalized payload and refreshes", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.openCreate();
    vm.form.name = "  每日摘要  ";
    vm.form.reportType = "purchase_summary";
    vm.form.frequency = "weekly";
    vm.form.channels = ["email", "sms"];
    vm.form.recipientsText = "a@x.com, 13800000000";
    const before = mocks.list.mock.calls.length;

    await vm.handleSave();
    expect(mocks.create).toHaveBeenCalledWith({
      name: "每日摘要",
      reportType: "purchase_summary",
      frequency: "weekly",
      channels: ["email", "sms"],
      recipients: ["a@x.com", "13800000000"]
    });
    expect(mocks.message).toHaveBeenCalledWith("订阅已创建", {
      type: "success"
    });
    expect(vm.dialogVisible).toBe(false);
    expect(vm.saving).toBe(false);
    expect(mocks.list.mock.calls.length).toBeGreaterThan(before);
    wrapper.unmount();
  });

  it("updates subscriptions and preserves dialog on non-success", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.openEdit(subscription({ status: false }));

    mocks.update.mockResolvedValueOnce({ code: 409 });
    await vm.handleSave();
    expect(mocks.message).toHaveBeenCalledWith("更新订阅失败", {
      type: "error"
    });
    expect(vm.dialogVisible).toBe(true);

    mocks.update.mockResolvedValueOnce({ code: 200 });
    await vm.handleSave();
    expect(mocks.update).toHaveBeenLastCalledWith(
      "sub-1",
      expect.objectContaining({ status: false })
    );
    expect(mocks.message).toHaveBeenCalledWith("订阅已更新", {
      type: "success"
    });
    expect(vm.dialogVisible).toBe(false);
    wrapper.unmount();
  });

  it("reports create and update exceptions with operation-specific messages", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.openCreate();
    vm.form.name = "摘要";
    vm.form.recipientsText = "a@x.com";
    mocks.create.mockRejectedValueOnce(new Error("create"));
    await vm.handleSave();
    expect(mocks.handleError).toHaveBeenCalledWith(
      expect.any(Error),
      "创建订阅失败"
    );

    vm.openEdit(subscription());
    mocks.update.mockRejectedValueOnce(new Error("update"));
    await vm.handleSave();
    expect(mocks.handleError).toHaveBeenCalledWith(
      expect.any(Error),
      "更新订阅失败"
    );
    expect(vm.saving).toBe(false);
    wrapper.unmount();
  });

  it("ignores create non-success while leaving the dialog open", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.openCreate();
    vm.form.name = "摘要";
    vm.form.recipientsText = "a@x.com";
    mocks.create.mockResolvedValueOnce({ code: 400 });
    await vm.handleSave();
    expect(mocks.message).toHaveBeenCalledWith("创建订阅失败", {
      type: "error"
    });
    expect(vm.dialogVisible).toBe(true);
    wrapper.unmount();
  });

  it("toggles a status optimistically and refreshes after failures", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    const row = subscription({ status: true });

    await vm.handleToggleStatus(row, false);
    expect(mocks.update).toHaveBeenCalledWith("sub-1", { status: false });
    expect(row.status).toBe(false);
    expect(mocks.message).toHaveBeenCalledWith("已停用", { type: "success" });

    mocks.update.mockResolvedValueOnce({ code: 500 });
    await vm.handleToggleStatus(row, true);
    expect(mocks.message).toHaveBeenCalledWith("更新启用状态失败", {
      type: "error"
    });

    mocks.update.mockRejectedValueOnce(new Error("toggle"));
    await vm.handleToggleStatus(row, true);
    expect(mocks.handleError).toHaveBeenCalledWith(
      expect.any(Error),
      "更新启用状态失败"
    );
    wrapper.unmount();
  });

  it("deletes only after confirmation and handles every delete outcome", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    const row = subscription();

    mocks.confirm.mockRejectedValueOnce("cancel");
    await vm.handleDelete(row);
    expect(mocks.remove).not.toHaveBeenCalled();

    mocks.remove.mockResolvedValueOnce({ code: 500 });
    await vm.handleDelete(row);
    expect(mocks.confirm).toHaveBeenCalledWith(
      "确认删除订阅「每日销售」？删除后不可恢复。",
      "删除确认",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消"
      }
    );
    expect(mocks.message).toHaveBeenCalledWith("删除订阅失败", {
      type: "error"
    });

    mocks.remove.mockResolvedValueOnce({ code: 200 });
    await vm.handleDelete(row);
    expect(mocks.message).toHaveBeenCalledWith("订阅已删除", {
      type: "success"
    });

    mocks.remove.mockRejectedValueOnce(new Error("delete"));
    await vm.handleDelete(row);
    expect(mocks.handleError).toHaveBeenCalledWith(
      expect.any(Error),
      "删除订阅失败"
    );
    wrapper.unmount();
  });

  it("exports either format and wraps untyped or non-Blob responses", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);

    mocks.exportReport.mockResolvedValueOnce(new Blob(["excel"]));
    await vm.handleExport();
    expect(mocks.downloadBlob).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }),
      expect.stringMatching(/^analysis-overview_.*\.xlsx$/),
      { showMessage: true, skipMimeCheck: false }
    );

    vm.exportFormat = "pdf";
    mocks.exportReport.mockResolvedValueOnce(new ArrayBuffer(4));
    await vm.handleExport();
    expect(mocks.downloadBlob).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "application/pdf" }),
      expect.stringMatching(/^analysis-overview_.*\.pdf$/),
      { showMessage: true, skipMimeCheck: false }
    );

    mocks.exportReport.mockResolvedValueOnce(
      new Blob(["typed"], { type: "application/pdf" })
    );
    await vm.handleExport();
    expect(mocks.downloadBlob.mock.calls.at(-1)?.[0].type).toBe(
      "application/pdf"
    );
    expect(vm.exporting).toBe(false);
    wrapper.unmount();
  });

  it("validates the export range and reports export failures", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);

    vm.exportRange = null;
    await vm.handleExport();
    expect(mocks.message).toHaveBeenCalledWith("请选择导出日期区间", {
      type: "warning"
    });
    vm.exportRange = ["2026-01-01"] as any;
    await vm.handleExport();
    expect(mocks.exportReport).not.toHaveBeenCalled();

    vm.exportRange = ["2026-01-01", "2026-01-02"];
    mocks.exportReport.mockRejectedValueOnce(new Error("export"));
    await vm.handleExport();
    expect(mocks.handleError).toHaveBeenCalledWith(
      expect.any(Error),
      "导出失败"
    );
    expect(vm.exporting).toBe(false);
    wrapper.unmount();
  });
});

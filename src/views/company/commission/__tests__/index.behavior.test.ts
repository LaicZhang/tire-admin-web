import type { Component, PropType } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h, inject, nextTick, provide } from "vue";

const mocks = vi.hoisted(() => ({
  records: vi.fn(),
  summary: vi.fn(),
  settlements: vi.fn(),
  exportRecords: vi.fn(),
  create: vi.fn(),
  submit: vi.fn(),
  approve: vi.fn(),
  reject: vi.fn(),
  reverse: vi.fn(),
  merge: vi.fn(),
  immediate: vi.fn(),
  message: vi.fn(),
  download: vi.fn(),
  filename: vi.fn(),
  confirm: vi.fn(),
  prompt: vi.fn()
}));

vi.mock("@/api/company/commission", () => ({
  getCommissionRecordsApi: mocks.records,
  getCommissionSummaryApi: mocks.summary,
  getCommissionSettlementsApi: mocks.settlements,
  exportCommissionRecordsApi: mocks.exportRecords,
  createCommissionSettlementApi: mocks.create,
  submitCommissionSettlementApi: mocks.submit,
  approveCommissionSettlementApi: mocks.approve,
  rejectCommissionSettlementApi: mocks.reject,
  reverseCommissionSettlementApi: mocks.reverse,
  mergeCommissionIntoPayrollApi: mocks.merge,
  payCommissionImmediateApi: mocks.immediate
}));
vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: mocks.message
}));
vi.mock("@/utils/download", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils/download")>()),
  downloadBlob: mocks.download,
  generateFilenameWithTimestamp: mocks.filename
}));
vi.mock("element-plus", async importOriginal => {
  const actual = await importOriginal<typeof import("element-plus")>();
  return {
    ...actual,
    ElMessageBox: {
      ...actual.ElMessageBox,
      confirm: mocks.confirm,
      prompt: mocks.prompt
    }
  };
});

type Row = Record<string, any>;
const PassThrough = defineComponent({
  setup(_, { slots }) {
    return () => h("div", slots.default?.());
  }
});
const Button = defineComponent({
  emits: ["click"],
  setup(_, { slots }) {
    return () => h("button", slots.default?.());
  }
});
const TableRows = Symbol("tableRows");
const Table = defineComponent({
  props: {
    data: { type: Array as PropType<Record<string, any>[]>, default: () => [] }
  },
  setup(props, { slots }) {
    provide(TableRows, () => props.data);
    return () => h("div", { class: "table" }, slots.default?.());
  }
});
const TableColumn = defineComponent({
  props: { label: String },
  setup(props, { slots }) {
    const rows = inject<() => Record<string, any>[]>(TableRows, () => []);
    return () =>
      h("div", { class: "column", "data-label": props.label }, [
        props.label ?? "",
        ...rows().flatMap(
          (row, index) => slots.default?.({ row, $index: index }) ?? []
        )
      ]);
  }
});
const Input = defineComponent({
  props: { modelValue: [String, Number] },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h("input", {
        value: props.modelValue,
        onInput: (e: Event) =>
          emit("update:modelValue", (e.target as HTMLInputElement).value)
      });
  }
});
const Dialog = defineComponent({
  props: { modelValue: Boolean, title: String },
  setup(props, { slots }) {
    return () =>
      props.modelValue
        ? h("section", { class: "dialog" }, [
            props.title,
            slots.default?.(),
            slots.footer?.()
          ])
        : null;
  }
});
const PaymentSelect = defineComponent({
  props: { modelValue: String },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h(
        "button",
        { class: "payment", onClick: () => emit("update:modelValue", "pay-1") },
        props.modelValue ?? ""
      );
  }
});
async function mountPage() {
  const module = await import("../index.vue");
  return mount(module.default as Component, {
    global: {
      stubs: {
        ElTabs: PassThrough,
        ElTabPane: PassThrough,
        ElCard: PassThrough,
        ElForm: PassThrough,
        ElFormItem: PassThrough,
        ElTable: Table,
        ElTableColumn: TableColumn,
        ElInput: Input,
        ElSelect: PassThrough,
        ElOption: PassThrough,
        ElRadioGroup: PassThrough,
        ElRadioButton: PassThrough,
        ElPagination: PassThrough,
        ElButton: Button,
        ElDialog: Dialog,
        Auth: PassThrough,
        PaymentSelect
      },
      directives: { loading: {} }
    }
  });
}
const state = (wrapper: Awaited<ReturnType<typeof mountPage>>) =>
  wrapper.vm.$.setupState as Record<string, any>;
const settle = async () => {
  await flushPromises();
  await flushPromises();
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.records.mockResolvedValue({
    data: { list: [{ uid: "record-1" }], count: 1, pageSize: 10 }
  });
  mocks.summary.mockResolvedValue({ data: [{ salespersonId: "seller" }] });
  mocks.settlements.mockResolvedValue({ data: { list: [], count: 0 } });
  mocks.exportRecords.mockResolvedValue(new Blob(["x"]));
  mocks.create.mockResolvedValue({});
  mocks.submit.mockResolvedValue({});
  mocks.approve.mockResolvedValue({});
  mocks.reject.mockResolvedValue({});
  mocks.reverse.mockResolvedValue({});
  mocks.merge.mockResolvedValue({});
  mocks.immediate.mockResolvedValue({});
  mocks.filename.mockReturnValue("commission.xlsx");
  mocks.confirm.mockResolvedValue("confirm");
  mocks.prompt.mockResolvedValue({ value: " reason " });
});

describe("commission management behavior", () => {
  it("loads records and summaries with optional filters and keeps fallback page values", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    expect(vm.records).toEqual([{ uid: "record-1" }]);
    expect(vm.recordPage).toMatchObject({ total: 1, pageSize: 10 });

    vm.filters.salespersonId = " seller ";
    vm.filters.saleOrderId = "order";
    vm.filters.status = "AVAILABLE";
    mocks.records.mockResolvedValueOnce({ data: null });
    mocks.summary.mockResolvedValueOnce({ data: null });
    await vm.loadRecords();
    expect(mocks.records).toHaveBeenLastCalledWith(1, {
      salespersonId: " seller ",
      saleOrderId: "order",
      status: "AVAILABLE"
    });
    expect(vm.records).toEqual([]);
    expect(vm.recordPage).toMatchObject({ total: 0, pageSize: 20 });
    expect(vm.summaries).toEqual([]);
    expect(vm.loading).toBe(false);
    wrapper.unmount();
  });

  it("loads settlements and resets loading on failure", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    mocks.settlements.mockResolvedValueOnce({
      data: { list: [{ uid: "s" }], count: 3, pageSize: 5 }
    });
    await vm.loadSettlements();
    expect(vm.settlements).toEqual([{ uid: "s" }]);
    expect(vm.settlementPage).toMatchObject({ total: 3, pageSize: 5 });

    mocks.settlements.mockRejectedValueOnce(new Error("down"));
    await expect(vm.loadSettlements()).rejects.toThrow("down");
    expect(vm.loading).toBe(false);
    wrapper.unmount();
  });

  it("validates and creates trimmed settlement drafts", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);

    await vm.createSettlement();
    expect(mocks.message).toHaveBeenCalledWith("请输入销售员 UID", {
      type: "warning"
    });
    expect(mocks.create).not.toHaveBeenCalled();

    vm.settlementForm.salespersonId = " seller ";
    vm.settlementForm.payoutMode = "BOGUS";
    await vm.createSettlement();
    expect(mocks.message).toHaveBeenCalledWith("请选出账方式", {
      type: "warning"
    });

    vm.settlementForm.payoutMode = "IMMEDIATE";
    vm.settlementForm.remark = " note ";
    await vm.createSettlement();
    expect(mocks.create).toHaveBeenCalledWith({
      salespersonId: "seller",
      payoutMode: "IMMEDIATE",
      remark: "note"
    });
    expect(vm.settlementForm.remark).toBe("");

    vm.settlementForm.remark = "   ";
    await vm.createSettlement();
    expect(mocks.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ remark: undefined })
    );
    wrapper.unmount();
  });

  it("rejects malformed settlement rows before dialogs", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    for (const row of [null, 1, {}, { uid: 1 }]) {
      await expect(vm.submitSettlement(row)).rejects.toThrow(
        "提成结算单 UID 缺失"
      );
    }
    expect(mocks.confirm).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("submits and approves confirmed settlements", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);

    await vm.submitSettlement({ uid: "draft-1" });
    expect(mocks.confirm).toHaveBeenCalledWith(
      "确认提交该提成结算单审核？",
      "提交审核"
    );
    expect(mocks.submit).toHaveBeenCalledWith("draft-1");
    expect(mocks.message).toHaveBeenCalledWith("已提交审核", {
      type: "success"
    });

    await vm.approveSettlement({ uid: "pending-1" });
    expect(mocks.approve).toHaveBeenCalledWith("pending-1");
    expect(mocks.message).toHaveBeenCalledWith("提成结算已审核入账", {
      type: "success"
    });
    wrapper.unmount();
  });

  it("validates and submits reverse and reject reasons", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    mocks.prompt.mockImplementationOnce(async (_message, _title, options) => {
      expect(options.inputValidator(" ")).toBe("冲销原因不能为空");
      expect(options.inputValidator("ok")).toBe(true);
      return { value: " mistake " };
    });
    await vm.reverseSettlement({ uid: "approved-1" });
    expect(mocks.reverse).toHaveBeenCalledWith("approved-1", "mistake");

    mocks.prompt.mockImplementationOnce(async (_message, _title, options) => {
      expect(options.inputValidator("")).toBe("拒审原因不能为空");
      return { value: " missing " };
    });
    await vm.rejectSettlement({ uid: "pending-1" });
    expect(mocks.reject).toHaveBeenCalledWith("pending-1", "missing");
    wrapper.unmount();
  });

  it("opens and confirms payroll merges and immediate payments", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);

    vm.openMerge({ uid: "approved-1" });
    expect(vm.mergeDialog).toMatchObject({
      visible: true,
      uid: "approved-1",
      payrollRunId: ""
    });
    await vm.confirmMerge();
    expect(mocks.message).toHaveBeenCalledWith("请输入目标工资表 Run UID", {
      type: "warning"
    });
    vm.mergeDialog.payrollRunId = " run-1 ";
    await vm.confirmMerge();
    expect(mocks.merge).toHaveBeenCalledWith("approved-1", "run-1");
    expect(vm.mergeDialog.visible).toBe(false);

    vm.openImmediate({ uid: "approved-2" });
    expect(vm.immediateDialog).toMatchObject({
      visible: true,
      uid: "approved-2"
    });
    await vm.confirmImmediate();
    expect(mocks.message).toHaveBeenCalledWith("请选择资金账户", {
      type: "warning"
    });
    vm.immediateDialog.paymentId = "pay-1";
    await vm.confirmImmediate();
    expect(mocks.immediate).toHaveBeenCalledWith("approved-2", "pay-1");
    expect(vm.immediateDialog.visible).toBe(false);
    wrapper.unmount();
  });

  it("renders record, summary and settlement states plus both dialogs", async () => {
    mocks.records.mockResolvedValueOnce({
      data: {
        list: [
          {
            uid: "r1",
            status: "AVAILABLE",
            commissionBaseAmount: "100",
            estimatedAmount: "10",
            availableAmount: "8"
          },
          { uid: "r2", status: "CUSTOM" }
        ],
        count: 2,
        pageSize: 20
      }
    });
    mocks.summary.mockResolvedValueOnce({
      data: [
        {
          salespersonId: "seller-1",
          _count: { _all: 2 },
          _sum: {
            estimatedAmount: "10",
            availableAmount: "8",
            settledAmount: "0"
          }
        },
        { salespersonId: "seller-2" }
      ]
    });
    mocks.settlements.mockResolvedValueOnce({
      data: {
        list: [
          { uid: "s1", status: "DRAFT", payoutMode: "PAYROLL" },
          { uid: "s2", status: "PENDING_APPROVAL", payoutMode: "PAYROLL" },
          {
            uid: "s3",
            status: "APPROVED",
            payoutMode: "PAYROLL",
            totalAmount: "100"
          },
          {
            uid: "s4",
            status: "APPROVED",
            payoutMode: "PAYROLL",
            payoutLink: { payrollRunId: "payroll-123" }
          },
          { uid: "s5", status: "APPROVED", payoutMode: "IMMEDIATE" },
          {
            uid: "s6",
            status: "APPROVED",
            payoutMode: "IMMEDIATE",
            payoutLink: { otherExpenseOrderUid: "expense-123" }
          },
          {
            uid: "s7",
            status: "APPROVED",
            payoutMode: "OTHER",
            payoutLink: {}
          },
          { uid: "s8", status: "UNKNOWN", payoutMode: "OTHER" }
        ],
        count: 8,
        pageSize: 20
      }
    });
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    expect(wrapper.text()).toContain("可结算");
    expect(wrapper.text()).toContain("CUSTOM");
    expect(wrapper.text()).toContain("工资表 payroll-…");
    expect(wrapper.text()).toContain("支出单 expense-…");
    expect(wrapper.text()).toContain("已关联");
    expect(wrapper.text()).toContain("提交审核");
    expect(wrapper.text()).toContain("审核入账");
    expect(wrapper.text()).toContain("拒审");
    expect(wrapper.text()).toContain("并入工资表");
    expect(wrapper.text()).toContain("立即出账");
    expect(wrapper.text()).toContain("冲销");

    vm.mergeDialog.visible = true;
    vm.immediateDialog.visible = true;
    await nextTick();
    expect(wrapper.findAll(".dialog")).toHaveLength(2);
    expect(wrapper.text()).toContain("确认并入");
    expect(wrapper.text()).toContain("确认出账");
    wrapper.unmount();
  });

  it("labels every payout link shape and refreshes only on the settlement tab", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    expect(vm.payoutLinkLabel({})).toBe("—");
    expect(
      vm.payoutLinkLabel({ payoutLink: { payrollRunId: "123456789" } })
    ).toBe("工资表 12345678…");
    expect(
      vm.payoutLinkLabel({ payoutLink: { otherExpenseOrderUid: "abcdefghi" } })
    ).toBe("支出单 abcdefgh…");
    expect(
      vm.payoutLinkLabel({
        payoutLink: { payrollRunId: "", otherExpenseOrderUid: "" }
      })
    ).toBe("已关联");

    const before = mocks.settlements.mock.calls.length;
    vm.onTabChange("records");
    expect(mocks.settlements).toHaveBeenCalledTimes(before);
    vm.onTabChange("settlements");
    await settle();
    expect(mocks.settlements.mock.calls.length).toBe(before + 1);
    wrapper.unmount();
  });

  it("exports filtered records and formats money safely", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    vm.filters.salespersonId = "seller";
    vm.filters.saleOrderId = "";
    vm.filters.status = "SETTLED";
    await vm.exportRecords();
    expect(mocks.exportRecords).toHaveBeenCalledWith({
      salespersonId: "seller",
      saleOrderId: undefined,
      status: "SETTLED"
    });
    expect(mocks.filename).toHaveBeenCalledWith("commission-records", ".xlsx");
    expect(mocks.download).toHaveBeenCalledWith(
      expect.any(Blob),
      "commission.xlsx"
    );
    expect(vm.money(undefined)).toContain("0.00");
    wrapper.unmount();
  });
});

import { flushPromises, mount } from "@vue/test-utils";
import {
  defineComponent,
  h,
  inject,
  nextTick,
  provide,
  type PropType
} from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => {
  const base = (status = "DRAFT") => ({
    uid: "run-1",
    period: 202611,
    status,
    totalPayable: "12345",
    totalActual: "10000",
    totalEmployer: "15000",
    lines: [],
    _count: { lines: 0 }
  });
  return {
    base,
    status: "DRAFT",
    listData: [] as Array<Record<string, unknown>>,
    generateData: { uid: "run-1" } as { uid?: string } | null,
    updateData: base() as Record<string, unknown> | null,
    promptValue: "reason",
    list: vi.fn(),
    get: vi.fn(),
    generate: vi.fn(),
    update: vi.fn(),
    recalculate: vi.fn(),
    confirm: vi.fn(),
    unconfirm: vi.fn(),
    accrue: vi.fn(),
    disburse: vi.fn(),
    reverse: vi.fn(),
    payslip: vi.fn(),
    message: vi.fn(),
    prompt: vi.fn()
  };
});

vi.mock("@/api/company/payroll-run", () => ({
  listPayrollRunsApi: fixture.list,
  getPayrollRunApi: fixture.get,
  generatePayrollRunApi: fixture.generate,
  updatePayrollLineInputsApi: fixture.update,
  recalculatePayrollRunApi: fixture.recalculate,
  confirmPayrollRunApi: fixture.confirm,
  unconfirmPayrollRunApi: fixture.unconfirm,
  accruePayrollRunApi: fixture.accrue,
  disbursePayrollRunApi: fixture.disburse,
  reversePayrollRunApi: fixture.reverse
}));
vi.mock("@/api/company/payslip", () => ({
  dispatchPayslipsApi: fixture.payslip
}));
vi.mock("@/utils", () => ({ message: fixture.message }));
vi.mock("element-plus", async importOriginal => {
  const actual = await importOriginal<typeof import("element-plus")>();
  return {
    ...actual,
    ElMessageBox: { ...actual.ElMessageBox, prompt: fixture.prompt }
  };
});

import PayrollRunPage from "../index.vue";

const Button = defineComponent({
  emits: ["click"],
  setup(_, { slots }) {
    return () =>
      h("button", { onClick: (e: Event) => undefined }, slots.default?.());
  }
});
const Card = defineComponent({
  setup(_, { slots }) {
    return () => h("section", [slots.header?.(), slots.default?.()]);
  }
});
const TableRows = Symbol("tableRows");
const Table = defineComponent({
  props: {
    data: {
      type: Array as PropType<Record<string, unknown>[]>,
      default: () => []
    }
  },
  setup(props, { slots }) {
    provide(TableRows, () => props.data);
    return () => h("div", { class: "table" }, slots.default?.());
  }
});
const TableColumn = defineComponent({
  props: { label: String },
  setup(props, { slots }) {
    const rows = inject<() => Record<string, unknown>[]>(TableRows, () => []);
    return () =>
      h("div", { class: "column", "data-label": props.label }, [
        props.label ?? "",
        ...rows().map((row, index) => slots.default?.({ row, $index: index }))
      ]);
  }
});
const Input = defineComponent({
  props: { modelValue: [String, Number] },
  emits: ["update:modelValue", "change"],
  setup(props, { emit }) {
    return () =>
      h("input", {
        value: props.modelValue,
        onInput: (e: Event) =>
          emit("update:modelValue", (e.target as HTMLInputElement).value),
        onChange: (e: Event) =>
          emit("change", (e.target as HTMLInputElement).value)
      });
  }
});
const Dialog = defineComponent({
  props: { modelValue: Boolean, title: String },
  setup(props, { slots }) {
    return () =>
      props.modelValue
        ? h("div", { class: "dialog" }, [slots.default?.(), slots.footer?.()])
        : null;
  }
});
const PassThrough = defineComponent({
  setup(_, { slots }) {
    return () => h("div", slots.default?.());
  }
});
const PaymentSelect = defineComponent({
  props: { modelValue: String },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h(
        "button",
        {
          class: "payment",
          onClick: () => emit("update:modelValue", "payment-1")
        },
        props.modelValue ?? ""
      );
  }
});

function mountPage() {
  return mount(PayrollRunPage, {
    global: {
      stubs: {
        ElButton: Button,
        ElCard: Card,
        ElTable: Table,
        ElTableColumn: TableColumn,
        ElInput: Input,
        ElInputNumber: Input,
        ElDialog: Dialog,
        ElForm: PassThrough,
        ElFormItem: PassThrough,
        PaymentSelect
      },
      directives: { loading: {} }
    }
  });
}

type Wrapper = Awaited<ReturnType<typeof mountPage>>;
const stateOf = (wrapper: Wrapper) =>
  wrapper.vm.$.setupState as Record<string, any>;

beforeEach(() => {
  fixture.status = "DRAFT";
  fixture.listData = [];
  fixture.generateData = { uid: "run-1" };
  fixture.updateData = fixture.base();
  fixture.promptValue = "reason";
  fixture.list
    .mockReset()
    .mockImplementation(async () => ({ data: fixture.listData }));
  fixture.get
    .mockReset()
    .mockImplementation(async () => ({ data: fixture.base(fixture.status) }));
  fixture.generate
    .mockReset()
    .mockImplementation(async () => ({ data: fixture.generateData }));
  fixture.update
    .mockReset()
    .mockImplementation(async () => ({ data: fixture.updateData }));
  fixture.recalculate.mockReset().mockResolvedValue({});
  fixture.confirm.mockReset().mockResolvedValue({});
  fixture.unconfirm.mockReset().mockResolvedValue({});
  fixture.accrue.mockReset().mockResolvedValue({});
  fixture.disburse.mockReset().mockResolvedValue({});
  fixture.reverse.mockReset().mockResolvedValue({});
  fixture.payslip.mockReset().mockResolvedValue({
    data: { successInApp: 1, successEmail: 2, skippedNoEmail: 3 }
  });
  fixture.message.mockReset();
  fixture.prompt
    .mockReset()
    .mockImplementation(async () => ({ value: fixture.promptValue }));
});

describe("PayrollRunManagement", () => {
  it("loads runs on mount and renders list/status and count fallbacks", async () => {
    fixture.listData = [
      {
        uid: "a",
        status: "DRAFT",
        totalPayable: "100",
        totalActual: "90",
        totalEmployer: "120",
        _count: { lines: 3 }
      },
      {
        uid: "b",
        status: "PAID",
        totalPayable: "bad",
        totalActual: "80",
        totalEmployer: "110",
        lines: [{}, {}]
      },
      {
        uid: "c",
        status: "UNKNOWN",
        totalPayable: null,
        totalActual: null,
        totalEmployer: null
      },
      {
        uid: "d",
        status: "REVERSED",
        totalPayable: undefined,
        totalActual: undefined,
        totalEmployer: undefined,
        lines: undefined
      }
    ];
    const wrapper = mountPage();
    await flushPromises();
    const state = stateOf(wrapper);

    expect(fixture.list).toHaveBeenCalledWith({ period: expect.any(Number) });
    expect(wrapper.text()).toContain("草稿");
    expect(wrapper.text()).toContain("已发放");
    expect(wrapper.text()).toContain("UNKNOWN");
    expect(wrapper.text()).toContain("¥1.00");
    expect(wrapper.text()).toContain("¥0.00");
    expect(wrapper.text()).toContain("3");
    expect(wrapper.text()).toContain("2");
    expect(wrapper.text()).toContain("-");

    expect(state.money("bad")).toBe("0.00");
    expect(state.money(null)).toBe("0.00");
    expect(state.fenOf(null)).toBe(0);
    expect(state.itemCodes).toEqual([]);
    state.current = {
      ...fixture.base(),
      lines: [
        {},
        { items: undefined },
        { items: [{ code: "BASE" }, { code: "BASE" }] }
      ]
    };
    await nextTick();
    expect(state.itemCodes).toEqual(["BASE"]);
    wrapper.unmount();
  });

  it("loads without a period, opens null details and handles list failures", async () => {
    fixture.listData = [];
    const wrapper = mountPage();
    await flushPromises();
    const state = stateOf(wrapper);

    state.period = 0;
    fixture.list.mockResolvedValueOnce({ data: null });
    await state.loadRuns();
    expect(fixture.list).toHaveBeenLastCalledWith({ period: undefined });
    expect(state.runs).toEqual([]);

    fixture.list.mockRejectedValueOnce(new Error("list failed"));
    await expect(state.loadRuns()).rejects.toThrow("list failed");
    expect(state.loading).toBe(false);

    fixture.get.mockResolvedValueOnce({ data: null });
    await state.openRun("missing");
    expect(state.current).toBeNull();

    fixture.get.mockResolvedValueOnce({
      data: { ...fixture.base(), lines: undefined }
    });
    await state.openRun("without-lines");
    await nextTick();
    expect(wrapper.text()).toContain("202611");
    wrapper.unmount();
  });

  it("generates with validation, optional uid and surfaced failure", async () => {
    const wrapper = mountPage();
    await flushPromises();
    const state = stateOf(wrapper);

    state.period = 0;
    await state.generate();
    expect(fixture.message).toHaveBeenCalledWith("请输入期间 YYYYMM", {
      type: "warning"
    });
    expect(fixture.generate).not.toHaveBeenCalled();

    state.period = 202611;
    fixture.generateData = null;
    await state.generate();
    expect(fixture.message).toHaveBeenCalledWith("工资表已生成", {
      type: "success"
    });

    fixture.generateData = { uid: "new-run" };
    await state.generate();
    expect(fixture.get).toHaveBeenCalledWith("new-run");

    fixture.generate.mockRejectedValueOnce(new Error("conflict"));
    await expect(state.generate()).rejects.toThrow("conflict");
    expect(state.loading).toBe(false);
    wrapper.unmount();
  });

  it("guards and saves payroll input edits", async () => {
    const wrapper = mountPage();
    await flushPromises();
    const state = stateOf(wrapper);

    await state.saveInput("line", "BASE", "2");
    expect(fixture.update).not.toHaveBeenCalled();

    state.current = { ...fixture.base("CONFIRMED"), uid: "run-x" };
    await state.saveInput("line", "BASE", "2");
    expect(fixture.update).not.toHaveBeenCalled();

    state.current = { ...fixture.base(), uid: "run-x" };
    await state.saveInput("line", "BASE", "bad");
    expect(fixture.update).not.toHaveBeenCalled();

    await state.saveInput("line", "BASE", "20.4");
    expect(fixture.update).toHaveBeenCalledWith("run-x", "line", { BASE: 20 });
    expect(state.current.uid).toBe("run-1");

    fixture.updateData = null;
    await state.saveInput("line", "BASE", 4);
    expect(state.current.uid).toBe("run-1");

    fixture.update.mockRejectedValueOnce(new Error("update failed"));
    await expect(state.saveInput("line", "BASE", 1)).rejects.toThrow(
      "update failed"
    );
    expect(state.loading).toBe(false);
    wrapper.unmount();
  });

  it("runs recalculate, confirm, unconfirm, accrue and payslip actions", async () => {
    const wrapper = mountPage();
    await flushPromises();
    const state = stateOf(wrapper);

    await state.act("confirm");
    expect(fixture.confirm).not.toHaveBeenCalled();

    state.current = { ...fixture.base(), uid: "run-actions" };
    await state.act("recalc");
    await state.act("confirm");
    await state.act("unconfirm");
    await state.act("accrue");
    await state.act("payslip");
    expect(fixture.recalculate).toHaveBeenCalledWith("run-actions");
    expect(fixture.confirm).toHaveBeenCalledWith("run-1");
    expect(fixture.unconfirm).toHaveBeenCalledWith("run-1");
    expect(fixture.accrue).toHaveBeenCalledWith("run-1", "计提");
    expect(fixture.payslip).toHaveBeenCalledWith("run-1");
    expect(fixture.message).toHaveBeenCalledWith(
      "工资条：站内1/邮件2/无邮箱3",
      { type: "success" }
    );
    expect(fixture.get).toHaveBeenCalledWith("run-actions");
    expect(fixture.list).toHaveBeenCalled();

    fixture.payslip.mockResolvedValueOnce({ data: null });
    await state.act("payslip");
    expect(fixture.message).toHaveBeenLastCalledWith(
      "工资条：站内0/邮件0/无邮箱0",
      { type: "success" }
    );

    fixture.confirm.mockRejectedValueOnce(new Error("confirm failed"));
    await expect(state.act("confirm")).rejects.toThrow("confirm failed");
    expect(state.loading).toBe(false);
    wrapper.unmount();
  });

  it("opens and validates the disburse dialog", async () => {
    const wrapper = mountPage();
    await flushPromises();
    const state = stateOf(wrapper);

    state.openDisburse();
    expect(state.disburse.visible).toBe(false);

    state.current = { ...fixture.base("ACCRUED"), totalActual: "bad" };
    state.openDisburse();
    expect(state.disburse).toEqual({
      visible: true,
      paymentId: undefined,
      amountYuan: "0.00"
    });
    await nextTick();

    await state.submitDisburse();
    expect(fixture.message).toHaveBeenCalledWith("请选择资金账户", {
      type: "warning"
    });
    expect(fixture.disburse).not.toHaveBeenCalled();

    state.disburse.paymentId = "payment-1";
    state.disburse.amountYuan = "100.50";
    await state.submitDisburse();
    expect(fixture.disburse).toHaveBeenCalledWith("run-1", {
      paymentId: "payment-1",
      amount: 10050,
      reason: "工资发放"
    });
    expect(state.disburse.visible).toBe(false);
    expect(fixture.message).toHaveBeenCalledWith("已发放并扣减资金", {
      type: "success"
    });

    state.current = null;
    await state.submitDisburse();
    wrapper.unmount();
  });

  it("reverses a run with the prompted reason", async () => {
    const wrapper = mountPage();
    await flushPromises();
    const state = stateOf(wrapper);

    await state.reverseRun();
    expect(fixture.prompt).not.toHaveBeenCalled();

    state.current = { ...fixture.base("PAID"), uid: "run-reverse" };
    await state.reverseRun();
    expect(fixture.prompt).toHaveBeenCalledWith(
      "请输入红冲原因",
      "红冲工资表",
      {
        inputPattern: /\S+/,
        inputErrorMessage: "原因不能为空"
      }
    );
    expect(fixture.reverse).toHaveBeenCalledWith("run-reverse", "reason");
    expect(fixture.message).toHaveBeenCalledWith("已红冲", { type: "success" });

    fixture.prompt.mockRejectedValueOnce(new Error("cancel"));
    await expect(state.reverseRun()).rejects.toThrow("cancel");
    expect(state.loading).toBe(false);
    wrapper.unmount();
  });

  it.each(["DRAFT", "CONFIRMED", "ACCRUED", "PAID", "REVERSED"])(
    "renders the %s action matrix and payroll detail rows",
    async status => {
      const lines = [
        {
          uid: "l1",
          employee: { name: "Named" },
          payableWages: 1,
          actualWages: 2,
          items: [
            { code: "INPUT", calcKind: "INPUT", amount: "10" },
            { code: "CALC", calcKind: "CALC", amount: "20" }
          ]
        },
        {
          uid: "l2",
          employee: { nickname: "Nick" },
          payableWages: 3,
          actualWages: 4,
          items: [
            { code: "INPUT", calcKind: "CALC", amount: null },
            { code: "CALC", calcKind: "CALC", amount: undefined }
          ]
        },
        {
          uid: "l3",
          employeeId: "employee-3",
          payableWages: 5,
          actualWages: 6,
          items: []
        }
      ];
      fixture.status = status;
      fixture.get.mockResolvedValue({
        data: { ...fixture.base(status), lines }
      });
      const wrapper = mountPage();
      await flushPromises();
      const state = stateOf(wrapper);
      await state.openRun("run-1");
      await nextTick();

      expect(wrapper.text()).toContain("202611");
      expect(wrapper.text()).toContain("Named");
      expect(wrapper.text()).toContain("Nick");
      expect(wrapper.text()).toContain("employee-3");
      expect(wrapper.text()).toContain("INPUT");
      expect(wrapper.text()).toContain("CALC");
      if (status !== "DRAFT") expect(wrapper.text()).toContain("0.10");

      const labels = wrapper.findAll("button").map(button => button.text());
      expect(labels.includes("重算")).toBe(status === "DRAFT");
      expect(labels.includes("确认")).toBe(status === "DRAFT");
      expect(labels.includes("反确认")).toBe(status === "CONFIRMED");
      expect(labels.includes("计提")).toBe(status === "CONFIRMED");
      expect(labels.includes("发放")).toBe(status === "ACCRUED");
      expect(labels.includes("发送工资条")).toBe(
        ["CONFIRMED", "ACCRUED", "PAID"].includes(status)
      );
      expect(labels.includes("红冲")).toBe(
        ["ACCRUED", "PAID"].includes(status)
      );

      if (status === "DRAFT") {
        const inputs = wrapper.findAll("input");
        expect(inputs.some(input => input.element.value === "10")).toBe(true);
      }
      wrapper.unmount();
    }
  );
});

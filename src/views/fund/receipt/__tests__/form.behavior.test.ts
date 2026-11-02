import { flushPromises } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  ledgers: vi.fn(),
  loadCustomers: vi.fn(),
  loadPayments: vi.fn(),
  defaults: vi.fn(),
  lastHeader: vi.fn(),
  recordCreate: vi.fn(),
  message: vi.fn(),
  handleError: vi.fn(),
  loggerError: vi.fn(),
  resetFields: vi.fn()
}));

vi.mock("@/api/fund/receipt", () => ({
  createReceiptApi: mocks.create,
  updateReceiptApi: mocks.update,
  getOpenReceivableLedgersApi: mocks.ledgers
}));
vi.mock("../../composables/useFundForm", () => ({
  useFundForm: () => ({
    customerList: ref([{ uid: "customer-1", name: "客户一" }]),
    paymentList: ref([{ uid: "payment-1", name: "账户", balance: 10000 }]),
    loadCustomers: mocks.loadCustomers,
    loadPayments: mocks.loadPayments
  })
}));
vi.mock("@/composables", () => ({
  applyCreateDefaults: mocks.defaults,
  applyLastFormHeaderAsync: mocks.lastHeader,
  recordSuccessfulCreate: mocks.recordCreate,
  createBackdateDisabledDate: () => () => false
}));
vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: mocks.message,
  handleApiError: mocks.handleError
}));
vi.mock("@/utils/logger", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils/logger")>()),
  logger: { error: mocks.loggerError }
}));

import ReceiptForm from "../form.vue";
import * as Composables from "@/composables";

function ledger(overrides: Record<string, unknown> = {}) {
  return {
    uid: "ledger-1",
    invoiceNumber: "INV-1",
    invoiceUid: "invoice-uid",
    invoiceDate: "2026-01-02",
    deliveryNoteNo: "DN-1",
    saleDeliveryNoteUid: "sale-uid",
    openAmount: 12345,
    ...overrides
  };
}

const FormItemStub = defineComponent({
  props: { label: { type: String, default: "" } },
  setup(props, { slots }) {
    return () =>
      h("div", { class: "form-item" }, [props.label, slots.default?.()]);
  }
});

async function mountForm(props: Record<string, unknown> = {}) {
  return mountSmokeComponent(
    async () => ({ default: ReceiptForm }),
    "fund/receipt/form.vue",
    {
      keepMounted: true,
      props: { editData: null, ...props },
      globalStubs: {
        ElFormItem: FormItemStub,
        "el-form-item": FormItemStub
      }
    }
  );
}

type Wrapper = Awaited<ReturnType<typeof mountForm>>;
const state = (wrapper: Wrapper) =>
  wrapper.vm.$.setupState as Record<string, any>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.ledgers.mockResolvedValue({ code: 200, data: [ledger()] });
  mocks.defaults.mockResolvedValue(undefined);
  mocks.lastHeader.mockResolvedValue(null);
  mocks.create.mockResolvedValue({ code: 200 });
  mocks.update.mockResolvedValue({ code: 200 });
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("fund receipt form behavior", () => {
  it("uses the shared form defaults helper", () => {
    expect(Composables.applyCreateDefaults).toBe(mocks.defaults);
  });
  it("initializes create defaults, prefill values, settlement limits and options", async () => {
    mocks.defaults.mockImplementationOnce(
      async (target: Record<string, unknown>) => {
        target.paymentId = "payment-default";
        return { settlement: { allowBackdateDays: 3 } };
      }
    );
    mocks.lastHeader.mockImplementationOnce(
      async (target: Record<string, unknown>) => {
        target.customerId = "customer-last";
        target.paymentId = "payment-last";
        target.paymentMethod = "CASH";
        return target;
      }
    );
    const wrapper = await mountForm({
      initialValues: {
        customerId: "customer-initial",
        amount: 500,
        remark: "期初"
      }
    });
    const vm = state(wrapper);
    try {
      await flushPromises();
      await vm.applySettlementDefaults();
      await vm.applyLastUsedPrefill();
      expect(mocks.loadCustomers).toHaveBeenCalledOnce();
      expect(mocks.loadPayments).toHaveBeenCalledOnce();
      expect(mocks.defaults).toHaveBeenCalledWith(vm.formData, {
        isCreate: true,
        settlement: "receivable"
      });
      expect(vm.formData).toMatchObject({
        customerId: "customer-last",
        paymentId: "payment-last",
        paymentMethod: "CASH",
        amount: 500,
        remark: "期初",
        details: []
      });
      expect(vm.allowBackdateDays).toBe(3);
      expect(wrapper.text()).toContain("客户");
      expect(wrapper.text()).toContain("本次预收");
      expect(wrapper.text()).toContain("核销明细");
    } finally {
      wrapper.unmount();
    }
  });

  it("resets initial values and calls optional form reset safely", async () => {
    const wrapper = await mountForm({
      initialValues: { amount: 20, remark: "备注" }
    });
    const vm = state(wrapper);
    try {
      Object.assign(vm.formData, {
        customerId: "old",
        paymentId: "old",
        details: [ledger()]
      });
      vm.receivableLedgerOptions = [ledger()];
      vm.resetForm();
      expect(vm.formData).toMatchObject({
        customerId: "",
        paymentId: "",
        amount: 20,
        remark: "备注",
        details: []
      });
      expect(vm.receivableLedgerOptions).toEqual([]);
      vm.formRef = { resetFields: mocks.resetFields };
      vm.resetForm();
      expect(mocks.resetFields).toHaveBeenCalledTimes(1);
      await flushPromises();
    } finally {
      wrapper.unmount();
    }
  });

  it("handles default and prefill failures without rejecting mounting", async () => {
    mocks.defaults.mockRejectedValueOnce(new Error("defaults"));
    mocks.lastHeader.mockRejectedValueOnce(new Error("prefill"));
    const wrapper = await mountForm();
    const vm = state(wrapper);
    try {
      await vm.applySettlementDefaults();
      await vm.applyLastUsedPrefill();
      expect(mocks.loggerError).toHaveBeenCalledWith(
        "[SettlementDefaults] load failed",
        expect.any(Error)
      );
      expect(mocks.loggerError).toHaveBeenCalledWith(
        "[LastForm] receipt prefill failed",
        expect.any(Error)
      );
    } finally {
      wrapper.unmount();
    }
  });

  it("applies edit data with yuan conversion and defaults", async () => {
    const wrapper = await mountForm({
      editData: {
        uid: "receipt-edit",
        amount: 12345,
        customerId: "customer-edit",
        paymentId: "payment-edit",
        paymentMethod: "WECHAT",
        receiptDate: "2026-02-03",
        remark: "编辑",
        details: [
          {
            sourceOrderId: "l1",
            receivableAmount: 10000,
            writeOffAmount: 5000
          },
          { sourceOrderId: "l2" }
        ]
      }
    });
    const vm = state(wrapper);
    try {
      await flushPromises();
      expect(vm.formData).toMatchObject({
        customerId: "customer-edit",
        paymentId: "payment-edit",
        amount: 123.45,
        paymentMethod: "WECHAT",
        receiptDate: "2026-02-03",
        remark: "编辑"
      });
      expect(vm.formData.details).toHaveLength(2);
      expect(vm.formData.details[0]).toMatchObject({
        receivableAmount: 100,
        writeOffAmount: 50
      });
      expect(vm.formData.details[1]).toMatchObject({
        receivableAmount: 0,
        writeOffAmount: 0
      });
      expect(mocks.defaults).not.toHaveBeenCalled();
      expect(mocks.lastHeader).not.toHaveBeenCalled();
    } finally {
      wrapper.unmount();
    }
  });

  it("loads ledgers only for trimmed customers and clears on failure", async () => {
    const wrapper = await mountForm();
    const vm = state(wrapper);
    try {
      await vm.loadReceivableLedgers("   ");
      expect(vm.receivableLedgerOptions).toEqual([]);
      expect(mocks.ledgers).not.toHaveBeenCalled();

      await vm.loadReceivableLedgers(" customer-1 ");
      expect(mocks.ledgers).toHaveBeenCalledWith("customer-1");
      expect(vm.receivableLedgerOptions).toHaveLength(1);

      mocks.ledgers.mockResolvedValueOnce({ data: null });
      await vm.loadReceivableLedgers("customer-1");
      expect(vm.receivableLedgerOptions).toEqual([]);

      const error = new Error("ledger");
      mocks.ledgers.mockRejectedValueOnce(error);
      vm.receivableLedgerOptions = [ledger()];
      await vm.loadReceivableLedgers("customer-1");
      expect(vm.receivableLedgerOptions).toEqual([]);
      expect(mocks.handleError).toHaveBeenCalledWith(
        error,
        "加载待核销应收失败"
      );
    } finally {
      wrapper.unmount();
    }
  });

  it("clears details when the customer changes only in create mode", async () => {
    const wrapper = await mountForm();
    const vm = state(wrapper);
    try {
      vm.formData.details = [
        { sourceOrderId: "x", receivableAmount: 1, writeOffAmount: 1 }
      ];
      vm.formData.customerId = "customer-2";
      await vi.waitFor(() => expect(vm.formData.details).toEqual([]));
      expect(mocks.ledgers).toHaveBeenCalledWith("customer-2");

      const edit = await mountForm({
        editData: {
          uid: "edit",
          customerId: "c1",
          details: [
            { sourceOrderId: "keep", receivableAmount: 1, writeOffAmount: 1 }
          ]
        }
      });
      await flushPromises();
      state(edit).formData.customerId = "c2";
      await flushPromises();
      expect(state(edit).formData.details).toHaveLength(1);
      edit.unmount();
    } finally {
      wrapper.unmount();
    }
  });

  it("builds ledger labels with fallbacks and populates a selected row", async () => {
    const wrapper = await mountForm();
    const vm = state(wrapper);
    try {
      expect(vm.buildLedgerLabel(ledger())).toBe(
        "INV-1 / DN-1 / 未结 123.45 / 2026-01-02"
      );
      expect(
        vm.buildLedgerLabel(
          ledger({
            invoiceNumber: "",
            invoiceUid: "fallback",
            deliveryNoteNo: "",
            saleDeliveryNoteUid: "sale",
            invoiceDate: ""
          })
        )
      ).toBe("fallback / sale / 未结 123.45 / -");
      vm.receivableLedgerOptions = [ledger()];
      const row: Record<string, any> = {};
      vm.handleLedgerChange(row, "ledger-1");
      expect(row).toEqual({
        sourceOrderId: "ledger-1",
        sourceOrderNo: "INV-1",
        sourceOrderType: "AR_OFFICIAL",
        receivableAmount: 123.45,
        writeOffAmount: 123.45,
        invoiceDate: "2026-01-02",
        deliveryNoteNo: "DN-1"
      });
      vm.handleLedgerChange(row, "missing");
      expect(row).toMatchObject({
        sourceOrderId: "",
        receivableAmount: 0,
        writeOffAmount: 0,
        invoiceDate: ""
      });
    } finally {
      wrapper.unmount();
    }
  });

  it("computes write-off and advance amounts with bounds", async () => {
    const wrapper = await mountForm();
    const vm = state(wrapper);
    try {
      vm.formData.amount = 100;
      vm.formData.details = [
        { receivableAmount: 100, writeOffAmount: 25 },
        { receivableAmount: 100 }
      ];
      expect(vm.totalWriteOffAmount).toBe(25);
      expect(vm.advanceAmount).toBe(75);
      vm.formData.amount = 10;
      expect(vm.advanceAmount).toBe(0);
      vm.formData.amount = -5;
      expect(vm.advanceAmount).toBe(0);
    } finally {
      wrapper.unmount();
    }
  });

  it("adds and removes ledger rows", async () => {
    const wrapper = await mountForm();
    const vm = state(wrapper);
    try {
      vm.addDetailRow();
      expect(vm.formData.details[0]).toMatchObject({
        sourceOrderId: "",
        receivableAmount: 0,
        writeOffAmount: 0,
        invoiceDate: ""
      });
      vm.addDetailRow();
      vm.removeDetailRow(0);
      expect(vm.formData.details).toHaveLength(1);
    } finally {
      wrapper.unmount();
    }
  });

  it("rejects invalid forms without submitting", async () => {
    const wrapper = await mountForm();
    const vm = state(wrapper);
    try {
      vm.formRef = {
        validate: vi.fn().mockRejectedValueOnce(new Error("invalid"))
      };
      await expect(vm.submit()).resolves.toBe(false);
      expect(mocks.create).not.toHaveBeenCalled();
    } finally {
      wrapper.unmount();
    }
  });

  it("creates a receipt with converted amounts, optional remarks and successful prefill memory", async () => {
    const wrapper = await mountForm();
    const vm = state(wrapper);
    try {
      vm.formRef = { validate: vi.fn().mockResolvedValue(true) };
      Object.assign(vm.formData, {
        customerId: "customer-1",
        paymentId: "payment-1",
        amount: 88.99,
        paymentMethod: "ALIPAY"
      });
      await flushPromises();
      vm.formData.details = [
        {
          sourceOrderId: "l1",
          sourceOrderNo: "INV",
          sourceOrderType: "AR_OFFICIAL",
          receivableAmount: 50,
          writeOffAmount: 40,
          remark: "部分"
        },
        {
          sourceOrderId: "l2",
          sourceOrderNo: "INV2",
          sourceOrderType: "AR_OFFICIAL",
          receivableAmount: 20
        }
      ];
      await expect(vm.submit()).resolves.toBe(true);
      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 8899,
          details: [
            {
              sourceOrderId: "l1",
              sourceOrderNo: "INV",
              sourceOrderType: "AR_OFFICIAL",
              receivableAmount: 5000,
              writeOffAmount: 4000,
              remark: "部分"
            },
            {
              sourceOrderId: "l2",
              sourceOrderNo: "INV2",
              sourceOrderType: "AR_OFFICIAL",
              receivableAmount: 2000,
              writeOffAmount: 0
            }
          ]
        })
      );
      await flushPromises();
      expect(mocks.recordCreate).toHaveBeenCalledWith("receipt", {
        customerId: "customer-1",
        paymentId: "payment-1",
        paymentMethod: "ALIPAY"
      });
      expect(mocks.message).toHaveBeenCalledWith("创建成功", {
        type: "success"
      });
    } finally {
      wrapper.unmount();
    }
  });

  it("updates an existing receipt and reports API failures", async () => {
    const wrapper = await mountForm({
      editData: { uid: "receipt-edit", customerId: "c", paymentId: "p" }
    });
    const vm = state(wrapper);
    try {
      vm.formRef = { validate: vi.fn().mockResolvedValue(true) };
      await expect(vm.submit()).resolves.toBe(true);
      expect(mocks.update).toHaveBeenCalledWith(
        "receipt-edit",
        expect.any(Object)
      );
      expect(mocks.message).toHaveBeenCalledWith("更新成功", {
        type: "success"
      });
      expect(mocks.recordCreate).not.toHaveBeenCalled();

      const error = new Error("save");
      mocks.update.mockRejectedValueOnce(error);
      await expect(vm.submit()).resolves.toBe(false);
      expect(mocks.handleError).toHaveBeenCalledWith(error, "操作失败");
    } finally {
      wrapper.unmount();
    }
  });
});

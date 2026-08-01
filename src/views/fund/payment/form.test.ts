import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref } from "vue";
import type { PaymentOrder } from "./types";
import Form from "./form.vue";
import { useFundForm } from "../composables/useFundForm";
import {
  createPaymentOrderApi,
  getOpenPayableLedgersApi,
  updatePaymentOrderApi
} from "@/api/fund/payment-order";
import { loadSettlementDefaults } from "@/composables";
import { handleApiError, message } from "@/utils";

const validateMock = vi.fn<() => Promise<boolean>>();
const resetFieldsMock = vi.fn();
const loadProvidersMock = vi.fn();
const loadPaymentsMock = vi.fn();
const providerList = ref([{ uid: "provider-1", name: "供应商A" }]);
const paymentList = ref([
  { uid: "payment-default", name: "账户A", balance: 500_000 }
]);

vi.mock("../composables/useFundForm", () => ({
  useFundForm: vi.fn()
}));

vi.mock("@/api/fund/payment-order", () => ({
  getOpenPayableLedgersApi: vi.fn().mockResolvedValue({ data: [] }),
  createPaymentOrderApi: vi.fn().mockResolvedValue({ code: 200 }),
  updatePaymentOrderApi: vi.fn().mockResolvedValue({ code: 200 })
}));

vi.mock("@/composables", () => ({
  loadSettlementDefaults: vi.fn()
}));

vi.mock("@/utils", () => ({
  handleApiError: vi.fn(),
  message: vi.fn()
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    error: vi.fn()
  }
}));

function slotContainer(name: string, tag = "div") {
  return defineComponent({
    name,
    setup(_, { slots }) {
      return () => h(tag, {}, slots.default?.());
    }
  });
}

const ElFormStub = defineComponent({
  name: "ElFormStub",
  setup(_, { slots, expose }) {
    expose({
      validate: validateMock,
      resetFields: resetFieldsMock
    });
    return () => h("form", {}, slots.default?.());
  }
});

const PureTable = defineComponent({
  name: "PureTable",
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  setup(_, { slots }) {
    return () => h("div", {}, slots.default?.());
  }
});

function mountForm(props: Record<string, unknown> = {}) {
  return mount(Form, {
    props,
    global: {
      components: {
        PureTable
      },
      stubs: {
        ElForm: ElFormStub,
        ElFormItem: slotContainer("ElFormItemStub"),
        ElInput: true,
        ElSelect: true,
        ElOption: true,
        ElButton: slotContainer("ElButtonStub", "button"),
        ElInputNumber: true,
        ElDatePicker: true,
        ElRow: slotContainer("ElRowStub"),
        ElCol: slotContainer("ElColStub"),
        ElDivider: true
      }
    }
  });
}

async function submitForm(wrapper: ReturnType<typeof mountForm>) {
  const exposed = wrapper.vm.$.exposed as {
    submit: () => Promise<boolean>;
  };
  return exposed.submit();
}

function buildEditData(overrides: Partial<PaymentOrder> = {}): PaymentOrder {
  return {
    id: 1,
    uid: "payment-order-1",
    billNo: "PAY-001",
    providerId: "provider-1",
    paymentId: "payment-default",
    amount: 12_345,
    paymentMethod: "WECHAT",
    status: "DRAFT",
    paymentDate: "2026-04-07",
    remark: "原始备注",
    details: [
      {
        sourceOrderId: "ledger-1",
        sourceOrderNo: "PO-1",
        sourceOrderType: "AP_OFFICIAL",
        payableAmount: 8_000,
        writeOffAmount: 5_000,
        remark: "detail memo"
      }
    ],
    ...overrides
  };
}

describe("Payment Form", () => {
  beforeEach(() => {
    validateMock.mockReset();
    validateMock.mockResolvedValue(true);
    resetFieldsMock.mockReset();
    loadProvidersMock.mockReset();
    loadProvidersMock.mockResolvedValue(undefined);
    loadPaymentsMock.mockReset();
    loadPaymentsMock.mockResolvedValue(undefined);
    providerList.value = [{ uid: "provider-1", name: "供应商A" }];
    paymentList.value = [
      { uid: "payment-default", name: "账户A", balance: 500_000 }
    ];

    vi.mocked(useFundForm).mockReturnValue({
      providerList,
      paymentList,
      loadProviders: loadProvidersMock,
      loadPayments: loadPaymentsMock
    });
    vi.mocked(loadSettlementDefaults).mockReset();
    vi.mocked(loadSettlementDefaults).mockResolvedValue({
      defaultPayableAccount: "payment-default",
      defaultPaymentMethod: "WECHAT"
    });
    vi.mocked(getOpenPayableLedgersApi).mockClear();
    vi.mocked(createPaymentOrderApi).mockClear();
    vi.mocked(updatePaymentOrderApi).mockClear();
    vi.mocked(handleApiError).mockClear();
    vi.mocked(message).mockClear();
  });

  it("creates a payment order with settlement defaults and cent-normalized payload", async () => {
    const wrapper = mountForm({
      initialValues: {
        providerId: "provider-1",
        amount: 123.45,
        remark: "首付款"
      }
    });

    await flushPromises();
    const result = await submitForm(wrapper);

    expect(result).toBe(true);
    expect(loadProvidersMock).toHaveBeenCalledTimes(1);
    expect(loadPaymentsMock).toHaveBeenCalledTimes(1);
    expect(loadSettlementDefaults).toHaveBeenCalledTimes(1);
    expect(createPaymentOrderApi).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: "provider-1",
        paymentId: "payment-default",
        amount: 12_345,
        paymentMethod: "WECHAT",
        remark: "首付款",
        details: []
      })
    );
    expect(message).toHaveBeenCalledWith("创建成功", { type: "success" });
  });

  it("stops submitting when form validation fails", async () => {
    validateMock.mockRejectedValueOnce(new Error("invalid"));

    const wrapper = mountForm({
      initialValues: {
        providerId: "provider-1",
        amount: 10
      }
    });

    await flushPromises();
    await expect(submitForm(wrapper)).resolves.toBe(false);
    expect(createPaymentOrderApi).not.toHaveBeenCalled();
    expect(updatePaymentOrderApi).not.toHaveBeenCalled();
  });

  it("blocks submit when the selected payment balance is insufficient", async () => {
    paymentList.value = [
      { uid: "payment-default", name: "账户A", balance: 5_000 }
    ];

    const wrapper = mountForm({
      initialValues: {
        providerId: "provider-1",
        amount: 100
      }
    });

    await flushPromises();
    await expect(submitForm(wrapper)).resolves.toBe(false);
    expect(message).toHaveBeenCalledWith("账户余额不足", {
      type: "warning"
    });
    expect(createPaymentOrderApi).not.toHaveBeenCalled();
  });

  it("updates edit data while keeping detail amounts stable across yuan/fen conversion", async () => {
    const wrapper = mountForm({
      editData: buildEditData()
    });

    await flushPromises();
    const result = await submitForm(wrapper);

    expect(result).toBe(true);
    expect(updatePaymentOrderApi).toHaveBeenCalledWith(
      "payment-order-1",
      expect.objectContaining({
        providerId: "provider-1",
        paymentId: "payment-default",
        amount: 12_345,
        paymentMethod: "WECHAT",
        details: [
          expect.objectContaining({
            sourceOrderId: "ledger-1",
            sourceOrderNo: "PO-1",
            sourceOrderType: "AP_OFFICIAL",
            payableAmount: 8_000,
            writeOffAmount: 5_000,
            remark: "detail memo"
          })
        ]
      })
    );
    expect(createPaymentOrderApi).not.toHaveBeenCalled();
    expect(message).toHaveBeenCalledWith("更新成功", { type: "success" });
  });
});

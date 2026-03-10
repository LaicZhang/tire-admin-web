import { describe, expect, it, beforeEach, vi } from "vitest";
import { defineComponent, h, ref } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import OtherIncomePage from "../otherIncome/index.vue";
import OtherExpensePage from "../otherExpense/index.vue";
import PaymentPage from "../payment/index.vue";
import ReceiptPage from "../receipt/index.vue";
import TransferPage from "../transfer/index.vue";
import WriteOffPage from "../writeOff/index.vue";

const openDialogSpies: Array<ReturnType<typeof vi.fn>> = [];
const pushMock = vi.fn();

const useManagedSubmitDialogMock = vi.fn(() => {
  const openDialog = vi.fn();
  openDialogSpies.push(openDialog);
  return {
    formRef: ref(null),
    openDialog
  };
});

vi.mock("@/composables/useManagedSubmitDialog", () => ({
  useManagedSubmitDialog: () => useManagedSubmitDialogMock()
}));

vi.mock("@/components/ReIcon/src/hooks", () => ({
  useRenderIcon: () => "icon"
}));

vi.mock("vue-router", async importOriginal => {
  const actual = await importOriginal<typeof import("vue-router")>();
  return {
    ...actual,
    useRouter: () => ({
      push: pushMock
    })
  };
});

vi.mock("@/composables/useConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn().mockResolvedValue(true)
  })
}));

vi.mock("@/composables/useOptions", () => ({
  useOptions: () => ({
    customers: ref([
      { uid: "customer-1", name: "客户A" },
      { uid: "customer-2", name: "客户B" }
    ]),
    providers: ref([
      { uid: "provider-1", name: "供应商A" },
      { uid: "provider-2", name: "供应商B" }
    ])
  })
}));

vi.mock("@/utils", async importOriginal => {
  const actual = await importOriginal<typeof import("@/utils")>();
  return {
    ...actual,
    message: vi.fn(),
    handleApiError: vi.fn()
  };
});

vi.mock("@/utils/error", () => ({
  handleApiError: vi.fn()
}));

vi.mock("../utils/tablePresentation", () => ({
  exportRowsAsCsv: vi.fn(),
  printRows: vi.fn()
}));

vi.mock("@/api/business/advance-payment", () => ({
  getAdvancePaymentList: vi.fn().mockResolvedValue({
    code: 200,
    data: {
      list: [
        {
          id: 1,
          billNo: "YSK-001",
          remainingAmount: "1200",
          customerName: "客户A"
        }
      ],
      total: 1
    }
  }),
  deleteAdvancePayment: vi.fn(),
  writeOffAdvancePayment: vi.fn()
}));

vi.mock("@/api/fund/payment-order", () => ({
  getPaymentOrderListApi: vi.fn().mockResolvedValue({
    data: {
      list: [
        {
          uid: "payment-order-1",
          billNo: "FKD-001",
          providerName: "供应商A",
          status: "DRAFT"
        }
      ],
      total: 1
    }
  }),
  approvePaymentOrderApi: vi.fn(),
  deletePaymentOrderApi: vi.fn()
}));

vi.mock("@/api/fund/other-income", () => ({
  getOtherIncomeListApi: vi.fn().mockResolvedValue({
    data: {
      list: [
        {
          uid: "income-1",
          billNo: "SR-001",
          customerId: "customer-1",
          customerName: "客户A",
          unpaidAmount: 3600,
          status: "DRAFT"
        }
      ],
      total: 1
    }
  }),
  deleteOtherIncomeApi: vi.fn()
}));

vi.mock("@/api/fund/other-expense", () => ({
  getOtherExpenseListApi: vi.fn().mockResolvedValue({
    data: {
      list: [
        {
          uid: "expense-1",
          billNo: "ZC-001",
          providerId: "provider-1",
          providerName: "供应商A",
          unpaidAmount: 5200,
          status: "DRAFT"
        }
      ],
      total: 1
    }
  }),
  deleteOtherExpenseApi: vi.fn()
}));

vi.mock("@/api/fund/transfer", () => ({
  getTransferListApi: vi.fn().mockResolvedValue({
    data: {
      list: [
        {
          uid: "transfer-1",
          billNo: "ZZ-001",
          status: "DRAFT"
        }
      ],
      total: 1
    }
  }),
  approveTransferApi: vi.fn(),
  deleteTransferApi: vi.fn()
}));

vi.mock("@/api/payment", () => ({
  getPaymentListApi: vi.fn().mockResolvedValue({
    data: [{ uid: "payment-1", name: "账户A" }]
  })
}));

vi.mock("@/api/fund/write-off-order", () => ({
  getWriteOffListApi: vi.fn().mockResolvedValue({
    data: {
      list: [
        {
          uid: "writeoff-1",
          billNo: "HX-001",
          businessType: "ADVANCE_RECEIVABLE",
          status: "DRAFT",
          isApproved: false
        }
      ],
      total: 1
    }
  }),
  approveWriteOffApi: vi.fn(),
  rejectWriteOffApi: vi.fn(),
  deleteWriteOffApi: vi.fn()
}));

const PureTableBarStub = defineComponent({
  name: "PureTableBarStub",
  props: {
    columns: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { slots }) {
    return () =>
      h("div", [
        h("div", { class: "toolbar-buttons" }, slots.buttons?.()),
        slots.default?.({ size: "default", dynamicColumns: props.columns })
      ]);
  }
});

const PureTableStub = defineComponent({
  name: "PureTableStub",
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        { class: "pure-table" },
        (props.data as Array<Record<string, unknown>>).map((row, index) =>
          h("div", { class: "table-row", key: String(index) }, [
            slots.operation?.({ row, size: "default", index }),
            slots.status?.({ row }),
            slots.expenseType?.({ row }),
            slots.incomeType?.({ row }),
            slots.amount?.({ row })
          ])
        )
      );
  }
});

const PageContainerStub = defineComponent({
  name: "PageContainerStub",
  setup(_, { slots }) {
    return () =>
      h("div", [
        h("div", { class: "search-slot" }, slots.search?.()),
        slots.default?.()
      ]);
  }
});

const ReSearchFormStub = defineComponent({
  name: "ReSearchFormStub",
  setup(_, { slots }) {
    return () => h("div", { class: "re-search-form" }, slots.default?.());
  }
});

const StatusTagStub = defineComponent({
  name: "StatusTagStub",
  setup() {
    return () => h("span", { class: "status-tag" }, "status");
  }
});

function mountPage(component: object) {
  return mount(component, {
    global: {
      plugins: [ElementPlus],
      stubs: {
        PageContainer: PageContainerStub,
        PureTableBar: PureTableBarStub,
        "pure-table": PureTableStub,
        ReSearchForm: ReSearchFormStub,
        StatusTag: StatusTagStub
      }
    }
  });
}

function getButtonByText(wrapper: ReturnType<typeof mount>, text: string) {
  const button = wrapper
    .findAll("button")
    .find(item => item.text().includes(text));
  expect(button, `button "${text}" should exist`).toBeTruthy();
  return button!;
}

beforeEach(() => {
  openDialogSpies.length = 0;
  pushMock.mockReset();
  useManagedSubmitDialogMock.mockClear();
});

describe("fund dialog openers", () => {
  it("opens receipt dialog from receipt page add button", async () => {
    const wrapper = mountPage(ReceiptPage);
    await flushPromises();

    await getButtonByText(wrapper, "新建").trigger("click");

    expect(openDialogSpies).toHaveLength(1);
    expect(openDialogSpies[0]).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "新建预收款",
        width: "560px"
      })
    );
  });

  it("opens payment dialog from payment page add and edit actions", async () => {
    const wrapper = mountPage(PaymentPage);
    await flushPromises();

    await getButtonByText(wrapper, "新建付款单").trigger("click");
    expect(openDialogSpies[0]).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "新建付款单",
        width: "800px"
      })
    );
    expect(openDialogSpies[0].mock.calls[0][0].buildProps()).toEqual({
      editData: null
    });

    await getButtonByText(wrapper, "编辑").trigger("click");
    expect(openDialogSpies[0]).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: "编辑付款单",
        width: "800px"
      })
    );
    expect(openDialogSpies[0].mock.calls[1][0].buildProps()).toEqual({
      editData: expect.objectContaining({
        uid: "payment-order-1"
      })
    });
  });

  it("opens income dialog and receipt dialog with initial values", async () => {
    const wrapper = mountPage(OtherIncomePage);
    await flushPromises();

    await getButtonByText(wrapper, "新增收入单").trigger("click");
    expect(openDialogSpies[0]).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "新建其他收入单",
        width: "600px"
      })
    );

    await getButtonByText(wrapper, "收款").trigger("click");
    expect(openDialogSpies[1]).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "登记收款",
        width: "560px"
      })
    );
    expect(openDialogSpies[1].mock.calls[0][0].buildProps()).toEqual({
      initialValues: {
        customerId: "customer-1",
        amount: 36,
        remark: "其他收入单 SR-001 收款"
      }
    });
  });

  it("opens expense dialog and payment dialog with initial values", async () => {
    const wrapper = mountPage(OtherExpensePage);
    await flushPromises();

    await getButtonByText(wrapper, "新增支出单").trigger("click");
    expect(openDialogSpies[0]).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "新建其他支出单",
        width: "600px"
      })
    );

    await getButtonByText(wrapper, "付款").trigger("click");
    expect(openDialogSpies[1]).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "登记付款",
        width: "800px"
      })
    );
    expect(openDialogSpies[1].mock.calls[0][0].buildProps()).toEqual({
      initialValues: {
        providerId: "provider-1",
        amount: 52,
        remark: "其他支出单 ZC-001 付款"
      }
    });
  });

  it("opens transfer dialog with custom confirm text", async () => {
    const wrapper = mountPage(TransferPage);
    await getButtonByText(wrapper, "新建转账单").trigger("click");

    expect(openDialogSpies[0]).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "新建转账单",
        width: "600px",
        confirmText: "确认转账"
      })
    );
  }, 10000);

  it("opens write-off dialog from add button", async () => {
    const wrapper = mountPage(WriteOffPage);
    await getButtonByText(wrapper, "新建核销单").trigger("click");

    expect(openDialogSpies[0]).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "新建核销单",
        width: "700px"
      })
    );
  }, 10000);
});

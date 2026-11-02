import { flushPromises } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  getItem: vi.fn(),
  message: vi.fn(),
  lastHeader: vi.fn(),
  inventoryDefaults: vi.fn(),
  loggerError: vi.fn()
}));

vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  ALL_LIST: { tire: "tire", repo: "repo", manager: "manager" },
  localForage: () => ({ getItem: mocks.getItem }),
  message: mocks.message
}));
vi.mock("@/composables", () => ({
  applyLastFormHeaderAsync: mocks.lastHeader,
  loadInventoryDefaults: mocks.inventoryDefaults
}));
vi.mock("@/utils/logger", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils/logger")>()),
  logger: { error: mocks.loggerError }
}));

import InboundForm from "../form.vue";

function inbound(overrides: Record<string, unknown> = {}) {
  return {
    uid: "inbound-1",
    docNo: "RK-001",
    providerId: "provider-1",
    providerName: "供应商",
    sourceMode: "MANUAL",
    count: 2,
    total: 300,
    showTotal: 300,
    paidAmount: 100,
    status: true,
    isApproved: false,
    isLocked: false,
    details: [
      {
        uid: "detail-1",
        tireId: "tire-1",
        count: 2,
        unitPrice: 150,
        total: 300,
        repoId: "repo-existing",
        serialNumbers: [{ serialNo: "SN-2" }],
        serialNosText: "",
        desc: ""
      }
    ],
    ...overrides
  };
}

const FormItemStub = defineComponent({
  props: { label: { type: String, default: "" } },
  setup(props, { slots }) {
    return () =>
      h("div", { class: "form-item" }, [
        props.label ? h("span", props.label) : null,
        slots.default?.()
      ]);
  }
});

async function mountForm(title = "新增", value = inbound()) {
  return mountSmokeComponent(
    async () => ({ default: InboundForm }),
    "purchase/inbound/form.vue",
    {
      keepMounted: true,
      props: { formTitle: title, formInline: value },
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
  mocks.getItem.mockImplementation(async (key: string) =>
    key === "tire"
      ? [{ uid: "tire-1", name: "轮胎一" }]
      : key === "repo"
        ? [{ uid: "repo-1", name: "主仓" }]
        : [{ uid: "manager-1", name: "负责人" }]
  );
  mocks.lastHeader.mockResolvedValue(null);
  mocks.inventoryDefaults.mockResolvedValue({ defaultWarehouseId: "repo-1" });
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("purchase inbound form behavior", () => {
  it("loads lookups, warehouse defaults and applies safe create prefill data", async () => {
    mocks.lastHeader.mockImplementationOnce(
      async (target: Record<string, unknown>) => {
        target.providerId = "provider-2";
        target.providerName = "新供应商";
        target.paymentId = "payment-2";
        target.repoId = "repo-2";
        return target;
      }
    );
    const wrapper = await mountForm(
      "新增",
      inbound({
        providerId: "",
        providerName: "",
        paymentId: "",
        details: [
          { tireId: "tire-1", count: 1, unitPrice: 1, total: 1, repoId: "" },
          {
            tireId: "tire-2",
            count: 1,
            unitPrice: 1,
            total: 1,
            repoId: "repo-keep"
          }
        ]
      })
    );
    const vm = state(wrapper);
    try {
      await flushPromises();
      expect(mocks.getItem.mock.calls.map(call => call[0])).toEqual([
        "tire",
        "repo",
        "manager"
      ]);
      expect(vm.allTireList).toEqual([{ uid: "tire-1", name: "轮胎一" }]);
      expect(vm.allRepoList).toEqual([{ uid: "repo-1", name: "主仓" }]);
      expect(vm.managerList).toEqual([{ uid: "manager-1", name: "负责人" }]);
      expect(vm.defaultWarehouseId).toBe("repo-2");
      expect(vm.formData).toMatchObject({
        providerId: "provider-2",
        providerName: "新供应商",
        paymentId: "payment-2"
      });
      expect(vm.formData.details.map((row: any) => row.repoId)).toEqual([
        "repo-2",
        "repo-keep"
      ]);
      expect(wrapper.text()).toContain("入库明细");
      expect(wrapper.text()).toContain("金额汇总");
    } finally {
      wrapper.unmount();
    }
  });

  it("falls back for base-data failures and logs default/prefill failures", async () => {
    const wrapper = await mountForm();
    const vm = state(wrapper);
    try {
      mocks.getItem
        .mockReset()
        .mockResolvedValueOnce(null)
        .mockRejectedValueOnce(new Error("base"))
        .mockResolvedValueOnce(null);
      await vm.loadBaseData();
      expect(mocks.message).toHaveBeenCalledWith("加载基础数据失败", {
        type: "error"
      });
      expect(vm.allTireList).toEqual([{ uid: "tire-1", name: "轮胎一" }]);
      expect(vm.allRepoList).toEqual([{ uid: "repo-1", name: "主仓" }]);
      expect(vm.managerList).toEqual([{ uid: "manager-1", name: "负责人" }]);

      mocks.inventoryDefaults.mockRejectedValueOnce(new Error("defaults"));
      await vm.loadDefaultWarehouseId();
      expect(mocks.loggerError).toHaveBeenCalledWith(
        "[InventoryDefaults] load failed",
        expect.any(Error)
      );

      mocks.lastHeader.mockRejectedValueOnce(new Error("prefill"));
      await vm.applyLastUsedPrefill();
      expect(mocks.loggerError).toHaveBeenCalledWith(
        "[LastForm] purchaseInbound prefill failed",
        expect.any(Error)
      );
    } finally {
      wrapper.unmount();
    }
  });

  it("skips prefill outside create mode and ignores absent or non-string fields", async () => {
    const edit = await mountForm("修改");
    try {
      await state(edit).applyLastUsedPrefill();
      expect(mocks.lastHeader).not.toHaveBeenCalled();

      mocks.lastHeader.mockImplementationOnce(
        async (target: Record<string, unknown>) => {
          target.providerId = 99;
          target.providerName = "";
          target.paymentId = false;
          target.repoId = "";
          return {};
        }
      );
      await state(edit).applyLastUsedPrefill();
      expect(state(edit).formData.providerId).toBe("provider-1");
      expect(state(edit).defaultWarehouseId).toBe("repo-1");

      mocks.lastHeader.mockResolvedValueOnce(null);
      await state(edit).applyLastUsedPrefill();
    } finally {
      edit.unmount();
    }
  });

  it("prepares details with serial text and tolerates missing collections", async () => {
    const wrapper = await mountForm();
    const vm = state(wrapper);
    try {
      expect(vm.formData.details[0]).toMatchObject({
        serialNosText: "SN-2",
        serialNumbers: [{ serialNo: "SN-2" }]
      });
      expect(
        vm.prepareDetail({
          tireId: "t",
          count: 1,
          unitPrice: 1,
          total: 1,
          serialNosText: "manual"
        })
      ).toMatchObject({
        serialNumbers: [],
        serialNosText: "manual"
      });
      expect(
        vm.prepareFormData({ ...inbound(), details: undefined }).details
      ).toEqual([]);
    } finally {
      wrapper.unmount();
    }
  });

  it("derives document, source and audit labels and readonly capabilities", async () => {
    const wrapper = await mountForm(
      "审核",
      inbound({
        docNo: "",
        number: 88,
        sourceMode: "PO_LINKED",
        sourcePurchaseOrder: { number: "PO-9" },
        isApproved: false,
        rejectReason: "数量不符"
      })
    );
    const vm = state(wrapper);
    try {
      expect(vm.orderNumberText).toBe("88");
      expect(vm.sourcePurchaseOrderText).toBe("PO-9");
      expect(vm.sourceModeLabel).toBe("采购订单生成");
      expect(vm.isReadOnly).toBe(true);
      expect(vm.canEditHeader).toBe(false);
      expect(vm.canEditDetails).toBe(false);
      expect(wrapper.text()).toContain("审核信息");
      expect(wrapper.text()).toContain("拒绝原因");
      expect(vm.formData.rejectReason).toBe("数量不符");
    } finally {
      wrapper.unmount();
    }
  });

  it("adds, recalculates, synchronizes serials and deletes detail rows", async () => {
    const wrapper = await mountForm();
    const vm = state(wrapper);
    try {
      vm.formData.details = [];
      vm.formData.count = undefined;
      vm.formData.total = undefined;
      vm.formData.showTotal = undefined;
      vm.onAddDetail();
      expect(vm.formData.details[0]).toMatchObject({
        count: 1,
        total: 0,
        repoId: "repo-1"
      });

      const row = vm.formData.details[0];
      Object.assign(row, {
        count: 2,
        unitPrice: 3,
        total: 6,
        serialNosText: "SN-1, DOT-1, 2025, 12, remark\nSN-2\nSN-1"
      });
      vm.syncDetailSerialNumbers(row);
      expect(row.count).toBe(2);
      expect(row.serialNumbers).toEqual([
        {
          serialNo: "SN-1",
          dotCode: "DOT-1",
          dotYear: 2025,
          dotWeek: 12,
          remark: "remark"
        },
        { serialNo: "SN-2" }
      ]);
      expect(row.total).toBe(6);
      expect(vm.formData.count).toBe(2);
      expect(vm.formData.showTotal).toBe(6);

      row.serialNosText = "";
      row.count = 5;
      vm.syncDetailSerialNumbers(row);
      expect(row.serialNumbers).toEqual([]);
      expect(row.count).toBe(5);
      expect(row.total).toBe(15);

      vm.formData.details.push({
        tireId: "t2",
        count: 2,
        unitPrice: 5,
        total: 10
      });
      vm.recalcOrderTotal();
      expect(vm.formData.count).toBe(7);
      expect(vm.formData.total).toBe(25);
      vm.onDeleteDetail(1);
      expect(vm.formData.details).toHaveLength(1);
      vm.onDeleteDetail(0);
      expect(vm.formData.details).toEqual([]);
      expect(vm.formData.count).toBe(0);
      expect(vm.formData.total).toBe(0);
    } finally {
      wrapper.unmount();
    }
  });
});

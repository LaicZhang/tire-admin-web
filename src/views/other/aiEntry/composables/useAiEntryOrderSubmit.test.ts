import { computed, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DocumentType,
  UploadMethod,
  documentTypeConfig,
  type OrderDetailRow
} from "../types";

const mocks = vi.hoisted(() => ({
  message: vi.fn(),
  loadInventoryDefaults: vi.fn(),
  getCompanyId: vi.fn(),
  getCompanyConnect: vi.fn(),
  addCustomer: vi.fn(),
  addProvider: vi.fn(),
  addTire: vi.fn(),
  createPurchaseOrder: vi.fn(),
  createPurchaseInbound: vi.fn(),
  createPurchaseReturn: vi.fn(),
  createSalesOrder: vi.fn(),
  createSalesReturn: vi.fn(),
  user: { uid: "user-1" }
}));

vi.mock("@/utils/message", () => ({ message: mocks.message }));
vi.mock("uuid", () => ({ v7: () => "fixed-uuid" }));
vi.mock("@/composables/useInventoryDefaults", () => ({
  loadInventoryDefaults: mocks.loadInventoryDefaults
}));
vi.mock("@/api", () => ({
  getCompanyId: mocks.getCompanyId,
  getCompanyConnect: mocks.getCompanyConnect
}));
vi.mock("@/api/business/customer", () => ({
  addCustomerApi: mocks.addCustomer
}));
vi.mock("@/api/business/provider", () => ({
  addProviderApi: mocks.addProvider
}));
vi.mock("@/api/business/tire", () => ({ addTireApi: mocks.addTire }));
vi.mock("@/api/purchase", () => ({
  createPurchaseOrderApi: mocks.createPurchaseOrder,
  createPurchaseInboundApi: mocks.createPurchaseInbound,
  createPurchaseReturnOrderApi: mocks.createPurchaseReturn
}));
vi.mock("@/api/sales", () => ({
  createSalesOrderApi: mocks.createSalesOrder,
  createSalesReturnOrderApi: mocks.createSalesReturn
}));
vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: () => mocks.user
}));

import { useAiEntryOrderSubmit } from "./useAiEntryOrderSubmit";

function setup(type: DocumentType = DocumentType.SALE_ORDER) {
  const config = computed(() => documentTypeConfig[type]);
  const autoCreate = ref(false);
  return {
    api: useAiEntryOrderSubmit(config, autoCreate),
    autoCreate,
    type
  };
}

function fill(
  api: ReturnType<typeof setup>["api"],
  overrides: Record<string, unknown> = {},
  details: OrderDetailRow[] = [
    {
      id: "1",
      productUid: "tire-1",
      productName: "轮胎",
      quantity: 2,
      price: 12.345,
      amount: 24.69,
      remark: "备注",
      isNew: false
    }
  ]
) {
  api.orderForm.value = {
    documentType: DocumentType.SALE_ORDER,
    partyUid: "party-1",
    partyName: "客户",
    warehouseUid: "repo-1",
    orderDate: "2026-01-01",
    details,
    totalAmount: 0,
    remark: "备注",
    ...overrides
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.uid = "user-1";
  mocks.getCompanyId.mockReturnValue("company-1");
  mocks.getCompanyConnect.mockImplementation((uid?: string) => ({
    connect: { uid: uid ?? "company-1" }
  }));
  mocks.loadInventoryDefaults.mockResolvedValue({
    defaultWarehouseId: "repo-default"
  });
  for (const fn of [
    mocks.addCustomer,
    mocks.addProvider,
    mocks.addTire,
    mocks.createPurchaseOrder,
    mocks.createPurchaseInbound,
    mocks.createPurchaseReturn,
    mocks.createSalesOrder,
    mocks.createSalesReturn
  ]) {
    fn.mockResolvedValue({ code: 200, data: { id: "order-created" } });
  }
});

describe("detail state", () => {
  it("adds, updates, removes and totals rows", () => {
    const { api } = setup();
    api.addDetailRow();
    expect(api.orderForm.value.details[0]).toMatchObject({
      productName: "",
      quantity: 1,
      isNew: true
    });

    api.updateDetailRow(0, "quantity", 3);
    api.updateDetailRow(0, "price", 4);
    expect(api.orderForm.value.details[0].amount).toBe(12);
    expect(api.totalAmount.value).toBe(12);

    api.updateDetailRow(0, "productName", "轮胎");
    api.updateDetailRow(0, "isNew", false);
    expect(api.orderForm.value.details[0].productName).toBe("轮胎");
    expect(api.hasUnmatchedProducts.value).toBe(true);

    api.removeDetailRow(0);
    expect(api.orderForm.value.details).toEqual([]);
    expect(api.totalAmount.value).toBe(0);
  });

  it("formats file sizes across units", () => {
    const { api } = setup();
    expect(api.formatFileSize(10)).toBe("10 B");
    expect(api.formatFileSize(2048)).toBe("2.0 KB");
    expect(api.formatFileSize(3 * 1024 * 1024)).toBe("3.0 MB");
  });

  it("resets the form to the selected document type", () => {
    const { api } = setup();
    api.addDetailRow();
    api.resetForm(DocumentType.PURCHASE_RETURN);
    expect(api.orderForm.value).toMatchObject({
      documentType: DocumentType.PURCHASE_RETURN,
      details: [],
      totalAmount: 0
    });
  });
});

describe("submit validation", () => {
  it("requires at least one row", async () => {
    const { api } = setup();
    await expect(
      api.submitOrder(UploadMethod.TEXT, DocumentType.SALE_ORDER)
    ).resolves.toBe(false);
    expect(mocks.message).toHaveBeenCalledWith("请添加商品明细", {
      type: "warning"
    });
  });

  it("rejects more than 300 rows", async () => {
    const { api } = setup();
    fill(
      api,
      {},
      Array.from({ length: 301 }, (_, i) => ({
        id: String(i),
        productUid: "t",
        productName: "t",
        quantity: 1,
        price: 1,
        isNew: false
      }))
    );
    await expect(
      api.submitOrder(UploadMethod.TEXT, DocumentType.SALE_ORDER)
    ).resolves.toBe(false);
    expect(mocks.message).toHaveBeenCalledWith("单据明细最多支持 300 行", {
      type: "error"
    });
  });

  it("rejects unmatched products without automatic creation", async () => {
    const { api } = setup();
    fill(api, {}, [
      { id: "1", productName: "新胎", quantity: 1, price: 1, isNew: false }
    ]);
    await expect(
      api.submitOrder(UploadMethod.TEXT, DocumentType.SALE_ORDER)
    ).resolves.toBe(false);
    expect(mocks.message).toHaveBeenCalledWith(
      "存在未匹配的商品，请手动选择或开启智能新增基础资料",
      { type: "warning" }
    );
  });

  it("reports creation failures from the API", async () => {
    mocks.createSalesOrder.mockResolvedValue({ code: 500, msg: "后端拒绝" });
    const { api } = setup();
    fill(api);
    await expect(
      api.submitOrder(UploadMethod.TEXT, DocumentType.SALE_ORDER)
    ).resolves.toBe(false);
    expect(mocks.message).toHaveBeenCalledWith("后端拒绝", { type: "error" });
    expect(api.historyRecords.value).toEqual([]);
  });

  it("uses generic text when a non-Error is thrown", async () => {
    mocks.createSalesOrder.mockRejectedValue("bad");
    const { api } = setup();
    fill(api);
    await expect(
      api.submitOrder(UploadMethod.TEXT, DocumentType.SALE_ORDER)
    ).resolves.toBe(false);
    expect(mocks.message).toHaveBeenCalledWith("提交失败，请重试", {
      type: "error"
    });
  });
});

describe("automatic basic data creation", () => {
  it("creates missing customer and product records and submits", async () => {
    mocks.addCustomer.mockResolvedValue({
      code: 200,
      data: { uid: "customer-created" }
    });
    mocks.addTire.mockResolvedValue({
      code: 200,
      data: { uid: "tire-created" }
    });
    const { api, autoCreate } = setup();
    autoCreate.value = true;
    fill(api, { partyUid: undefined, partyName: " 新客户 " }, [
      { id: "1", productName: "新胎", quantity: 1, price: 5, isNew: false }
    ]);

    await expect(
      api.submitOrder(UploadMethod.TEXT, DocumentType.SALE_ORDER)
    ).resolves.toBe(true);

    expect(mocks.addCustomer).toHaveBeenCalledWith({
      customer: expect.objectContaining({ name: "新客户" }),
      info: {}
    });
    expect(mocks.addTire).toHaveBeenCalledWith({ name: "新胎", price: 5 });
    expect(mocks.createSalesOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        order: expect.objectContaining({
          customer: { connect: { uid: "customer-created" } }
        }),
        details: [expect.objectContaining({ tireId: "tire-created" })]
      })
    );
  });

  it("creates a missing provider for purchase documents", async () => {
    mocks.addProvider.mockResolvedValue({
      code: 200,
      data: { uid: "provider-created" }
    });
    const { api, autoCreate } = setup(DocumentType.PURCHASE_ORDER);
    autoCreate.value = true;
    fill(api, {
      partyUid: undefined,
      partyName: "供应商甲",
      warehouseUid: "repo-1"
    });
    api.orderForm.value.documentType = DocumentType.PURCHASE_ORDER;

    await expect(
      api.submitOrder(UploadMethod.TEXT, DocumentType.PURCHASE_ORDER)
    ).resolves.toBe(true);
    expect(mocks.addProvider).toHaveBeenCalled();
    expect(mocks.createPurchaseOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        order: expect.objectContaining({
          provider: { connect: { uid: "provider-created" } }
        })
      })
    );
  });

  it("falls back to the default warehouse and records a uid result", async () => {
    mocks.createSalesOrder.mockResolvedValue({
      code: 200,
      data: { uid: "order-uid" }
    });
    const { api } = setup();
    fill(api, { warehouseUid: undefined });

    await expect(
      api.submitOrder(UploadMethod.IMAGE, DocumentType.SALE_ORDER)
    ).resolves.toBe(true);
    expect(mocks.loadInventoryDefaults).toHaveBeenCalled();
    expect(api.historyRecords.value[0]).toMatchObject({
      method: UploadMethod.IMAGE,
      success: true,
      resultOrderUid: "order-uid"
    });
  });

  it("omits the result uid when the response has none", async () => {
    mocks.createSalesOrder.mockResolvedValue({ code: 200, data: {} });
    const { api } = setup();
    fill(api);
    await expect(
      api.submitOrder(UploadMethod.TEXT, DocumentType.SALE_ORDER)
    ).resolves.toBe(true);
    expect(api.historyRecords.value[0].resultOrderUid).toBeUndefined();
  });

  it("reports missing warehouse and missing party", async () => {
    const { api } = setup();
    fill(api, { warehouseUid: undefined });
    mocks.loadInventoryDefaults.mockResolvedValue({});
    await expect(
      api.submitOrder(UploadMethod.TEXT, DocumentType.SALE_ORDER)
    ).resolves.toBe(false);
    expect(mocks.message).toHaveBeenCalledWith(
      "未配置默认仓库，无法创建正式单据",
      { type: "error" }
    );

    mocks.loadInventoryDefaults.mockResolvedValue({
      defaultWarehouseId: "repo-1"
    });
    fill(api, { partyUid: undefined, partyName: " " });
    await expect(
      api.submitOrder(UploadMethod.TEXT, DocumentType.SALE_ORDER)
    ).resolves.toBe(false);
    expect(mocks.message).toHaveBeenCalledWith("未识别到客户", {
      type: "error"
    });
  });

  it("requires a user uid for automatic party creation", async () => {
    mocks.user.uid = "";
    const { api, autoCreate } = setup();
    autoCreate.value = true;
    fill(api, { partyUid: undefined, partyName: "新客户" });
    await expect(
      api.submitOrder(UploadMethod.TEXT, DocumentType.SALE_ORDER)
    ).resolves.toBe(false);
    expect(mocks.message).toHaveBeenCalledWith(
      "当前用户缺少 uid，无法自动创建往来单位",
      { type: "error" }
    );
  });

  it("continues when automatic product creation fails", async () => {
    mocks.addTire.mockResolvedValue({ code: 500, data: {} });
    const { api, autoCreate } = setup();
    autoCreate.value = true;
    fill(api, {}, [
      { id: "1", productName: "新胎", quantity: 1, price: 5, isNew: false }
    ]);
    await expect(
      api.submitOrder(UploadMethod.TEXT, DocumentType.SALE_ORDER)
    ).resolves.toBe(false);
    expect(mocks.message).toHaveBeenCalledWith(
      "存在未匹配的商品，请补充商品信息或开启智能新增基础资料",
      { type: "error" }
    );
  });

  it("skips products already resolved and leaves blank products unmatched", async () => {
    const { api, autoCreate } = setup();
    autoCreate.value = true;
    fill(api, {}, [
      {
        id: "1",
        productUid: "tire-1",
        productName: "已选",
        quantity: 1,
        price: 1,
        isNew: false
      },
      { id: "2", productName: " ", quantity: 1, price: 1, isNew: false }
    ]);
    await expect(
      api.submitOrder(UploadMethod.TEXT, DocumentType.SALE_ORDER)
    ).resolves.toBe(false);
    expect(mocks.addTire).not.toHaveBeenCalled();
    expect(mocks.message).toHaveBeenCalledWith(
      "存在未匹配的商品，请补充商品信息或开启智能新增基础资料",
      { type: "error" }
    );
  });
});

describe("document API mapping", () => {
  it.each([
    [DocumentType.PURCHASE_ORDER, mocks.createPurchaseOrder, "provider"],
    [DocumentType.PURCHASE_INBOUND, mocks.createPurchaseInbound, "provider"],
    [DocumentType.PURCHASE_RETURN, mocks.createPurchaseReturn, "provider"],
    [DocumentType.SALE_ORDER, mocks.createSalesOrder, "customer"],
    [DocumentType.SALE_OUTBOUND, mocks.createSalesOrder, "customer"],
    [DocumentType.SALE_RETURN, mocks.createSalesReturn, "customer"]
  ])("submits %s through its API", async (type, createApi, partyKey) => {
    const { api } = setup(type);
    fill(api, { warehouseUid: "repo-1" });
    api.orderForm.value.documentType = type;

    await expect(api.submitOrder(UploadMethod.TEXT, type)).resolves.toBe(true);

    expect(createApi).toHaveBeenCalledOnce();
    const payload = createApi.mock.calls[0][0];
    expect(payload.order[partyKey]).toEqual({ connect: { uid: "party-1" } });
    expect(payload.order.company).toEqual({ connect: { uid: "company-1" } });
    expect(payload.details[0]).toMatchObject({
      companyId: "company-1",
      tireId: "tire-1",
      count: 2,
      repoId: "repo-1",
      unitPrice: 1235,
      desc: "备注"
    });
    if (
      [DocumentType.PURCHASE_RETURN, DocumentType.SALE_RETURN].includes(type)
    ) {
      expect(payload.details[0].returnReason).toBe("other");
    } else if (
      [DocumentType.SALE_ORDER, DocumentType.SALE_OUTBOUND].includes(type)
    ) {
      expect(payload.details[0].totalAmount).toBe(2470);
    } else {
      expect(payload.details[0].total).toBe(2470);
    }
  });

  it("normalizes quantity, price and remark defaults", async () => {
    const { api } = setup();
    fill(api, {}, [
      {
        id: "1",
        productUid: "tire-1",
        productName: "轮胎",
        quantity: 0.2,
        price: "bad",
        remark: "备注",
        isNew: false
      } as unknown as OrderDetailRow
    ]);
    await api.submitOrder(UploadMethod.TEXT, DocumentType.SALE_ORDER);
    const detail = mocks.createSalesOrder.mock.calls[0][0].details[0];
    expect(detail).toMatchObject({
      count: 1,
      unitPrice: 0,
      totalAmount: 0,
      desc: "备注"
    });
  });
});

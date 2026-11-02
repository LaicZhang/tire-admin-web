vi.mock("@/utils/viewport", () => ({
  resolveDialogFullscreen: () => false,
  isMobileViewport: () => false,
  hideOnMobile: () => false
}));
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";

const { storage, messageMock } = vi.hoisted(() => ({
  storage: new Map<string, unknown>(),
  messageMock: vi.fn()
}));

vi.mock("@pureadmin/utils", async importOriginal => {
  const actual = await importOriginal<typeof import("@pureadmin/utils")>();
  return {
    ...actual
  };
});

vi.mock("@/utils/message", () => ({
  message: messageMock
}));

vi.mock("@/utils", async importOriginal => {
  const actual = await importOriginal<typeof import("@/utils")>();
  return {
    ...actual,
    localForage: () => ({
      getItem: async (key: string) => storage.get(key) ?? null
    })
  };
});

vi.mock("@/api", () => ({
  getCompanyId: vi.fn(),
  getCompanyConnect: vi.fn((id: string) => ({ connect: { uid: id } })),
  addOrderApi: vi.fn(),
  updateOrderApi: vi.fn(),
  auditOrderApi: vi.fn(),
  payPurchaseOrderApi: vi.fn(),
  paySaleOrderApi: vi.fn(),
  processClaimOrderPaymentApi: vi.fn(),
  settleSupplierClaimOrderApi: vi.fn(),
  refundReturnOrderApi: vi.fn()
}));

vi.mock("@/composables/useDialogService", () => ({
  addDialog: vi.fn()
}));

const formHandle = vi.hoisted(() => ({ validate: vi.fn() }));
vi.mock("./form.vue", async () => {
  const { defineComponent, h } = await import("vue");
  return {
    default: defineComponent({
      setup(_props, { expose }) {
        expose({ formRef: formHandle });
        return () => h("div", { class: "form-stub" });
      }
    })
  };
});

import { ALL_LIST, CUR_FORM_TITLE, CUR_ORDER_TYPE, ORDER_TYPE } from "@/utils";
import type { DialogOptions } from "@/composables/useDialogService";
import {
  buildAuditOrderPayload,
  buildCreateOrderPayload,
  buildRefundPayload,
  getAllCustomerList,
  getAllProviderList,
  getAllRepoList,
  getAllTireList,
  getFormTileInLocal,
  getOrderType,
  handleSelectionChange,
  openDialog
} from "./table";
import {
  addOrderApi,
  auditOrderApi,
  getCompanyId,
  payPurchaseOrderApi,
  paySaleOrderApi,
  processClaimOrderPaymentApi,
  refundReturnOrderApi,
  settleSupplierClaimOrderApi,
  updateOrderApi
} from "@/api";
import { addDialog } from "@/composables/useDialogService";
import { useUserStoreHook } from "@/store/modules/user";

const mountedHosts: VueWrapper[] = [];

function latestDialogOptions() {
  return vi.mocked(addDialog).mock.calls.at(-1)?.[0] as DialogOptions;
}

async function renderDialog(options: DialogOptions) {
  const host = mount({
    render: () => options.contentRenderer?.({ options, index: 0 })
  });
  mountedHosts.push(host);
  await nextTick();
  await flushPromises();
  return host;
}

function dialogForm(options: DialogOptions) {
  return (
    options.props as {
      formInline: {
        name?: string;
        uid?: string;
        details?: Array<Record<string, unknown>>;
        attachments?: unknown;
      };
    }
  ).formInline;
}

async function submitDialog(
  title: string,
  type: string,
  row: Record<string, unknown> = { name: "测试订单" },
  details: Array<Record<string, unknown>> = [
    { index: 0, tireId: "tire-1", repoId: "repo-1", count: 1 }
  ],
  prepare?: (options: DialogOptions) => void
) {
  await openDialog(title, type, row);
  const options = latestDialogOptions();
  const host = await renderDialog(options);
  dialogForm(options).details = details;
  prepare?.(options);
  const done = vi.fn();
  await options.beforeSure?.(done, { options, index: 0 });
  return { done, host, options };
}

describe("business/order/table", () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
    useUserStoreHook().uid = "fallback-user";
    formHandle.validate.mockResolvedValue(undefined);
    vi.mocked(getCompanyId).mockResolvedValue("company-1");
    for (const api of [
      addOrderApi,
      auditOrderApi,
      payPurchaseOrderApi,
      paySaleOrderApi,
      processClaimOrderPaymentApi,
      refundReturnOrderApi,
      settleSupplierClaimOrderApi,
      updateOrderApi
    ]) {
      vi.mocked(api).mockResolvedValue(undefined as never);
    }
  });

  afterEach(async () => {
    for (const host of mountedHosts.splice(0)) host.unmount();
    await flushPromises();
    vi.clearAllMocks();
  });

  it("builds surplus order payload with repo-based details", () => {
    const payload = buildCreateOrderPayload(
      ORDER_TYPE.surplus,
      {
        uid: "surplus-uid",
        auditorId: "manager-1",
        count: 2,
        total: 0,
        details: [
          {
            index: 1,
            repoId: "repo-1",
            tireId: "tire-1",
            count: 2,
            desc: "盘盈"
          }
        ]
      },
      "company-1"
    );

    expect(payload).toEqual({
      order: expect.objectContaining({
        uid: "surplus-uid",
        count: 2,
        total: 0,
        company: { connect: { uid: "company-1" } }
      }),
      details: [
        {
          companyId: "company-1",
          repoId: "repo-1",
          tireId: "tire-1",
          count: 2,
          desc: "盘盈"
        }
      ]
    });
  });

  it("builds waste order payload with generated detail numbers", () => {
    const payload = buildCreateOrderPayload(
      ORDER_TYPE.waste,
      {
        uid: "waste-uid",
        auditorId: "manager-2",
        count: 1,
        total: 0,
        details: [
          {
            index: 1,
            repoId: "repo-2",
            tireId: "tire-2",
            count: 1
          }
        ]
      },
      "company-2"
    );

    expect(payload).toEqual({
      order: expect.objectContaining({
        uid: "waste-uid",
        count: 1,
        total: 0,
        company: { connect: { uid: "company-2" } }
      }),
      details: [
        {
          companyId: "company-2",
          repoId: "repo-2",
          tireId: "tire-2",
          count: 1,
          number: "WD-waste-uid-1",
          desc: undefined
        }
      ]
    });
  });

  it("builds audit payload for approval and rejection", () => {
    expect(
      buildAuditOrderPayload(ORDER_TYPE.sale, {
        isApproved: true,
        rejectReason: "ignored"
      })
    ).toEqual({
      type: ORDER_TYPE.sale,
      isApproved: true,
      desc: null
    });

    expect(
      buildAuditOrderPayload(ORDER_TYPE.sale, {
        isApproved: false,
        rejectReason: "库存不足"
      })
    ).toEqual({
      type: ORDER_TYPE.sale,
      isApproved: false,
      desc: "库存不足"
    });
  });

  it("builds purchase payload with operator fallback and generated values", () => {
    const payload = buildCreateOrderPayload(
      ORDER_TYPE.purchase,
      {
        uid: "purchase-uid",
        providerId: "provider-1",
        operatorId: " ",
        count: 2,
        total: 20,
        details: [
          {
            index: 4,
            tireId: 12,
            repoId: "repo-1",
            count: "2"
          }
        ]
      } as never,
      "company-1"
    );

    expect(payload.order).toMatchObject({
      uid: "purchase-uid",
      provider: { connect: { uid: "provider-1" } },
      company: { connect: { uid: "company-1" } },
      operator: { connect: { uid: "fallback-user" } }
    });
    expect(payload.details).toEqual([
      {
        companyId: "company-1",
        tireId: 12,
        count: "2",
        repoId: "repo-1"
      }
    ]);
  });

  it("builds sale payload and normalizes optional claim fields", () => {
    const sale = buildCreateOrderPayload(
      ORDER_TYPE.sale,
      {
        uid: "sale-uid",
        customerId: "customer-1",
        operatorId: "operator-1",
        count: 1,
        total: 8,
        details: [{ index: 2, tireId: "tire-1", count: 1 }]
      },
      "company-1"
    );
    expect(sale.order).toMatchObject({
      customer: { connect: { uid: "customer-1" } },
      operator: { connect: { uid: "operator-1" } }
    });
    expect(sale.details).toEqual([{ tireId: "tire-1", count: 1 }]);

    const claim = buildCreateOrderPayload(
      ORDER_TYPE.claim,
      {
        uid: "claim-uid",
        customerId: " ",
        providerId: "provider-1",
        desc: "",
        attachments: [" a.png ", "", 2, "b.png"],
        count: 1,
        total: 0,
        details: [
          {
            index: 0,
            tireId: "tire-1",
            repoId: "",
            serialNo: " SN-1 ",
            number: "",
            name: " ",
            cause: " ",
            causeDesc: " ",
            claimFee: "not-a-number",
            wearFee: null,
            claimTirePrice: "",
            percent: Infinity,
            remainingPattern: "12.5",
            isProviderClaim: 1,
            claimType: "2",
            oldTireDisposition: " ",
            oldTireRemark: "备注"
          }
        ]
      } as never,
      "company-1"
    );

    expect(claim.order).toMatchObject({
      desc: null,
      attachments: ["a.png", "b.png"],
      provider: { connect: { uid: "provider-1" } }
    });
    expect(claim.order).not.toHaveProperty("customer");
    expect(claim.details[0]).toMatchObject({
      repositoryId: null,
      serialNo: "SN-1",
      number: "CL-claim-uid-1",
      name: "三包理赔",
      cause: "待判定",
      causeDesc: null,
      claimFee: 0,
      wearFee: 0,
      claimTirePrice: 0,
      percent: null,
      remainingPattern: 12.5,
      isProviderClaim: true,
      claimType: 2,
      oldTireDisposition: null,
      oldTireRemark: "备注",
      identificationResult: null
    });

    const claimWithCustomer = buildCreateOrderPayload(
      ORDER_TYPE.claim,
      {
        uid: "claim-2",
        customerId: "customer-2",
        desc: "故障",
        attachments: "legacy",
        count: 1,
        total: 1,
        details: [{ index: 0, tireId: "tire-2", count: 1 }]
      } as never,
      "company-1"
    );
    expect(claimWithCustomer.order).toMatchObject({
      desc: "故障",
      attachments: [],
      customer: { connect: { uid: "customer-2" } }
    });
  });

  it("keeps an explicit waste number and optional descriptions", () => {
    const surplus = buildCreateOrderPayload(
      ORDER_TYPE.surplus,
      {
        uid: "surplus-2",
        count: 1,
        total: 1,
        details: [
          { index: 0, tireId: "tire-1", repoId: "repo-1", count: 1, desc: "" }
        ]
      },
      "company-1"
    );
    expect(surplus.details[0]).toMatchObject({ desc: "" });

    const waste = buildCreateOrderPayload(
      ORDER_TYPE.waste,
      {
        uid: "waste-2",
        count: 1,
        total: 1,
        details: [
          {
            index: 0,
            tireId: "tire-1",
            repoId: "repo-1",
            count: 1,
            number: "WD-CUSTOM",
            desc: "报废"
          }
        ]
      },
      "company-1"
    );
    expect(waste.details[0]).toMatchObject({
      number: "WD-CUSTOM",
      desc: "报废"
    });
  });

  it("builds refund payload with required paymentId and desc", () => {
    expect(
      buildRefundPayload({
        fee: 1200,
        paymentId: " pay-1 ",
        desc: " 退款备注 "
      })
    ).toEqual({
      fee: 1200,
      paymentId: "pay-1",
      desc: "退款备注"
    });

    expect(
      buildRefundPayload({ fee: 0, paymentId: "pay-2", desc: "" })
    ).toEqual({ fee: 0, paymentId: "pay-2" });

    expect(() =>
      buildRefundPayload({
        fee: 0,
        paymentId: " ",
        desc: ""
      })
    ).toThrow("paymentId is required");
  });

  it.each([
    [ALL_LIST.repo, getAllRepoList],
    [ALL_LIST.tire, getAllTireList],
    [ALL_LIST.customer, getAllCustomerList],
    [ALL_LIST.provider, getAllProviderList]
  ])("loads cached list %s when present", async (key, load) => {
    storage.set(key, [{ uid: "cached" }]);
    await load();
    const first = await load();
    expect(first).toBeUndefined();
    expect(storage.get(key)).toEqual([{ uid: "cached" }]);

    storage.clear();
    await load();
  });

  it("reads the current order type with a safe fallback", async () => {
    storage.set(CUR_ORDER_TYPE, ORDER_TYPE.sale);
    await expect(getOrderType()).resolves.toBe(ORDER_TYPE.sale);

    storage.clear();
    await expect(getOrderType()).resolves.toBe(ORDER_TYPE.default);
    handleSelectionChange([]);
  });

  it("reads the form title only when one is cached", async () => {
    await expect(getFormTileInLocal()).resolves.toBe("");
    storage.set(CUR_FORM_TITLE, "编辑");
    await expect(getFormTileInLocal()).resolves.toBe("编辑");
  });

  it("opens a dialog with defaults and dialog callbacks", async () => {
    const closeCallBack = vi.fn();
    await openDialog(undefined, ORDER_TYPE.purchase, undefined, {
      closeCallBack
    });
    const options = latestDialogOptions();

    expect(options.title).toBe("新增");
    expect(options.width).toBe("95%");
    expect(options.hideFooter).toBe(false);
    expect(options.draggable).toBe(true);
    expect(options.fullscreen).toBe(false);
    expect(options.fullscreenIcon).toBe(true);
    expect(options.closeOnClickModal).toBe(false);
    expect(options.closeCallBack).toBe(closeCallBack);
    expect(dialogForm(options)).toMatchObject({
      providerId: undefined,
      customerId: undefined,
      isApproved: false,
      isLocked: false,
      logisticsStatus: 0,
      orderStatus: 0,
      status: true,
      attachments: [],
      total: 0,
      count: 0,
      fee: 0,
      isReceive: false,
      supplierClaimOrders: [],
      details: []
    });
    expect(dialogForm(options).uid).toEqual(expect.any(String));
  });

  it("maps an existing row into dialog state", async () => {
    const row = {
      uid: "order-1",
      providerId: "provider-1",
      customerId: "customer-1",
      sourceClaimOrderId: "claim-1",
      auditorId: "auditor-1",
      isApproved: true,
      isLocked: true,
      logisticsStatus: 2,
      orderStatus: 3,
      rejectReason: "原因",
      status: false,
      desc: "备注",
      attachments: ["a.png"],
      total: 100,
      count: 2,
      paymentId: "pay-1",
      fee: 15,
      isReceive: true,
      supplierClaimOrders: [{ uid: "supplier-1" }],
      details: [{ tireId: "tire-1" }]
    };
    await openDialog("查看", ORDER_TYPE.claim, row);
    const options = latestDialogOptions();

    expect(options.title).toBe("查看");
    expect(options.hideFooter).toBe(true);
    expect(dialogForm(options)).toMatchObject(row);
  });

  it("does not submit when the form ref is not mounted", async () => {
    await openDialog("新增", ORDER_TYPE.purchase);
    const options = latestDialogOptions();
    const done = vi.fn();

    await options.beforeSure?.(done, { options, index: 0 });

    expect(formHandle.validate).not.toHaveBeenCalled();
    expect(getCompanyId).not.toHaveBeenCalled();
    expect(done).not.toHaveBeenCalled();
  });

  it("stops when form validation rejects", async () => {
    await openDialog("新增", ORDER_TYPE.purchase);
    const options = latestDialogOptions();
    await renderDialog(options);
    formHandle.validate.mockRejectedValueOnce(new Error("invalid"));
    const done = vi.fn();

    await options.beforeSure?.(done, { options, index: 0 });

    expect(addOrderApi).not.toHaveBeenCalled();
    expect(done).not.toHaveBeenCalled();
  });

  it("requires at least one detail row", async () => {
    const { done } = await submitDialog(
      "新增",
      ORDER_TYPE.purchase,
      { name: "采购单" },
      []
    );

    expect(messageMock).toHaveBeenCalledWith("请添加订单详情项", {
      type: "error"
    });
    expect(getCompanyId).not.toHaveBeenCalled();
    expect(done).not.toHaveBeenCalled();
  });

  it("reports a company lookup failure", async () => {
    vi.mocked(getCompanyId).mockRejectedValueOnce(new Error("企业读取失败"));
    const { done } = await submitDialog("新增", ORDER_TYPE.purchase);

    expect(done).not.toHaveBeenCalled();
    expect(messageMock).toHaveBeenCalledWith("企业读取失败", { type: "error" });
  });

  it("reports API failures without closing the dialog", async () => {
    vi.mocked(addOrderApi).mockRejectedValueOnce(new Error("库存不足"));
    const { done } = await submitDialog("新增", ORDER_TYPE.purchase);

    expect(addOrderApi).toHaveBeenCalled();
    expect(done).not.toHaveBeenCalled();
    expect(messageMock).toHaveBeenCalledWith("库存不足", { type: "error" });
  });

  it("uses a fallback error message for non-Error failures", async () => {
    vi.mocked(updateOrderApi).mockRejectedValueOnce("network");
    const { done } = await submitDialog("修改", ORDER_TYPE.purchase);

    expect(done).not.toHaveBeenCalled();
    expect(messageMock).toHaveBeenCalledWith("修改失败", { type: "error" });
  });

  it("creates a purchase order and closes on success", async () => {
    const { done } = await submitDialog(
      "新增",
      ORDER_TYPE.purchase,
      {
        uid: "order-1",
        name: "采购单",
        providerId: "provider-1",
        operatorId: "operator-1",
        total: 12,
        attachments: [" a.png ", ""]
      },
      undefined,
      options => {
        dialogForm(options).name = "采购单";
      }
    );

    expect(addOrderApi).toHaveBeenCalledWith(
      ORDER_TYPE.purchase,
      expect.objectContaining({
        order: expect.objectContaining({
          uid: "order-1",
          provider: { connect: { uid: "provider-1" } },
          company: { connect: { uid: "company-1" } },
          operator: { connect: { uid: "fallback-user" } }
        }),
        details: [
          expect.objectContaining({
            companyId: "company-1",
            tireId: "tire-1",
            count: 1
          })
        ]
      })
    );
    expect(done).toHaveBeenCalledOnce();
    expect(messageMock).toHaveBeenCalledWith("您新增了名称为采购单的这条数据", {
      type: "success"
    });
  });

  it("warns when the order type cannot be created", async () => {
    const { done } = await submitDialog("新增", ORDER_TYPE.supplierClaim);

    expect(addOrderApi).not.toHaveBeenCalled();
    expect(done).not.toHaveBeenCalled();
    expect(messageMock).toHaveBeenCalledWith("当前订单类型暂不支持新增", {
      type: "warning"
    });
  });

  it("audits an order with the rejection reason", async () => {
    const { done } = await submitDialog("审核", ORDER_TYPE.sale, {
      uid: "order-2",
      name: "销售单",
      isApproved: false,
      rejectReason: "客户取消"
    });

    expect(auditOrderApi).toHaveBeenCalledWith("order-2", {
      type: ORDER_TYPE.sale,
      isApproved: false,
      desc: "客户取消"
    });
    expect(done).toHaveBeenCalledOnce();
  });

  it("pays purchase and sale orders", async () => {
    const purchase = await submitDialog("付款", ORDER_TYPE.purchase, {
      uid: "purchase-1",
      name: "采购单",
      paymentId: "pay-purchase",
      total: "25"
    });
    expect(payPurchaseOrderApi).toHaveBeenCalledWith("purchase-1", {
      fee: 25,
      paymentId: "pay-purchase"
    });
    expect(purchase.done).toHaveBeenCalledOnce();

    const sale = await submitDialog("收款", ORDER_TYPE.sale, {
      uid: "sale-1",
      name: "销售单",
      paymentId: "pay-sale",
      total: "30"
    });
    expect(paySaleOrderApi).toHaveBeenCalledWith("sale-1", {
      fee: 30,
      paymentId: "pay-sale"
    });
    expect(sale.done).toHaveBeenCalledOnce();
  });

  it("falls back to a generic update for a mismatched payment title", async () => {
    const { done } = await submitDialog("付款", ORDER_TYPE.sale, {
      uid: "sale-2",
      name: "销售单",
      attachments: ["a.png"]
    });

    expect(paySaleOrderApi).not.toHaveBeenCalled();
    expect(updateOrderApi).toHaveBeenCalledWith(
      ORDER_TYPE.sale,
      "sale-2",
      expect.objectContaining({
        company: { connect: { uid: "company-1" } },
        attachments: ["a.png"]
      })
    );
    expect(done).toHaveBeenCalledOnce();
  });

  it("records a claim payment", async () => {
    const { done } = await submitDialog("处理理赔费用", ORDER_TYPE.claim, {
      uid: "claim-1",
      name: "理赔单",
      fee: 18,
      paymentId: "pay-claim",
      isReceive: true,
      desc: " 到账 "
    });

    expect(processClaimOrderPaymentApi).toHaveBeenCalledWith("claim-1", {
      fee: 18,
      paymentId: "pay-claim",
      isReceive: true,
      desc: "到账"
    });
    expect(done).toHaveBeenCalledOnce();
  });

  it("settles a supplier claim", async () => {
    const { done } = await submitDialog("结算", ORDER_TYPE.supplierClaim, {
      uid: "supplier-1",
      name: "供应商索赔单",
      fee: 8,
      desc: " "
    });

    expect(settleSupplierClaimOrderApi).toHaveBeenCalledWith("supplier-1", {
      amount: 8,
      remark: undefined
    });
    expect(done).toHaveBeenCalledOnce();
  });

  it("refunds a return order", async () => {
    const { done } = await submitDialog("退款", ORDER_TYPE.return, {
      uid: "return-1",
      name: "退货单",
      fee: 9,
      paymentId: " pay-refund ",
      desc: "退款"
    });

    expect(refundReturnOrderApi).toHaveBeenCalledWith("return-1", {
      fee: 9,
      paymentId: "pay-refund",
      desc: "退款"
    });
    expect(done).toHaveBeenCalledOnce();
  });

  it.each(["修改", "更新物流", "更新状态", "未知操作"])(
    "updates an order for the %s action",
    async title => {
      const { done } = await submitDialog(title, ORDER_TYPE.purchase, {
        uid: "order-update",
        name: "采购单",
        attachments: "legacy"
      });

      expect(updateOrderApi).toHaveBeenCalledWith(
        ORDER_TYPE.purchase,
        "order-update",
        expect.objectContaining({
          company: { connect: { uid: "company-1" } }
        })
      );
      expect(updateOrderApi).toHaveBeenCalledWith(
        ORDER_TYPE.purchase,
        "order-update",
        expect.not.objectContaining({ attachments: expect.anything() })
      );
      expect(done).toHaveBeenCalledOnce();
    }
  );
});

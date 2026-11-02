import { flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";
import { ORDER_TYPE } from "@/utils";
import OrderIndex from "../index.vue";

vi.mock("@/utils/http", () => import("../../../../../tests/mocks/http-rich"));
vi.mock("@/utils/echarts", () => ({
  getEcharts: async () => ({
    init: () => ({
      setOption() {},
      resize() {},
      dispose() {},
      on() {},
      off() {}
    })
  })
}));

const buttonTexts = (
  wrapper: Awaited<ReturnType<typeof mountSmokeComponent>>
) =>
  wrapper
    .findAll("el-button-stub")
    .map(button => button.text())
    .filter(Boolean);

async function mountType(type: ORDER_TYPE, row: Record<string, unknown> = {}) {
  const wrapper = await mountSmokeComponent(
    async () => ({ default: OrderIndex }),
    "../business/order/index.vue",
    {
      keepMounted: true,
      fillSlots: true,
      route: `/business/order?orderType=${type}`
    }
  );
  const state = wrapper.vm.$.setupState as Record<string, any>;
  state.orderType = type;
  await state.setOrderType();
  state.dataList = [
    {
      uid: "order-1",
      name: "测试订单",
      status: "APPROVED",
      isApproved: true,
      isLocked: false,
      logisticsStatus: 0,
      providerId: "provider-1",
      customerId: "customer-1",
      details: [],
      ...row
    }
  ];
  await nextTick();
  await flushPromises();
  return wrapper;
}

describe("order list behavior", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it.each([
    ORDER_TYPE.purchase,
    ORDER_TYPE.sale,
    ORDER_TYPE.claim,
    ORDER_TYPE.return,
    ORDER_TYPE.waste,
    ORDER_TYPE.purchasePlan,
    ORDER_TYPE.purchaseInquiry
  ])("renders workflow and mutation actions for %s", async type => {
    const wrapper = await mountType(type);
    try {
      const texts = buttonTexts(wrapper);
      expect(texts).toEqual(
        expect.arrayContaining([
          "新增订单",
          "查看",
          "审核",
          "关闭",
          "更新物流",
          "作废",
          "修改"
        ])
      );
    } finally {
      wrapper.unmount();
    }
  });

  it.each([ORDER_TYPE.transfer, ORDER_TYPE.assembly])(
    "renders non-reversible workflow actions for %s",
    async type => {
      const wrapper = await mountType(type);
      try {
        const texts = buttonTexts(wrapper);
        expect(texts).toEqual(
          expect.arrayContaining([
            "新增订单",
            "查看",
            "审核",
            "关闭",
            "更新物流",
            "修改"
          ])
        );
        expect(texts).not.toContain("作废");
      } finally {
        wrapper.unmount();
      }
    }
  );

  it.each([
    ORDER_TYPE.surplus,
    ORDER_TYPE.saleQuotation,
    ORDER_TYPE.supplierClaim
  ])("hides manual creation for %s", async type => {
    const wrapper = await mountType(type);
    try {
      expect(buttonTexts(wrapper)).not.toContain("新增订单");
    } finally {
      wrapper.unmount();
    }
  });

  it("shows disabled-state labels and omits approval actions", async () => {
    const wrapper = await mountType(ORDER_TYPE.purchase, {
      status: false,
      isApproved: false,
      isLocked: true
    });
    try {
      const texts = buttonTexts(wrapper);
      expect(texts).toContain("开启");
      expect(texts).not.toContain("作废");
      expect(texts).not.toContain("修改");
    } finally {
      wrapper.unmount();
    }
  });

  it("shows payment and sale logistics actions for approved rows", async () => {
    const purchase = await mountType(ORDER_TYPE.purchase);
    try {
      expect(buttonTexts(purchase)).toContain("付款");
    } finally {
      purchase.unmount();
    }

    const sale = await mountType(ORDER_TYPE.sale, { logisticsStatus: 1 });
    try {
      const texts = buttonTexts(sale);
      expect(texts).toEqual(
        expect.arrayContaining(["收款", "确认发货", "确认送达"])
      );
    } finally {
      sale.unmount();
    }

    const returned = await mountType(ORDER_TYPE.return, { logisticsStatus: 1 });
    try {
      const texts = buttonTexts(returned);
      expect(texts).toEqual(
        expect.arrayContaining([
          "付款",
          "确认客户退货到货",
          "确认退供应商发货",
          "确认退供应商送达",
          "退款"
        ])
      );
    } finally {
      returned.unmount();
    }
  });

  it("requires linked parties for claim and return supplier actions", async () => {
    const claim = await mountType(ORDER_TYPE.claim, { providerId: undefined });
    try {
      const texts = buttonTexts(claim);
      expect(texts).toEqual(
        expect.arrayContaining(["检测记录", "处理理赔费用"])
      );
      expect(texts).not.toContain("生成供应商索赔单");
    } finally {
      claim.unmount();
    }

    const returned = await mountType(ORDER_TYPE.return, {
      providerId: undefined
    });
    try {
      const texts = buttonTexts(returned);
      expect(texts).toContain("确认客户退货到货");
      expect(texts).not.toContain("确认退供应商发货");
      expect(texts).not.toContain("确认退供应商送达");
    } finally {
      returned.unmount();
    }
  });

  it("only offers transfer cancellation before shipment", async () => {
    const cancellable = await mountType(ORDER_TYPE.transfer, {
      logisticsStatus: 1,
      details: [{ isShipped: false }]
    });
    try {
      expect(buttonTexts(cancellable)).toEqual(
        expect.arrayContaining(["取消", "确认到货"])
      );
    } finally {
      cancellable.unmount();
    }

    const shipped = await mountType(ORDER_TYPE.transfer, {
      logisticsStatus: 0,
      details: [{ isShipped: true }]
    });
    try {
      const texts = buttonTexts(shipped);
      expect(texts).toContain("确认发货");
      expect(texts).not.toContain("取消");
    } finally {
      shipped.unmount();
    }
  });

  it("renders plan, inquiry and quotation conversion states", async () => {
    const plan = await mountType(ORDER_TYPE.purchasePlan, { status: "DRAFT" });
    try {
      expect(buttonTexts(plan)).toContain("生成订单");
    } finally {
      plan.unmount();
    }

    const orderedPlan = await mountType(ORDER_TYPE.purchasePlan, {
      status: "ordered"
    });
    try {
      expect(buttonTexts(orderedPlan)).not.toContain("生成订单");
    } finally {
      orderedPlan.unmount();
    }

    const inquiry = await mountType(ORDER_TYPE.purchaseInquiry, {
      status: "DRAFT"
    });
    try {
      expect(buttonTexts(inquiry)).toEqual(
        expect.arrayContaining(["发送询价", "报价管理"])
      );
    } finally {
      inquiry.unmount();
    }

    const quotation = await mountType(ORDER_TYPE.saleQuotation, {
      status: "APPROVED",
      orders: []
    });
    try {
      expect(buttonTexts(quotation)).toContain("转订单");
    } finally {
      quotation.unmount();
    }

    for (const row of [
      { status: "REJECTED" },
      { status: "EXPIRED" },
      { orders: [{ uid: "o-1" }] }
    ]) {
      const hidden = await mountType(ORDER_TYPE.saleQuotation, row);
      try {
        expect(buttonTexts(hidden)).not.toContain("转订单");
      } finally {
        hidden.unmount();
      }
    }
  });

  it("renders settlement-only workflow for supplier claims", async () => {
    const wrapper = await mountType(ORDER_TYPE.supplierClaim, {
      isReversed: false
    });
    try {
      const texts = buttonTexts(wrapper);
      expect(texts).toEqual(expect.arrayContaining(["结算", "冲销"]));
      expect(texts).not.toContain("修改");
      expect(texts).toContain("关闭");
      expect(texts).not.toContain("更新物流");
    } finally {
      wrapper.unmount();
    }

    const reversed = await mountType(ORDER_TYPE.supplierClaim, {
      isReversed: true
    });
    try {
      expect(buttonTexts(reversed)).not.toEqual(
        expect.arrayContaining(["结算", "冲销"])
      );
    } finally {
      reversed.unmount();
    }
  });

  it("triggers row actions without throwing", async () => {
    const wrapper = await mountType(ORDER_TYPE.sale, { logisticsStatus: 1 });
    try {
      for (const label of [
        "查看",
        "审核",
        "关闭",
        "更新物流",
        "收款",
        "确认发货",
        "确认送达",
        "作废",
        "修改"
      ]) {
        const button = wrapper
          .findAll("el-button-stub")
          .find(item => item.text() === label);
        expect(button, label).toBeDefined();
        await button!.trigger("click");
        await flushPromises();
      }
      expect(wrapper.exists()).toBe(true);
    } finally {
      wrapper.unmount();
    }
  });

  it("refreshes and searches from rendered controls", async () => {
    const wrapper = await mountType(ORDER_TYPE.purchase);
    try {
      await wrapper.find(".pure-table-bar-stub").trigger("refresh");
      await wrapper.findComponent({ name: "ReSearchForm" }).vm.$emit("search");
      await wrapper.findComponent({ name: "ReSearchForm" }).vm.$emit("reset");
      await flushPromises();
      expect(wrapper.exists()).toBe(true);
    } finally {
      wrapper.unmount();
    }
  });
});

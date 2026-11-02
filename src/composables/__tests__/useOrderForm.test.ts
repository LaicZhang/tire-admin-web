import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { useOrderForm } from "../useOrderForm";

const { messageMock, getPaymentListApiMock, getCompanyIdMock } = vi.hoisted(
  () => ({
    messageMock: vi.fn(),
    getPaymentListApiMock: vi.fn(),
    getCompanyIdMock: vi.fn(() => "company-1")
  })
);

vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: messageMock,
  localForage: () => ({
    getItem: vi.fn(async (key: string) => {
      if (key.includes("provider")) return [{ uid: "p1", name: "供应商" }];
      if (key.includes("customer")) return [{ uid: "c1", name: "客户" }];
      if (key.includes("tire")) return [{ uid: "t1", name: "轮胎" }];
      if (key.includes("repo")) return [{ uid: "r1", name: "仓库" }];
      if (key.includes("manager")) return [{ uid: "m1", name: "经理" }];
      return null;
    })
  })
}));
vi.mock("@/api", () => ({
  getPaymentListApi: getPaymentListApiMock,
  getCompanyId: getCompanyIdMock
}));

function setup(
  mainDataType: "provider" | "customer",
  showDiscount = true,
  showArrivalOrShipped = true
) {
  const formData = { details: [] as any[] };
  let api!: ReturnType<typeof useOrderForm<any>>;
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useOrderForm({
          formData,
          formTitle: "新增",
          mainDataType,
          showDiscount,
          showArrivalOrShipped
        });
        return () => h("div");
      }
    })
  );
  return { api, formData, wrapper };
}

describe("useOrderForm", () => {
  beforeEach(() => {
    messageMock.mockClear();
    getPaymentListApiMock.mockReset();
  });

  it("loads scoped options and payment arrays/lists", async () => {
    getPaymentListApiMock.mockResolvedValueOnce({
      data: [{ uid: "pay1", name: "现金" }]
    });
    const provider = setup("provider");
    await provider.api.loadBaseData();
    expect(provider.api.mainList.value).toEqual([
      { uid: "p1", name: "供应商" }
    ]);
    expect(provider.api.allTireList.value).toHaveLength(1);
    expect(provider.api.allRepoList.value).toHaveLength(1);
    expect(provider.api.managerList.value).toHaveLength(1);
    expect(provider.api.allPaymentList.value).toEqual([
      { uid: "pay1", name: "现金" }
    ]);
    expect(provider.api.loading.value).toBe(false);
    provider.wrapper.unmount();

    getPaymentListApiMock.mockResolvedValueOnce({
      data: { list: [{ uid: "pay2", name: "银行" }] }
    });
    const customer = setup("customer");
    await customer.api.loadBaseData();
    expect(customer.api.mainList.value).toEqual([{ uid: "c1", name: "客户" }]);
    expect(customer.api.allPaymentList.value).toEqual([
      { uid: "pay2", name: "银行" }
    ]);
    customer.wrapper.unmount();
  });

  it("reports base data failures and handles missing payment data", async () => {
    getPaymentListApiMock.mockRejectedValueOnce(new Error("offline"));
    const { api, wrapper } = setup("provider");
    await api.loadBaseData();
    expect(messageMock).toHaveBeenCalledWith("加载基础数据失败", {
      type: "error"
    });
    expect(api.loading.value).toBe(false);
    wrapper.unmount();

    getPaymentListApiMock.mockResolvedValueOnce({ data: null });
    const empty = setup("customer");
    await empty.api.loadBaseData();
    expect(empty.api.allPaymentList.value).toEqual([]);
    empty.wrapper.unmount();
  });

  it("adds/deletes details and recalculates discounted totals", () => {
    const { api, formData, wrapper } = setup("provider");
    const detail = api.onAddDetail({ tireId: "t1", unitPrice: 100, count: 2 });
    expect(detail).toMatchObject({
      tireId: "t1",
      isArrival: false,
      discountRate: 0
    });
    api.calcDetailTotal(detail);
    expect(detail.total).toBe(200);
    expect(formData.count).toBe(2);
    expect(formData.total).toBe(200);
    detail.discountRate = 10;
    api.calcDetailTotal(detail);
    expect(detail.discountAmount).toBe(20);
    expect(detail.total).toBe(180);
    api.onDeleteDetail(0);
    expect(formData.details).toEqual([]);
    expect(formData.total).toBe(180);
    wrapper.unmount();
  });

  it("adds customer shipping fields and non-discounted detail totals", () => {
    const { api, wrapper } = setup("customer", false, true);
    const detail = api.onAddDetail();
    expect(detail).toMatchObject({ isShipped: false, isDelivered: false });
    expect(detail).not.toHaveProperty("discountRate");
    detail.count = 3;
    detail.unitPrice = 25;
    api.calcDetailTotal(detail);
    expect(detail.total).toBe(75);
    wrapper.unmount();

    const bare = setup("provider", false, false);
    expect(bare.api.onAddDetail()).not.toHaveProperty("isArrival");
    expect(bare.api.isEditable.value).toBe(true);
    bare.wrapper.unmount();
  });
});

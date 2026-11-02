const { loggerMock, api } = vi.hoisted(() => ({
  loggerMock: { error: vi.fn() },
  api: {
    getProviderListApi: vi.fn(),
    getCustomerListApi: vi.fn(),
    getPaymentListApi: vi.fn()
  }
}));

vi.mock("@/api/business/provider", () => ({
  getProviderListApi: api.getProviderListApi
}));
vi.mock("@/api/business/customer", () => ({
  getCustomerListApi: api.getCustomerListApi
}));
vi.mock("@/api/payment", () => ({ getPaymentListApi: api.getPaymentListApi }));
vi.mock("@/utils/logger", () => ({ logger: loggerMock }));

import {
  useCustomerAndProviderList,
  useCustomerList,
  usePaymentList,
  useProviderAndPaymentList,
  useProviderList
} from "../useFundFormData";

beforeEach(() => {
  Object.values(api).forEach(fn => fn.mockReset());
  loggerMock.error.mockReset();
});

describe("fund form option loaders", () => {
  it.each([
    ["provider", useProviderList, "providerList", "getProviderListApi"],
    ["customer", useCustomerList, "customerList", "getCustomerListApi"]
  ] as const)("loads %s options", async (_name, factory, field, apiName) => {
    api[apiName].mockResolvedValue({
      data: { list: [{ uid: "1", name: "One" }] }
    });
    const state = factory();
    expect(state.loading.value).toBe(false);
    const promise = state.loadProviders
      ? state.loadProviders()
      : state.loadCustomers();
    expect(state.loading.value).toBe(true);
    await promise;
    expect(state[field].value).toEqual([{ uid: "1", name: "One" }]);
    expect(state.loading.value).toBe(false);
    expect(api[apiName]).toHaveBeenCalledWith(1, { keyword: "" });
  });

  it("loads payment accounts", async () => {
    api.getPaymentListApi.mockResolvedValue({
      data: [{ uid: "p1", name: "Cash", balance: 100 }]
    });
    const state = usePaymentList();
    await state.loadPayments();
    expect(state.paymentList.value).toEqual([
      { uid: "p1", name: "Cash", balance: 100 }
    ]);
  });

  it.each([
    [useProviderList, "loadProviders", "getProviderListApi", "providerList"],
    [useCustomerList, "loadCustomers", "getCustomerListApi", "customerList"],
    [usePaymentList, "loadPayments", "getPaymentListApi", "paymentList"]
  ] as const)(
    "clears options after a failed load",
    async (factory, method, apiName, field) => {
      const error = new Error("offline");
      api[apiName].mockRejectedValue(error);
      const state = factory();
      await state[method]();
      expect(state[field].value).toEqual([]);
      expect(state.loading.value).toBe(false);
      expect(loggerMock.error).toHaveBeenCalledWith(expect.any(String), error);
    }
  );

  it("loads provider and payment options together", async () => {
    api.getProviderListApi.mockResolvedValue({ data: { list: [] } });
    api.getPaymentListApi.mockResolvedValue({ data: [] });
    const state = useProviderAndPaymentList();
    await state.loadAll();
    expect(api.getProviderListApi).toHaveBeenCalledOnce();
    expect(api.getPaymentListApi).toHaveBeenCalledOnce();
    expect(state.providerList.value).toEqual([]);
    expect(state.paymentList.value).toEqual([]);
  });

  it("loads customer and provider options together", async () => {
    api.getCustomerListApi.mockResolvedValue({ data: { list: [] } });
    api.getProviderListApi.mockResolvedValue({ data: { list: [] } });
    const state = useCustomerAndProviderList();
    await state.loadAll();
    expect(api.getCustomerListApi).toHaveBeenCalledOnce();
    expect(api.getProviderListApi).toHaveBeenCalledOnce();
  });
});

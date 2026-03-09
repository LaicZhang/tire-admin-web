import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFundForm } from "./useFundForm";
import { getProviderListApi } from "@/api/business/provider";
import { getCustomerListApi } from "@/api/business/customer";
import { getPaymentListApi } from "@/api/payment";

vi.mock("@/api/business/provider", () => ({
  getProviderListApi: vi.fn()
}));

vi.mock("@/api/business/customer", () => ({
  getCustomerListApi: vi.fn()
}));

vi.mock("@/api/payment", () => ({
  getPaymentListApi: vi.fn()
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    error: vi.fn()
  }
}));

describe("useFundForm", () => {
  beforeEach(() => {
    vi.mocked(getProviderListApi).mockReset();
    vi.mocked(getCustomerListApi).mockReset();
    vi.mocked(getPaymentListApi).mockReset();
  });

  it("requests full provider and customer lists with explicit page size", async () => {
    vi.mocked(getProviderListApi).mockResolvedValue({
      code: 200,
      msg: "ok",
      data: {
        list: [{ id: 1, uid: "provider-1", name: "供应商A" }],
        count: 1,
        total: 1
      }
    });
    vi.mocked(getCustomerListApi).mockResolvedValue({
      code: 200,
      msg: "ok",
      data: {
        list: [{ id: 1, uid: "customer-1", name: "客户A" }],
        count: 1,
        total: 1
      }
    });

    const form = useFundForm();
    await form.loadProviders();
    await form.loadCustomers();

    expect(getProviderListApi).toHaveBeenCalledWith(1, {
      keyword: "",
      pageSize: 1000
    });
    expect(getCustomerListApi).toHaveBeenCalledWith(1, {
      keyword: "",
      pageSize: 1000
    });
    expect(form.providerList.value).toEqual([
      { id: 1, uid: "provider-1", name: "供应商A" }
    ]);
    expect(form.customerList.value).toEqual([
      { id: 1, uid: "customer-1", name: "客户A" }
    ]);
  });

  it("normalizes payment list responses from paginated and array payloads", async () => {
    vi.mocked(getPaymentListApi)
      .mockResolvedValueOnce({
        code: 200,
        msg: "ok",
        data: {
          list: [
            {
              uid: "payment-1",
              companyUid: "company-1",
              name: "账户A",
              balance: 1000
            }
          ],
          count: 1
        }
      })
      .mockResolvedValueOnce({
        code: 200,
        msg: "ok",
        data: [
          {
            uid: "payment-2",
            companyUid: "company-1",
            name: "账户B",
            balance: 2000
          }
        ]
      });

    const form = useFundForm();

    await form.loadPayments();
    expect(form.paymentList.value).toEqual([
      {
        uid: "payment-1",
        companyUid: "company-1",
        name: "账户A",
        balance: 1000
      }
    ]);

    form.paymentList.value = [];
    await form.loadPayments();
    expect(form.paymentList.value).toEqual([
      {
        uid: "payment-2",
        companyUid: "company-1",
        name: "账户B",
        balance: 2000
      }
    ]);
  });
});

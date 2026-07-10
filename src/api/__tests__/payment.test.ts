import { beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "@/utils/http";
import {
  createPaymentApi,
  getPaymentPageApi,
  updatePaymentApi
} from "../payment";
import * as paymentApi from "../payment";

vi.mock("@/utils/http", () => ({
  http: {
    request: vi.fn()
  }
}));

describe("payment api", () => {
  beforeEach(() => {
    vi.mocked(http.request).mockReset();
    vi.mocked(http.request).mockResolvedValue({ code: 200, data: {} });
  });

  it("requests payment page with server-side keyword filters", async () => {
    await getPaymentPageApi(2, {
      keyword: "招商",
      pageSize: 20,
      status: true
    });

    expect(http.request).toHaveBeenCalledWith("get", "/api/v1/payment/page/2", {
      params: {
        keyword: "招商",
        pageSize: 20,
        status: true
      }
    });
  });

  it("creates account master data with nested company and payment payload", async () => {
    const payload = {
      company: { uid: "company-1" },
      payment: {
        name: "招商银行",
        accountType: "bank",
        bankName: "招商银行上海分行",
        bankAccount: "6225888888888888",
        desc: "对公账户",
        status: true,
        balance: 12345
      }
    };

    await createPaymentApi(payload as never);

    expect(http.request).toHaveBeenCalledWith("post", "/api/v1/payment/", {
      data: payload
    });
  });

  it("updates account master data via profile endpoint", async () => {
    const payload = {
      name: "招商银行",
      accountType: "bank",
      bankName: "招商银行上海分行",
      bankAccount: "6225888888888888",
      desc: "对公账户",
      status: true
    };

    await (
      paymentApi as typeof paymentApi & {
        updatePaymentProfileApi: (
          uid: string,
          data: typeof payload
        ) => Promise<unknown>;
      }
    ).updatePaymentProfileApi("payment-1", payload);

    expect(http.request).toHaveBeenCalledWith(
      "patch",
      "/api/v1/payment/payment-1/profile",
      {
        data: payload
      }
    );
  });

  it("keeps balance operations on the original payment endpoint", async () => {
    const payload = {
      type: "top-up" as const,
      record: {
        modified: 100,
        desc: "充值"
      }
    };

    await updatePaymentApi("payment-1", payload);

    expect(http.request).toHaveBeenCalledWith(
      "patch",
      "/api/v1/payment/payment-1",
      {
        data: payload
      }
    );
  });
});

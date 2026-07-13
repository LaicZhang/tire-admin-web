import { beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "@/utils/http";
import { createCustomerDebtProfileApi } from "../business/customer";

vi.mock("@/utils/http", () => ({
  http: {
    request: vi.fn()
  }
}));

describe("customer debt profile api contract", () => {
  beforeEach(() => {
    vi.mocked(http.request).mockReset();
    vi.mocked(http.request).mockResolvedValue({ code: 200, data: {} });
  });

  it("posts StaticImage UIDs without legacy URL fields", async () => {
    const payload = {
      idCardImageUid: "018f7c6e-7b3a-7f1f-bc1d-123456789abc",
      iouImageUid: "018f7c6e-7b3a-7f1f-bc1d-123456789abd",
      liveImageUid: "018f7c6e-7b3a-7f1f-bc1d-123456789abe",
      phone: "13800000000",
      paymentTermDays: 30,
      idCardImageUrl: "https://legacy.example/id-card.jpg",
      iouImageUrl: "https://legacy.example/iou.jpg",
      liveImageUrl: "https://legacy.example/live.jpg"
    } as unknown as Parameters<typeof createCustomerDebtProfileApi>[1];

    const expectedPayload = {
      idCardImageUid: "018f7c6e-7b3a-7f1f-bc1d-123456789abc",
      iouImageUid: "018f7c6e-7b3a-7f1f-bc1d-123456789abd",
      liveImageUid: "018f7c6e-7b3a-7f1f-bc1d-123456789abe",
      phone: "13800000000",
      paymentTermDays: 30
    };

    await createCustomerDebtProfileApi("customer-1", payload);

    expect(http.request).toHaveBeenCalledWith(
      "post",
      "/api/v1/customer/debt-profile/customer-1",
      { data: expectedPayload }
    );

    const requestPayload = vi.mocked(http.request).mock.calls[0]?.[2]?.data;
    expect(requestPayload).not.toHaveProperty("idCardImageUrl");
    expect(requestPayload).not.toHaveProperty("iouImageUrl");
    expect(requestPayload).not.toHaveProperty("liveImageUrl");
  });
});

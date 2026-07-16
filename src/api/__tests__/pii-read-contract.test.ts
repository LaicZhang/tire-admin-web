import { beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "@/utils/http";
import { getUserPiiApi } from "../user";
import { getCustomerPiiApi } from "../business/customer";

vi.mock("@/utils/http", () => ({
  http: { request: vi.fn() }
}));

describe("high-sensitive read api contract", () => {
  beforeEach(() => {
    vi.mocked(http.request).mockReset();
    vi.mocked(http.request).mockResolvedValue({ code: 200, data: {} });
  });

  it("uses the dedicated user PII route", async () => {
    await getUserPiiApi("user-1");
    expect(http.request).toHaveBeenCalledWith("get", "/api/v1/user/pii/user-1");
  });

  it("uses the dedicated customer PII route", async () => {
    await getCustomerPiiApi("customer-1");
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/customer/pii/customer-1"
    );
  });
});

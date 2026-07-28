import { beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "@/utils/http";
import {
  addSalaryApi,
  confirmSalaryApi,
  getSalaryListApi,
  updateSalaryApi
} from "../company/salary";

vi.mock("@/utils/http", () => ({ http: { request: vi.fn() } }));

describe("salary monthly payroll API contract (SAL-C6/C7/C8)", () => {
  beforeEach(() => {
    vi.mocked(http.request).mockReset();
    vi.mocked(http.request).mockResolvedValue({ code: 200, data: {} });
  });

  it("lists page with employeeId/date query (not template name)", async () => {
    await getSalaryListApi(1, { employeeId: "emp-1", date: 202607 });
    expect(http.request).toHaveBeenCalledWith("get", "/api/v1/salary/page/1", {
      params: { employeeId: "emp-1", date: 202607 }
    });
  });

  it("creates nested monthly salary payload", async () => {
    await addSalaryApi({
      employeeId: "emp-1",
      date: 202607,
      total: {
        base: 80000,
        performance: 20000,
        subsidy: 0,
        fulltimeAttendanceAward: 0,
        other: 0
      },
      eSocial: { tax: 5000 },
      cSocial: { pension: 10000 },
      desc: "七月"
    });
    expect(http.request).toHaveBeenCalledWith("post", "/api/v1/salary/", {
      data: expect.objectContaining({
        employeeId: "emp-1",
        date: 202607,
        total: expect.objectContaining({ base: 80000 }),
        eSocial: expect.objectContaining({ tax: 5000 })
      })
    });
  });

  it("uses confirm endpoint distinct from patch", async () => {
    await updateSalaryApi("salary-1", { desc: "note" });
    await confirmSalaryApi("salary-1");
    expect(http.request).toHaveBeenNthCalledWith(
      1,
      "patch",
      "/api/v1/salary/salary-1",
      { data: { desc: "note" } }
    );
    expect(http.request).toHaveBeenNthCalledWith(
      2,
      "post",
      "/api/v1/salary/salary-1/confirm"
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createFeatureApi,
  createPlanRedeemCodeApi,
  createSubscriptionPlanApi,
  disableFeatureApi,
  disableSubscriptionPlanApi,
  getCompanyPlanCurrentApi,
  getPlanRedeemCodeApi,
  getSubscriptionPlanApi,
  grantCompanyPlanApi,
  listCompanyPlanGrantsApi,
  listFeaturesApi,
  listPlanRedeemCodesApi,
  listSubscriptionPlansApi,
  redeemCompanyPlanApi,
  replacePlanFeaturesApi,
  revokeCompanyPlanApi,
  revokePlanRedeemCodeApi,
  updateFeatureApi,
  updateSubscriptionPlanApi
} from "../system/subscription";
import { http } from "@/utils/http";

vi.mock("@/utils/http", () => ({
  http: {
    request: vi.fn()
  }
}));

describe("subscription admin api contract (W132)", () => {
  beforeEach(() => {
    vi.mocked(http.request).mockReset();
    vi.mocked(http.request).mockResolvedValue({ code: 200, data: {} });
  });

  it("lists and mutates subscription plans", async () => {
    await listSubscriptionPlansApi();
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/admin/subscription-plans"
    );

    await getSubscriptionPlanApi("plan-uid-1");
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/admin/subscription-plans/plan-uid-1"
    );

    const createPayload = {
      code: "PREMIUM" as const,
      name: "高级",
      receivesUpdates: true,
      sortOrder: 2
    };
    await createSubscriptionPlanApi(createPayload);
    expect(http.request).toHaveBeenCalledWith(
      "post",
      "/api/v1/admin/subscription-plans",
      { data: createPayload }
    );

    await updateSubscriptionPlanApi("plan-uid-1", { name: "高级版" });
    expect(http.request).toHaveBeenCalledWith(
      "put",
      "/api/v1/admin/subscription-plans/plan-uid-1",
      { data: { name: "高级版" } }
    );

    await replacePlanFeaturesApi("plan-uid-1", [
      "core.workplace",
      "org.salary"
    ]);
    expect(http.request).toHaveBeenCalledWith(
      "put",
      "/api/v1/admin/subscription-plans/plan-uid-1/features",
      { data: { featureKeys: ["core.workplace", "org.salary"] } }
    );

    await disableSubscriptionPlanApi("plan-uid-1");
    expect(http.request).toHaveBeenCalledWith(
      "delete",
      "/api/v1/admin/subscription-plans/plan-uid-1"
    );
  });

  it("lists and mutates feature definitions", async () => {
    await listFeaturesApi();
    expect(http.request).toHaveBeenCalledWith("get", "/api/v1/admin/features");

    const createPayload = {
      key: "org.salary",
      name: "薪资",
      group: "org"
    };
    await createFeatureApi(createPayload);
    expect(http.request).toHaveBeenCalledWith(
      "post",
      "/api/v1/admin/features",
      { data: createPayload }
    );

    await updateFeatureApi("org.salary", { name: "薪资结算" });
    expect(http.request).toHaveBeenCalledWith(
      "put",
      "/api/v1/admin/features/org.salary",
      { data: { name: "薪资结算" } }
    );

    await disableFeatureApi("org.salary");
    expect(http.request).toHaveBeenCalledWith(
      "delete",
      "/api/v1/admin/features/org.salary"
    );
  });

  it("issues and revokes plan redeem codes", async () => {
    await listPlanRedeemCodesApi({ planCode: "PREMIUM", status: "ACTIVE" });
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/admin/plan-redeem-codes",
      { params: { planCode: "PREMIUM", status: "ACTIVE" } }
    );

    await getPlanRedeemCodeApi("code-uid-1");
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/admin/plan-redeem-codes/code-uid-1"
    );

    const createPayload = {
      planCode: "BUYOUT" as const,
      maxUses: 1,
      note: "渠道赠送"
    };
    await createPlanRedeemCodeApi(createPayload);
    expect(http.request).toHaveBeenCalledWith(
      "post",
      "/api/v1/admin/plan-redeem-codes",
      { data: createPayload }
    );

    await revokePlanRedeemCodeApi("code-uid-1");
    expect(http.request).toHaveBeenCalledWith(
      "delete",
      "/api/v1/admin/plan-redeem-codes/code-uid-1"
    );
  });

  it("grants and revokes company plans", async () => {
    const companyId = "11111111-1111-4111-8111-111111111111";
    await listCompanyPlanGrantsApi(companyId);
    expect(http.request).toHaveBeenCalledWith(
      "get",
      `/api/v1/admin/companies/${companyId}/plan-grants`
    );

    const grantPayload = {
      planCode: "PREMIUM" as const,
      endsAt: "2027-01-01T00:00:00.000Z",
      note: "试用 1 年"
    };
    await grantCompanyPlanApi(companyId, grantPayload);
    expect(http.request).toHaveBeenCalledWith(
      "post",
      `/api/v1/admin/companies/${companyId}/plan-grants`,
      { data: grantPayload }
    );

    await revokeCompanyPlanApi(companyId, { note: "违规" });
    expect(http.request).toHaveBeenCalledWith(
      "post",
      `/api/v1/admin/companies/${companyId}/plan-grants/revoke`,
      { data: { note: "违规" } }
    );
  });

  it("reads current company plan and redeems code (Boss path)", async () => {
    await getCompanyPlanCurrentApi();
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/company-plan/current"
    );

    await redeemCompanyPlanApi({ code: "PREM-ABCD" });
    expect(http.request).toHaveBeenCalledWith(
      "post",
      "/api/v1/company-plan/redeem",
      { data: { code: "PREM-ABCD" } }
    );
  });
});

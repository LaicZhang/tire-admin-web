import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

/** Built-in plan codes (W-SUB catalog). */
export type SubscriptionPlanCode = "FREE" | "PREMIUM" | "BUYOUT";

export type PlanRedeemCodeStatus =
  | "ACTIVE"
  | "EXHAUSTED"
  | "EXPIRED"
  | "REVOKED";

export type CompanyPlanGrantStatus =
  | "ACTIVE"
  | "SUPERSEDED"
  | "EXPIRED"
  | "REVOKED";

export type CompanyPlanGrantSource = "ADMIN" | "REDEEM" | "SYSTEM";

export interface PlanFeatureLink {
  planId: string;
  featureKey: string;
}

export interface SubscriptionPlan {
  uid: string;
  code: SubscriptionPlanCode;
  name: string;
  description?: string | null;
  receivesUpdates: boolean;
  status: boolean;
  sortOrder: number;
  features?: PlanFeatureLink[];
  createAt?: string;
  updateAt?: string;
}

export interface FeatureDefinition {
  key: string;
  name: string;
  group?: string | null;
  description?: string | null;
  menuUids?: string[];
  permissionPaths?: string[];
  limits?: Record<string, unknown> | null;
  status: boolean;
  createAt?: string;
  updateAt?: string;
}

export interface PlanRedeemCode {
  uid: string;
  code: string;
  planId: string;
  maxUses: number;
  usedCount: number;
  expiresAt?: string | null;
  boundCompanyId?: string | null;
  status: PlanRedeemCodeStatus;
  note?: string | null;
  createdByAdminId?: string | null;
  createAt?: string;
  plan?: Pick<SubscriptionPlan, "uid" | "code" | "name">;
}

export interface CompanyPlanGrant {
  uid: string;
  companyId: string;
  planId: string;
  source: CompanyPlanGrantSource;
  status: CompanyPlanGrantStatus;
  startsAt?: string | null;
  endsAt?: string | null;
  featureSnapshotKeys?: string[];
  operatorUserId?: string | null;
  note?: string | null;
  redeemCodeId?: string | null;
  createAt?: string;
  plan?: Pick<SubscriptionPlan, "uid" | "code" | "name" | "receivesUpdates">;
  redeemCode?: Pick<PlanRedeemCode, "uid" | "code"> | null;
}

/** Resolved entitlement (GET /company-plan/current). */
export interface CompanyPlanCurrent {
  planCode: SubscriptionPlanCode;
  grantUid: string | null;
  featureKeys: string[];
  menuUids: string[];
  permissionPaths: string[];
  limits: Record<string, unknown>;
  receivesUpdates: boolean;
  expiredApplied: boolean;
  endsAt: string | null;
}

export type CreatePlanPayload = {
  code: SubscriptionPlanCode;
  name: string;
  description?: string;
  receivesUpdates: boolean;
  status?: boolean;
  sortOrder?: number;
};

export type UpdatePlanPayload = {
  name?: string;
  description?: string;
  receivesUpdates?: boolean;
  status?: boolean;
  sortOrder?: number;
};

export type CreateFeaturePayload = {
  key: string;
  name: string;
  group?: string;
  description?: string;
  menuUids?: string[];
  permissionPaths?: string[];
  limits?: Record<string, unknown>;
};

export type UpdateFeaturePayload = {
  name?: string;
  group?: string;
  description?: string;
  menuUids?: string[];
  permissionPaths?: string[];
  limits?: Record<string, unknown>;
};

export type CreateRedeemCodePayload = {
  planCode: SubscriptionPlanCode;
  maxUses?: number;
  expiresAt?: string | Date;
  boundCompanyId?: string;
  note?: string;
  code?: string;
};

export type GrantPlanPayload = {
  planCode: SubscriptionPlanCode;
  note?: string;
  endsAt?: string | Date;
};

export type RevokePlanPayload = {
  note?: string;
};

export type RedeemPlanPayload = {
  code: string;
};

const plansPrefix = "/admin/subscription-plans";
const featuresPrefix = "/admin/features";
const codesPrefix = "/admin/plan-redeem-codes";
const companyPlanPrefix = "/company-plan";

function companyGrantsPrefix(companyId: string) {
  return `/admin/companies/${companyId}/plan-grants`;
}

// ── Plans ──────────────────────────────────────────────────────────

export async function listSubscriptionPlansApi() {
  return await http.request<CommonResult<SubscriptionPlan[]>>(
    "get",
    baseUrlApi(plansPrefix)
  );
}

export async function getSubscriptionPlanApi(uid: string) {
  return await http.request<CommonResult<SubscriptionPlan>>(
    "get",
    baseUrlApi(`${plansPrefix}/${uid}`)
  );
}

export async function createSubscriptionPlanApi(data: CreatePlanPayload) {
  return await http.request<CommonResult<SubscriptionPlan>>(
    "post",
    baseUrlApi(plansPrefix),
    { data }
  );
}

export async function updateSubscriptionPlanApi(
  uid: string,
  data: UpdatePlanPayload
) {
  return await http.request<CommonResult<SubscriptionPlan>>(
    "put",
    baseUrlApi(`${plansPrefix}/${uid}`),
    { data }
  );
}

export async function replacePlanFeaturesApi(
  uid: string,
  featureKeys: string[]
) {
  return await http.request<CommonResult<SubscriptionPlan>>(
    "put",
    baseUrlApi(`${plansPrefix}/${uid}/features`),
    { data: { featureKeys } }
  );
}

export async function disableSubscriptionPlanApi(uid: string) {
  return await http.request<CommonResult<SubscriptionPlan>>(
    "delete",
    baseUrlApi(`${plansPrefix}/${uid}`)
  );
}

// ── Features ───────────────────────────────────────────────────────

export async function listFeaturesApi() {
  return await http.request<CommonResult<FeatureDefinition[]>>(
    "get",
    baseUrlApi(featuresPrefix)
  );
}

export async function createFeatureApi(data: CreateFeaturePayload) {
  return await http.request<CommonResult<FeatureDefinition>>(
    "post",
    baseUrlApi(featuresPrefix),
    { data }
  );
}

export async function updateFeatureApi(
  key: string,
  data: UpdateFeaturePayload
) {
  return await http.request<CommonResult<FeatureDefinition>>(
    "put",
    baseUrlApi(`${featuresPrefix}/${encodeURIComponent(key)}`),
    { data }
  );
}

export async function disableFeatureApi(key: string) {
  return await http.request<CommonResult<FeatureDefinition>>(
    "delete",
    baseUrlApi(`${featuresPrefix}/${encodeURIComponent(key)}`)
  );
}

// ── Redeem codes ───────────────────────────────────────────────────

export async function listPlanRedeemCodesApi(params?: {
  planCode?: SubscriptionPlanCode;
  status?: PlanRedeemCodeStatus;
}) {
  return await http.request<CommonResult<PlanRedeemCode[]>>(
    "get",
    baseUrlApi(codesPrefix),
    { params }
  );
}

export async function getPlanRedeemCodeApi(uid: string) {
  return await http.request<CommonResult<PlanRedeemCode>>(
    "get",
    baseUrlApi(`${codesPrefix}/${uid}`)
  );
}

export async function createPlanRedeemCodeApi(data: CreateRedeemCodePayload) {
  return await http.request<CommonResult<PlanRedeemCode>>(
    "post",
    baseUrlApi(codesPrefix),
    { data }
  );
}

export async function revokePlanRedeemCodeApi(uid: string) {
  return await http.request<CommonResult<PlanRedeemCode>>(
    "delete",
    baseUrlApi(`${codesPrefix}/${uid}`)
  );
}

// ── Company grants (platform Admin) ────────────────────────────────

export async function listCompanyPlanGrantsApi(companyId: string) {
  return await http.request<CommonResult<CompanyPlanGrant[]>>(
    "get",
    baseUrlApi(companyGrantsPrefix(companyId))
  );
}

export async function grantCompanyPlanApi(
  companyId: string,
  data: GrantPlanPayload
) {
  return await http.request<CommonResult<CompanyPlanGrant>>(
    "post",
    baseUrlApi(companyGrantsPrefix(companyId)),
    { data }
  );
}

export async function revokeCompanyPlanApi(
  companyId: string,
  data?: RevokePlanPayload
) {
  return await http.request<CommonResult<CompanyPlanGrant>>(
    "post",
    baseUrlApi(`${companyGrantsPrefix(companyId)}/revoke`),
    { data: data ?? {} }
  );
}

// ── Current company plan / Boss redeem (W133 prep) ─────────────────

export async function getCompanyPlanCurrentApi() {
  return await http.request<CommonResult<CompanyPlanCurrent>>(
    "get",
    baseUrlApi(`${companyPlanPrefix}/current`)
  );
}

export async function redeemCompanyPlanApi(data: RedeemPlanPayload) {
  return await http.request<CommonResult<CompanyPlanGrant>>(
    "post",
    baseUrlApi(`${companyPlanPrefix}/redeem`),
    { data }
  );
}

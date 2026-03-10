import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import {
  getCompanyId,
  getCompanyConnect,
  addOrderApi,
  updateOrderApi,
  payPurchaseOrderApi,
  paySaleOrderApi,
  processClaimOrderPaymentApi,
  refundReturnOrderApi,
  confirmPurchaseOrderArrivalApi,
  type OrderDetailDto
} from "@/api";
import editForm from "./form.vue";
import {
  ALL_LIST,
  CUR_FORM_TITLE,
  CUR_ORDER_TYPE,
  localForage,
  ORDER_TYPE
} from "@/utils";
import type { FormInstance } from "element-plus";
import type { DialogOptions } from "../../../components/ReDialog";

const formRef = ref<{ getRef: () => FormInstance } | null>(null);
export function handleSelectionChange(_val: unknown) {
  // 选择变化处理
}
const orderType = ref<string>(ORDER_TYPE.default);

// 通用数据类型
interface BasicEntity {
  uid?: string;
  id?: number;
  name?: string;
  [key: string]: unknown;
}

interface _OrderDetail {
  uid?: string;
  index?: number;
  count?: number;
  batchNo?: string;
  expiryDate?: string;
  tireId?: string;
  repoId?: string;
  desc?: string;
  number?: string;
  [key: string]: unknown;
}

interface OrderRow {
  uid?: string;
  providerId?: string;
  customerId?: string;
  auditorId?: string;
  isApproved?: boolean;
  isLocked?: boolean;
  logisticsStatus?: number;
  orderStatus?: number;
  rejectReason?: string;
  status?: boolean | string;
  desc?: string;
  total?: number | string;
  count?: number;
  paymentId?: string;
  fee?: number;
  isReceive?: boolean;
  details?: _OrderDetail[];
  name?: string;
}

type CreateOrderType =
  | ORDER_TYPE.purchase
  | ORDER_TYPE.sale
  | ORDER_TYPE.surplus
  | ORDER_TYPE.waste;

export const allTireList = ref<BasicEntity[]>([]);
export const allRepoList = ref<BasicEntity[]>([]);
export const allCustomerList = ref<BasicEntity[]>([]);
export const allProviderList = ref<BasicEntity[]>([]);
export const managerList = ref<BasicEntity[]>([]);

export async function getAllRepoList() {
  const res = await localForage().getItem<BasicEntity[]>(ALL_LIST.repo);
  if (res) allRepoList.value = res;
}
export async function getAllTireList() {
  const res = await localForage().getItem<BasicEntity[]>(ALL_LIST.tire);
  if (res) allTireList.value = res;
}

export async function getAllCustomerList() {
  const res = await localForage().getItem<BasicEntity[]>(ALL_LIST.customer);
  if (res) allCustomerList.value = res;
}

export async function getAllProviderList() {
  const res = await localForage().getItem<BasicEntity[]>(ALL_LIST.provider);
  if (res) allProviderList.value = res;
}

export async function getOrderType() {
  const cur = await localForage().getItem<string>(CUR_ORDER_TYPE);
  orderType.value = (cur ?? ORDER_TYPE.default) as string;
  return orderType.value;
}
const formTitle = ref("");
export async function getFormTileInLocal() {
  const title = await localForage().getItem<string>(CUR_FORM_TITLE);
  if (title) formTitle.value = title;
  return formTitle.value;
}

import { v7 as uuid } from "uuid";
import { getCommonData } from "./handleData";
import { getFooterButtons } from "./props";

function normalizeCreateDetails(details: _OrderDetail[]) {
  return details.map(({ index: _idx, ...rest }, index) => ({ ...rest, index }));
}

export function buildCreateOrderPayload(
  type: CreateOrderType,
  curData: Required<Pick<OrderRow, "uid" | "details">> &
    Omit<OrderRow, "uid" | "details">,
  companyId: string
) {
  const { uid, details, providerId, customerId, auditorId, ...orderData } =
    curData;
  const commonData = getCommonData(uid, companyId, { auditorId });
  const normalizedDetails = normalizeCreateDetails(details);

  if (type === ORDER_TYPE.purchase) {
    return {
      order: {
        ...orderData,
        ...commonData,
        provider: {
          connect: { uid: providerId }
        }
      },
      details: normalizedDetails.map(({ index: _idx, ...rest }) => ({
        companyId,
        tireId: String(rest.tireId ?? ""),
        count: Number(rest.count ?? 0),
        ...rest
      }))
    };
  }

  if (type === ORDER_TYPE.sale) {
    return {
      order: {
        ...orderData,
        ...commonData,
        customer: {
          connect: { uid: customerId }
        }
      },
      details: normalizedDetails.map(({ index: _idx, ...rest }) => rest)
    };
  }

  if (type === ORDER_TYPE.surplus) {
    return {
      order: {
        ...orderData,
        ...commonData
      },
      details: normalizedDetails.map(({ index: _idx, ...rest }) => ({
        companyId,
        repoId: String(rest.repoId ?? ""),
        tireId: String(rest.tireId ?? ""),
        count: Number(rest.count ?? 0),
        desc: typeof rest.desc === "string" ? rest.desc : undefined
      }))
    };
  }

  return {
    order: {
      ...orderData,
      ...commonData
    },
    details: normalizedDetails.map(({ index: _idx, ...rest }, index) => ({
      companyId,
      repoId: String(rest.repoId ?? ""),
      tireId: String(rest.tireId ?? ""),
      count: Number(rest.count ?? 0),
      number:
        typeof rest.number === "string" && rest.number.length > 0
          ? rest.number
          : `WD-${uid}-${index + 1}`,
      desc: typeof rest.desc === "string" ? rest.desc : undefined
    }))
  };
}

type OrderSubmitData = Required<Pick<OrderRow, "uid" | "details">> &
  Omit<OrderRow, "uid" | "details">;

type OrderDialogTitle =
  | "新增"
  | "审核"
  | "修改"
  | "付款"
  | "收款"
  | "更新物流"
  | "更新状态"
  | "确认到货"
  | "处理理赔费用"
  | "退款";

interface SubmitContext {
  title: OrderDialogTitle;
  type: string;
  curData: OrderRow;
  submitData: OrderSubmitData;
  companyId: string;
}

function createCompanyPayload(
  submitData: OrderSubmitData,
  companyId: string
): Record<string, unknown> {
  const { details: _details, ...orderData } = submitData;
  return {
    ...orderData,
    company: getCompanyConnect(companyId)
  };
}

async function submitCreateOrder({
  type,
  submitData,
  companyId
}: SubmitContext) {
  if (
    ![
      ORDER_TYPE.purchase,
      ORDER_TYPE.sale,
      ORDER_TYPE.surplus,
      ORDER_TYPE.waste
    ].includes(type as CreateOrderType)
  ) {
    message("当前订单类型暂不支持新增", { type: "warning" });
    return false;
  }

  await addOrderApi(
    type,
    buildCreateOrderPayload(type as CreateOrderType, submitData, companyId) as {
      order: Record<string, unknown>;
      details: OrderDetailDto[];
    }
  );
  return true;
}

async function submitAuditOrder({
  type,
  submitData,
  companyId
}: SubmitContext) {
  const payload = createCompanyPayload(submitData, companyId);
  await updateOrderApi(type, submitData.uid, {
    ...payload,
    isApproved: submitData.isApproved ?? true,
    isLocked: submitData.isApproved ?? true,
    auditAt: submitData.isApproved ? new Date().toISOString() : null
  });
  return true;
}

async function submitOrderPayment({ title, type, submitData }: SubmitContext) {
  const payload = {
    fee: Number(submitData.total) || 0,
    paymentId: submitData.paymentId
  };
  if (title === "付款" && type === ORDER_TYPE.purchase) {
    await payPurchaseOrderApi(submitData.uid, payload);
    return true;
  }
  if (title === "收款" && type === ORDER_TYPE.sale) {
    await paySaleOrderApi(submitData.uid, payload);
    return true;
  }

  return false;
}

async function submitClaimPayment({ submitData }: SubmitContext) {
  await processClaimOrderPaymentApi(submitData.uid, {
    fee: submitData.fee || 0,
    isReceive: submitData.isReceive ?? false
  });
  return true;
}

async function submitRefund({ submitData }: SubmitContext) {
  await refundReturnOrderApi(submitData.uid, {
    fee: submitData.fee || 0
  });
  return true;
}

async function submitConfirmArrival({ submitData }: SubmitContext) {
  const selected = (
    submitData.details as Array<_OrderDetail & { isArrival?: boolean }>
  ).filter(item => Boolean(item.isArrival));

  if (selected.length === 0) {
    message("请在明细中勾选要确认到货的行（是否到货）", {
      type: "warning"
    });
    return false;
  }

  for (const item of selected) {
    if (!item.uid) continue;
    await confirmPurchaseOrderArrivalApi(submitData.uid, {
      detailUid: item.uid,
      batchNo: item.batchNo,
      expiryDate: item.expiryDate
    });
  }
  return true;
}

async function submitGenericUpdate({
  type,
  submitData,
  companyId
}: SubmitContext) {
  await updateOrderApi(type, submitData.uid, {
    ...createCompanyPayload(submitData, companyId)
  });
  return true;
}

async function submitDialogAction(context: SubmitContext) {
  switch (context.title) {
    case "新增":
      return submitCreateOrder(context);
    case "审核":
      return submitAuditOrder(context);
    case "付款":
    case "收款": {
      const handled = await submitOrderPayment(context);
      if (handled) return true;
      return submitGenericUpdate(context);
    }
    case "处理理赔费用":
      return submitClaimPayment(context);
    case "退款":
      return submitRefund(context);
    case "确认到货":
      return submitConfirmArrival(context);
    case "修改":
    case "更新物流":
    case "更新状态":
      return submitGenericUpdate(context);
    default:
      return submitGenericUpdate(context);
  }
}

export async function openDialog(
  title = "新增",
  type: string,
  row?: OrderRow,
  dialogOptions?: Pick<DialogOptions, "closeCallBack">
) {
  addDialog({
    title: `${title}`,
    props: {
      formInline: {
        uid: row?.uid ?? uuid(),
        providerId: row?.providerId ?? undefined,
        customerId: row?.customerId ?? undefined,
        auditorId: row?.auditorId ?? undefined,
        isApproved: row?.isApproved ?? false,
        isLocked: row?.isLocked ?? false,
        logisticsStatus: row?.logisticsStatus ?? 0,
        orderStatus: row?.orderStatus ?? 0,
        rejectReason: row?.rejectReason ?? undefined,
        status: row?.status ?? true,
        desc: row?.desc ?? undefined,
        total: row?.total ?? 0,
        count: row?.count ?? 0,
        paymentId: row?.paymentId ?? undefined,
        fee: row?.fee ?? 0,
        isReceive: row?.isReceive ?? false,
        details: row?.details ?? []
      }
    },
    footerButtons: getFooterButtons(type, title),
    width: "95%",
    hideFooter: ["查看"].includes(title),
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    closeCallBack: dialogOptions?.closeCallBack,
    contentRenderer: () => h(editForm, { ref: formRef }),
    beforeSure: async (done, { options }) => {
      const FormRef = formRef.value?.getRef();
      if (!FormRef) return;

      try {
        await FormRef.validate();
      } catch {
        return;
      }

      const curData = (options.props as { formInline?: OrderRow })
        ?.formInline as OrderRow;
      if (!curData.details || curData.details.length === 0) {
        message("请添加订单详情项", { type: "error" });
        return;
      }

      const submitData = curData as OrderSubmitData;
      try {
        const companyId = await getCompanyId();
        const handled = await submitDialogAction({
          title: title as OrderDialogTitle,
          type,
          curData,
          submitData,
          companyId
        });

        if (!handled) return;
        message(`您${title}了名称为${curData.name}的这条数据`, {
          type: "success"
        });
        done();
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : `${title}失败`;
        message(msg, { type: "error" });
      }
    }
  });
}

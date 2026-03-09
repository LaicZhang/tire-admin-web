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
    beforeSure: (done, { options }) => {
      const FormRef = formRef.value?.getRef();
      if (!FormRef) return;

      const curData = (options.props as { formInline?: OrderRow })
        ?.formInline as OrderRow;
      function chores() {
        message(`您${title}了名称为${curData.name}的这条数据`, {
          type: "success"
        });
        done(); // 关闭弹框
      }
      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          if (!curData.details || curData.details.length === 0) {
            message("请添加订单详情项", { type: "error" });
            return;
          }

          const { uid, details, ...orderData } = curData as Required<
            Pick<OrderRow, "uid" | "details">
          > &
            Omit<OrderRow, "uid" | "details">;
          const companyId = await getCompanyId();
          if (title === "新增") {
            if (
              [
                ORDER_TYPE.purchase,
                ORDER_TYPE.sale,
                ORDER_TYPE.surplus,
                ORDER_TYPE.waste
              ].includes(type as CreateOrderType)
            ) {
              await addOrderApi(
                type,
                buildCreateOrderPayload(
                  type as CreateOrderType,
                  { uid, details, ...orderData },
                  companyId
                ) as {
                  order: Record<string, unknown>;
                  details: OrderDetailDto[];
                }
              );
            } else {
              message("当前订单类型暂不支持新增", { type: "warning" });
              return;
            }
            chores();
          } else if (
            [
              "审核",
              "修改",
              "付款",
              "收款",
              "更新物流",
              "更新状态",
              "确认到货"
            ].includes(title)
          ) {
            if (title === "审核") {
              await updateOrderApi(type, uid, {
                ...orderData,
                isApproved: orderData.isApproved ?? true,
                isLocked: orderData.isApproved ?? true,
                auditAt: orderData.isApproved ? new Date().toISOString() : null,
                company: getCompanyConnect(await getCompanyId())
              });
            } else if (title === "付款" && type === ORDER_TYPE.purchase) {
              await payPurchaseOrderApi(uid, {
                fee: Number(orderData.total) || 0,
                paymentId: orderData.paymentId
              });
            } else if (title === "收款" && type === ORDER_TYPE.sale) {
              await paySaleOrderApi(uid, {
                fee: Number(orderData.total) || 0,
                paymentId: orderData.paymentId
              });
            } else {
              await updateOrderApi(type, uid, {
                ...orderData,
                company: getCompanyConnect(await getCompanyId())
              });
            }
            chores();
          } else if (title === "处理理赔费用") {
            await processClaimOrderPaymentApi(uid, {
              fee: orderData.fee || 0,
              isReceive: orderData.isReceive ?? false
            });
            chores();
          } else if (title === "退款") {
            await refundReturnOrderApi(uid, {
              fee: orderData.fee || 0
            });
            chores();
          } else if (title === "确认到货") {
            const selected = (
              curData.details as Array<_OrderDetail & { isArrival?: boolean }>
            ).filter(item => Boolean(item.isArrival));

            if (selected.length === 0) {
              message("请在明细中勾选要确认到货的行（是否到货）", {
                type: "warning"
              });
              return;
            }

            for (const item of selected) {
              if (!item.uid) continue;
              await confirmPurchaseOrderArrivalApi(uid, {
                detailUid: item.uid,
                batchNo: item.batchNo,
                expiryDate: item.expiryDate
              });
            }
            chores();
          } else {
            await updateOrderApi(type, uid, {
              ...orderData,
              company: getCompanyConnect(await getCompanyId())
            });
            chores();
          }
        }
      });
    }
  });
}

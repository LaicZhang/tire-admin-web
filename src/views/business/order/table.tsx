import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import {
  getCompanyId,
  addOrderApi,
  updateOrderApi,
  payPurchaseOrderApi,
  paySaleOrderApi,
  processClaimOrderPaymentApi,
  refundReturnOrderApi,
  confirmPurchaseOrderArrivalApi
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

const formRef = ref<{ getRef: () => FormInstance } | null>(null);
export function handleSelectionChange(_val: unknown) {
  // 选择变化处理
}
const orderType = ref<string>(ORDER_TYPE.default);

export const allTireList = ref<any[]>([]);
export const allRepoList = ref<any[]>([]);
export const allCustomerList = ref<any[]>([]);
export const allProviderList = ref<any[]>([]);
export const managerList = ref<any[]>([]);

export async function getAllRepoList() {
  const res = await localForage().getItem<any[]>(ALL_LIST.repo);
  if (res) allRepoList.value = res;
}
export async function getAllTireList() {
  const res = await localForage().getItem<any[]>(ALL_LIST.tire);
  if (res) allTireList.value = res;
}

export async function getAllCustomerList() {
  const res = await localForage().getItem<any[]>(ALL_LIST.customer);
  if (res) allCustomerList.value = res;
}

export async function getAllProviderList() {
  const res = await localForage().getItem<any[]>(ALL_LIST.provider);
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function openDialog(title = "新增", type: string, row?: any) {
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
    contentRenderer: () => h(editForm, { ref: formRef }),
    beforeSure: (done, { options }) => {
      const FormRef = formRef.value?.getRef();
      if (!FormRef) return;
      const curData = options.props.formInline;
      function chores() {
        message(`您${title}了名称为${curData.name}的这条数据`, {
          type: "success"
        });
        done(); // 关闭弹框
      }
      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          if (curData.details.length === 0) {
            message("请添加订单详情项", { type: "error" });
            return;
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, uid, details, ...orderData } = curData;
          const companyId = await getCompanyId();
          if (title === "新增") {
            const commonData = getCommonData(uid, companyId, curData);
            delete orderData.auditorId;
            if (type === ORDER_TYPE.purchase) {
              const purchaseOrderData = {
                provider: {
                  connect: { uid: curData.providerId }
                }
              };
              delete orderData.providerId;
              const detailsRes: any[] = [];
              details.map((item: any) => {
                delete item.index;
                detailsRes.push({ companyId, ...item });
              });
              await addOrderApi(type, {
                order: {
                  ...orderData,
                  ...commonData,
                  ...purchaseOrderData
                },
                details: detailsRes
              });
            } else if (type === ORDER_TYPE.sale) {
              const saleOrderData = {
                customer: {
                  connect: { uid: curData.customerId }
                }
              };
              delete orderData.customerId;
              await addOrderApi(type, {
                order: {
                  ...orderData,
                  ...commonData,
                  ...saleOrderData
                },
                details
              });
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
                company: {
                  connect: { uid: await getCompanyId() }
                }
              });
            } else if (title === "付款" && type === ORDER_TYPE.purchase) {
              await payPurchaseOrderApi(uid, {
                fee: orderData.total || 0,
                paymentId: orderData.paymentId
              });
            } else if (title === "收款" && type === ORDER_TYPE.sale) {
              await paySaleOrderApi(uid, {
                fee: orderData.total || 0,
                paymentId: orderData.paymentId
              });
            } else {
              await updateOrderApi(type, uid, {
                ...orderData,
                company: {
                  connect: { uid: await getCompanyId() }
                }
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
            const arrivalDetails = curData.details.map((item: any) => ({
              uid: item.uid,
              count: item.count,
              batchNo: item.batchNo,
              expiryDate: item.expiryDate
            }));
            await confirmPurchaseOrderArrivalApi(uid, {
              details: arrivalDetails
            });
            chores();
          } else {
            await updateOrderApi(type, uid, {
              ...orderData,
              company: {
                connect: { uid: await getCompanyId() }
              }
            });
            chores();
          }
        }
      });
    }
  });
}

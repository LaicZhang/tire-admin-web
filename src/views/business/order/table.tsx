import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addOrderApi, updateOrderApi } from "@/api";
import editForm from "./form.vue";
import { ALL_LIST, CUR_ORDER_TYPE, localForage } from "@/utils";

const formRef = ref(null);
export function handleSelectionChange(val) {
  console.log("handleSelectionChange", val);
}
const orderType = ref("");

export const allTireList = ref([]);
export const allRepoList = ref([]);
export const allCustomerList = ref([]);
export const allProviderList = ref([]);
export const managerList = ref([]);

export async function getAllRepoList() {
  const res: any[] = await localForage().getItem(ALL_LIST.repo);
  if (res) allRepoList.value = res;
}
export async function getAllTireList() {
  const res: any[] = await localForage().getItem(ALL_LIST.tire);
  if (res) allTireList.value = res;
}

export async function getAllCustomerList() {
  const res: any[] = await localForage().getItem(ALL_LIST.customer);
  if (res) allCustomerList.value = res;
}

export async function getAllProviderList() {
  const res: any[] = await localForage().getItem(ALL_LIST.provider);
  if (res) allProviderList.value = res;
}

export async function getOrderType() {
  orderType.value = await localForage().getItem(CUR_ORDER_TYPE);
  return orderType.value;
}
import { v7 as uuid } from "uuid";
export async function openDialog(title = "新增", type, row?) {
  const orderId = uuid();
  addDialog({
    title: `${title}`,
    props: {
      formInline: {
        uid: row?.uid ?? orderId,
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
        details: row?.details ?? []
      }
    },
    width: "95%",
    hideFooter: title === "查看",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () => h(editForm, { ref: formRef }),
    beforeSure: (done, { options }) => {
      const FormRef = formRef.value.getRef();
      const curData = options.props.formInline;
      function chores() {
        message(`您${title}了名称为${curData.name}的这条数据`, {
          type: "success"
        });
        done(); // 关闭弹框
      }
      FormRef.validate(async valid => {
        if (valid) {
          console.log("curData", curData);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, uid, details, ...orderData } = curData;
          const companyId = await getCompanyId();
          if (title === "新增") {
            const commonData = {
              uid,
              company: {
                connect: { uid: companyId }
              },
              auditor: {
                connect: { uid: curData.auditorId }
              }
            };
            delete orderData.auditorId;
            if (type === "purchase-order") {
              const purchaseOrderData = {
                provider: {
                  connect: { uid: curData.providerId }
                }
              };
              delete orderData.providerId;
              const detailsRes = [];
              details.map(item => {
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
            } else if (type === "sale-order") {
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
            ["审核", "修改", "付款", "收款", "更新物流", "更新状态"].includes(
              title
            )
          ) {
            if (title === "审核") {
              await updateOrderApi(type, uid, {
                ...orderData,
                company: {
                  connect: { uid: await getCompanyId() }
                }
              });
            }
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

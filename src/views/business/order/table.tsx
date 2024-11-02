import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addOrderApi, updateOrderApi, getUidApi } from "@/api";
import editForm from "./form.vue";
import { ALL_LIST, localForage } from "@/utils";

const formRef = ref(null);
const orderId = ref("");
export function handleSelectionChange(val) {
  console.log("handleSelectionChange", val);
}

export async function getOrderId(type: string) {
  if (orderId.value) return;
  const { data, msg, code } = await getUidApi(type);
  if (code === 200) {
    orderId.value = data.id;
  } else message(msg, { type: "error" });
}
export const allTireList = ref([]);
export const allRepoList = ref([]);
export async function getAllRepoList() {
  const res: any[] = await localForage().getItem(ALL_LIST.repo);
  if (res) {
    allRepoList.value = res;
    console.log(ALL_LIST.repo, allRepoList.value);
  }
}
export async function getAllTireList() {
  const res: any[] = await localForage().getItem(ALL_LIST.tire);
  if (res) {
    allTireList.value = res;
    console.log(ALL_LIST.tire, allTireList.value);
  }
}

export async function openDialog(title = "新增", type, row?) {
  await getOrderId(type);
  addDialog({
    title: `${title}`,
    props: {
      formInline: {
        uid: row?.uid ?? "",
        desc: row?.desc ?? ""
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
          const { id, uid, type, details, ...orderData } = curData;
          if (title === "新增") {
            await addOrderApi(type, {
              order: {
                ...orderData,
                uid: orderId.value,
                company: {
                  connect: { uid: await getCompanyId() }
                }
              },
              details
            });
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

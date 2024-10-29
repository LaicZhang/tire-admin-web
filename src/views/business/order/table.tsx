import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addOrderApi, updateOrderApi } from "@/api";
import editForm from "./form.vue";

const formRef = ref(null);

export function handleSelectionChange(val) {
  console.log("handleSelectionChange", val);
}

export function openDialog(title = "新增", type, row?) {
  addDialog({
    title: `${title}订单`,
    props: {
      formInline: {
        uid: row?.uid ?? "",
        desc: row?.desc ?? ""
      }
    },
    width: "40%",
    hideFooter: title === "查看" ? true : false,
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
          const { id, uid, type, ...orderData } = curData;
          if (title === "新增") {
            await addOrderApi(type, {
              ...orderData,
              company: {
                connect: { uid: await getCompanyId() }
              }
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

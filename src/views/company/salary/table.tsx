import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addSalaryApi, updateSalaryApi } from "@/api";
import editForm from "./form.vue";

interface FormItemProps {
  uid: string;
  /** 部门名称 */
  name: string;
  /** 部门编号 */
  id: string;
  /** 备注 */
  desc: string;
  managerId: string;
}
interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };

const formRef = ref(null);

export function handleSelectionChange(val) {
  console.log("handleSelectionChange", val);
}

export function openDialog(title = "新增", row?: FormItemProps) {
  addDialog({
    title: `${title}部门`,
    props: {
      formInline: {
        name: row?.name ?? "",
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
      const curData = options.props.formInline as FormItemProps;
      function chores() {
        message(`您${title}了名称为${curData.name}的这条数据`, {
          type: "success"
        });
        done(); // 关闭弹框
      }
      FormRef.validate(async valid => {
        if (valid) {
          console.log("curData", curData);
          if (title === "新增") {
            const { name, desc, managerId } = curData;
            await addSalaryApi({
              name,
              desc,
              managerId,
              company: {
                connect: { uid: await getCompanyId() }
              }
            });
            chores();
          } else {
            const { uid, name, desc, managerId } = curData;
            await updateSalaryApi(uid, { name, desc, managerId });
            chores();
          }
        }
      });
    }
  });
}

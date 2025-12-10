import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { updateCompanyInfoApi } from "@/api";
import editForm from "./form.vue";

interface FormItemProps {
  uid: string;
  name: string;
  id: number;
  desc?: string;
  bossId: string;
}
interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };

const formRef = ref(null);

export function handleSelectionChange(val) {
  console.log("handleSelectionChange", val);
}

export function openDialog(title = "更新", row?: FormItemProps) {
  addDialog({
    title: `公司信息更新`,
    props: {
      formInline: {
        name: row?.name ?? "",
        uid: row?.uid ?? "",
        desc: row?.desc ?? ""
      }
    },
    width: "40%",
    hideFooter: title === "查看",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(editForm, { ref: formRef, formInline: options.props.formInline }),
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
          if (title === "更新") {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, uid, ...info } = curData;
            await updateCompanyInfoApi(info);
            chores();
          }
        }
      });
    }
  });
}

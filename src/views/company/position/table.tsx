import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addPositionApi, updatePositionApi } from "@/api";
import editForm from "./form.vue";
import menuForm from "./menuForm.vue";

interface FormItemProps {
  uid: string;
  name: string;
  cn?: string;
  id: number;
  desc?: string;
}
interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };

const formRef = ref(null);
const menuFormRef = ref<{ submit: () => Promise<boolean> } | null>(null);

export function handleSelectionChange(_val) {
  // 选择变化处理
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
          if (title === "新增") {
            const { name, desc } = curData;
            await addPositionApi({
              name,
              desc,
              company: {
                connect: { uid: getCompanyId() }
              }
            });
            chores();
          } else {
            const { uid, name, desc } = curData;
            await updatePositionApi(uid, { name, desc });
            chores();
          }
        }
      });
    }
  });
}

export function openMenuDialog(row: FormItemProps) {
  addDialog({
    title: `配置菜单 - ${row.cn || row.name}`,
    props: {
      uid: row.uid
    },
    width: "55%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(menuForm, { ref: menuFormRef, uid: options.props.uid }),
    beforeSure: async done => {
      const ok = await menuFormRef.value?.submit();
      if (ok) done();
    }
  });
}

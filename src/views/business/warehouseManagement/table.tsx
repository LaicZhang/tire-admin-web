import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addReserveApi, updateReserveApi } from "@/api";
import editForm from "./form.vue";

interface FormItemProps {
  uid: string;
  name: string;
  id: number;
  desc?: string;
  startAt: string;
  endAt: string;
  address: string;
  status: boolean;
}
interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };

const formRef = ref(null);

export function handleSelectionChange(_val) {
  // 选择变化处理
}

export function openDialog(title = "新增", row?: FormItemProps) {
  addDialog({
    title: `${title}库存`,
    props: {
      formInline: {
        name: row?.name ?? "",
        uid: row?.uid ?? "",
        desc: row?.desc ?? undefined,
        startAt: row?.startAt ?? "",
        endAt: row?.endAt ?? "",
        address: row?.address ?? "",
        status: row?.status ?? 0
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
            await addReserveApi({
              name,
              desc,
              company: {
                connect: { uid: getCompanyId() }
              }
            });
            chores();
          } else {
            const { id, name, desc } = curData;
            await updateReserveApi(id, {
              name,
              desc
            });
            chores();
          }
        }
      });
    }
  });
}

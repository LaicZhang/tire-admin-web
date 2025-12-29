import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addTireNumberApi, updateTireNumberApi } from "@/api";
import editForm from "./form.vue";
import type { FormInstance } from "element-plus";

interface FormItemProps {
  id: number;
  number: string;
  desc?: string;
  tireId: string;
  isLocked: boolean;
  isInRepo: boolean;
}
interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };

const formRef = ref<{ getRef: () => FormInstance } | null>(null);

export function handleSelectionChange(_val: unknown) {
  // 选择变化处理
}

export function openDialog(title = "新增", row?: FormItemProps) {
  addDialog({
    title: `${title}胎号`,
    props: {
      formInline: {
        number: row?.number ?? "",
        id: row?.id ?? 0,
        desc: row?.desc ?? "",
        tireId: row?.tireId ?? "",
        isLocked: row?.isLocked ?? false,
        isInRepo: row?.isInRepo ?? false
      }
    },
    width: "40%",
    hideFooter: title === "查看",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(editForm, {
        ref: formRef,
        formInline: (options.props as { formInline: FormItemProps }).formInline
      }),
    beforeSure: (done, { options }) => {
      const FormRef = formRef.value?.getRef();
      if (!FormRef) return;
      const curData = (options.props as { formInline: FormItemProps })
        .formInline;
      function chores() {
        message(`您${title}了id为${curData.id}的这条数据`, {
          type: "success"
        });
        done(); // 关闭弹框
      }
      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, tireId, ...curTireNumberData } = curData;
          const payload = {
            ...curTireNumberData,
            company: {
              connect: { uid: await getCompanyId() }
            },
            tire: {
              connect: { uid: tireId }
            }
          };
          if (title === "新增") {
            await addTireNumberApi(payload);
            chores();
          } else {
            await updateTireNumberApi(curTireNumberData.number, payload);
            chores();
          }
        }
      });
    }
  });
}

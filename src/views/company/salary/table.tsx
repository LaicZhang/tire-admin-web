import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addSalaryApi, updateSalaryApi } from "@/api";
import editForm from "./form.vue";
import type { FormInstance } from "element-plus";

interface FormItemProps {
  uid: string;
  name: string;
  id: number;
  desc?: string;
  base: number;
  performance: number;
  fulltimeAttendanceAward: number;
  subsidy: number;
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
    title: `${title}部门`,
    props: {
      formInline: {
        uid: row?.uid ?? "",
        name: row?.name ?? "",
        id: row?.id ?? 0,
        base: row?.base ?? 0,
        performance: row?.performance ?? 0,
        fulltimeAttendanceAward: row?.fulltimeAttendanceAward ?? 0,
        subsidy: row?.subsidy ?? 0,
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
        message(`您${title}了名称为${curData.name}的这条数据`, {
          type: "success"
        });
        done(); // 关闭弹框
      }
      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          if (title === "新增") {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...curSalaryData } = curData;
            await addSalaryApi({
              ...curSalaryData,
              company: {
                connect: { uid: await getCompanyId() }
              }
            });
            chores();
          } else {
            const { uid, id: _id, ...curSalaryData } = curData;
            await updateSalaryApi(uid, { ...curSalaryData });
            chores();
          }
        }
      });
    }
  });
}

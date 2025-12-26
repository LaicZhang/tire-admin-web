import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addProviderApi, updateProviderApi } from "@/api";
import editForm from "./form.vue";
import type { FormInstance } from "element-plus";

interface FormItemProps {
  id: number;
  uid: string;
  name: string;
  desc?: string;
  operatorId: string;
  isIndividual: boolean;
  isPublic: boolean;
  contactName: string;
  province: string;
  status: boolean;
  initialPayable?: number;
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
    title: `${title}供应商`,
    props: {
      formInline: {
        name: row?.name ?? "",
        uid: row?.uid ?? "",
        desc: row?.desc ?? undefined,
        operatorId: row?.operatorId ?? "",
        isIndividual: row?.isIndividual ?? false,
        isPublic: row?.isPublic ?? false,
        contactName: row?.contactName ?? "",
        province: row?.province ?? "",
        status: row?.status ?? false,
        initialPayable: 0
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
      const FormRef = formRef.value?.getRef();
      if (!FormRef) return;
      const curData = options.props.formInline as FormItemProps;
      function chores() {
        message(`您${title}了名称为${curData.name}的这条数据`, {
          type: "success"
        });
        done(); // 关闭弹框
      }
      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, uid, operatorId, ...customerData } = curData;
          if (title === "新增") {
            await addProviderApi({
              provider: {
                ...customerData,
                // Add initialPayable if present
                ...(customerData.initialPayable
                  ? { initialPayable: customerData.initialPayable }
                  : {}),
                ...(operatorId
                  ? { operator: { connect: { uid: operatorId } } }
                  : {}),
                company: {
                  connect: { uid: getCompanyId() }
                }
              }
            });
            chores();
          } else {
            await updateProviderApi(uid, {
              provider: {
                ...customerData,
                ...(operatorId
                  ? { operator: { connect: { uid: operatorId } } }
                  : {}),
                company: {
                  connect: { uid: getCompanyId() }
                }
              }
            });
            chores();
          }
        }
      });
    }
  });
}

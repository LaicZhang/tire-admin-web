import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addProviderApi, updateProviderApi } from "@/api";
import editForm from "./form.vue";

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
        status: row?.status ?? false
      }
    },
    width: "40%",
    hideFooter: title === "查看",
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, uid, operatorId, ...customerData } = curData;
          if (title === "新增") {
            await addProviderApi({
              provider: {
                ...customerData,
                operator: {
                  connect: { uid: null }
                },
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
                operator: {
                  connect: { uid: operatorId }
                },
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

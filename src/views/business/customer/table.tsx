import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addCustomerApi, updateCustomerApi } from "@/api";
import editForm from "./form.vue";

interface FormItemProps {
  uid: string;
  name: string;
  id: number;
  desc: string;
  operatorId: string;
  level: number;
  totalTransactionAmount: number;
  isPublic: boolean;
  province: string;
  isIndividual: boolean;
  from: string;
  limit: number;
  discount: number;
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
    title: `${title}客户`,
    props: {
      formInline: {
        name: row?.name ?? "",
        uid: row?.uid ?? "",
        desc: row?.desc ?? "",
        id: row?.id ?? 0,
        operatorId: row?.operatorId ?? "",
        level: row?.level ?? 0,
        totalTransactionAmount: row?.totalTransactionAmount ?? 0,
        isPublic: row?.isPublic ?? false,
        province: row?.province ?? "",
        isIndividual: row?.isIndividual ?? false,
        from: row?.from ?? "",
        limit: row?.limit ?? 0,
        discount: row?.discount ?? 10
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
            await addCustomerApi({
              customer: {
                ...customerData,
                operator: {
                  connect: { uid: null }
                },
                company: {
                  connect: { uid: await getCompanyId() }
                }
              }
            });
            chores();
          } else {
            await updateCustomerApi(uid, {
              ...customerData,
              operator: {
                connect: { uid: operatorId }
              },
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

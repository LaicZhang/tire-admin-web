import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addTireApi, updateTireApi } from "@/api";
import editForm from "./form.vue";

interface FormItemProps {
  id?: number;
  uid?: string;
  group: string;
  name: string;
  desc?: string;
  unit: string;
  pattern: string;
  brand: string;
  loadIndex: string;
  speedLevel: string;
  format: string;
  weight: number;
  purchasePriceWithTax: number;
  purchasePrice: number;
  salePriceWithTax: number;
  salePrice: string;
  commissionType: number;
  commission: string;
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
    title: `${title}轮胎`,
    props: {
      formInline: {
        id: row?.id ?? 0,
        name: row?.name ?? "",
        uid: row?.uid ?? "",
        desc: row?.desc ?? "",
        unit: row?.unit ?? "条",
        pattern: row?.pattern ?? "",
        brand: row?.brand ?? "",
        loadIndex: row?.loadIndex ?? "",
        speedLevel: row?.speedLevel ?? "",
        format: row?.format ?? "",
        weight: row?.weight ?? 0,
        purchasePriceWithTax: row?.purchasePriceWithTax ?? 0,
        purchasePrice: row?.purchasePrice ?? 0,
        salePriceWithTax: row?.salePriceWithTax ?? 0,
        salePrice: row?.salePrice ?? 0,
        commissionType: row?.commissionType ?? 0,
        commission: row?.commission ?? 0
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
          const { id, uid, ...customerData } = curData;
          if (title === "新增") {
            await addTireApi({
              ...customerData,
              company: {
                connect: { uid: await getCompanyId() }
              }
            });
            chores();
          } else {
            await updateTireApi(uid, {
              ...customerData,
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

import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addTireApi, updateTireApi } from "@/api";
import editForm from "./form.vue";

import {
  clearUploadedImages,
  getUploadedImages
} from "@/views/business/tire/store";

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
  covers: any[];
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
        id: row?.id ?? undefined,
        name: row?.name ?? undefined,
        uid: row?.uid ?? undefined,
        desc: row?.desc ?? undefined,
        unit: row?.unit ?? "套",
        pattern: row?.pattern ?? undefined,
        brand: row?.brand ?? undefined,
        loadIndex: row?.loadIndex ?? undefined,
        speedLevel: row?.speedLevel ?? undefined,
        format: row?.format ?? undefined,
        weight: row?.weight ?? undefined,
        purchasePriceWithTax: row?.purchasePriceWithTax ?? undefined,
        purchasePrice: row?.purchasePrice ?? undefined,
        salePriceWithTax: row?.salePriceWithTax ?? undefined,
        salePrice: row?.salePrice ?? undefined,
        commissionType: row?.commissionType ?? undefined,
        commission: row?.commission ?? undefined,
        covers: row?.covers ?? []
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, uid, ...tireData } = curData;

          if (title === "新增") {
            const uploadedImagesList: any[] = await getUploadedImages();
            if (uploadedImagesList) tireData.covers = uploadedImagesList;
            if (tireData.covers.length === 0) delete tireData.covers;
            const tire = await addTireApi({
              ...tireData,
              company: {
                connect: { uid: await getCompanyId() }
              }
            });
            if (tire.code === 200) await clearUploadedImages();
            chores();
          } else {
            const uploadedImagesList: any[] = await getUploadedImages();
            if (uploadedImagesList) tireData.covers = uploadedImagesList;
            if (tireData.covers.length === 0) delete tireData.covers;
            console.log("uploadedImagesList", uploadedImagesList);
            const tire = await updateTireApi(uid, {
              ...tireData,
              company: {
                connect: { uid: await getCompanyId() }
              }
            });
            if (tire.code === 200) await clearUploadedImages();
            chores();
          }
        }
      });
    }
  });
}

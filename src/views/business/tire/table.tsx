import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addTireApi, updateTireApi } from "@/api";
import editForm from "./form.vue";
import type { FormInstance } from "element-plus";

import {
  clearUploadedImages,
  getUploadedImages
} from "@/views/business/tire/store";

interface FormItemProps {
  id?: number;
  uid?: string;
  group: string;
  name?: string;
  desc?: string;
  unit: string;
  pattern: string;
  brand: string;
  loadIndex: string;
  speedLevel: string;
  format: string;
  weight?: number;
  purchasePriceWithTax?: number;
  purchasePrice?: number;
  salePriceWithTax?: number;
  salePrice?: number;
  commissionType: number;
  commission?: string;
  covers: Record<string, unknown>[];
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
    title: `${title}轮胎`,
    props: {
      formInline: {
        id: row?.id ?? undefined,
        group: row?.group ?? "默认",
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
        salePrice:
          row?.salePrice == null
            ? undefined
            : typeof row.salePrice === "number"
              ? row.salePrice
              : Number(row.salePrice),
        commissionType: row?.commissionType ?? 0,
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
          if (!curData.name) {
            message("名称为必填项", { type: "warning" });
            return;
          }
          const { id: _id, uid, covers: formCovers, ...tireData } = curData;

          const uploadedImagesList = await getUploadedImages();
          const covers =
            uploadedImagesList.length > 0 ? uploadedImagesList : formCovers;

          const payload = {
            ...tireData,
            name: curData.name,
            ...(covers.length > 0 ? { covers } : {}),
            company: {
              connect: { uid: await getCompanyId() }
            }
          };

          if (title === "新增") {
            const tire = await addTireApi(payload);
            if (tire.code === 200) await clearUploadedImages();
            chores();
          } else {
            if (!uid) {
              message("缺少轮胎ID，无法更新", { type: "error" });
              return;
            }
            const tire = await updateTireApi(uid, payload);
            if (tire.code === 200) await clearUploadedImages();
            chores();
          }
        }
      });
    }
  });
}

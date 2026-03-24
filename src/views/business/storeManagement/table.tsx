import { h, ref } from "vue";
import type { FormInstance } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { addDialog } from "@/composables/useDialogService";
import { getCompanyConnect } from "@/api/company";
import { addStoreApi, updateStoreApi, type Store } from "@/api/company/store";
import { message } from "@/utils/message";
import editForm from "./form.vue";
import type { FormItemProps } from "./types";

const formRef = ref<{ formRef?: FormInstance } | null>(null);

export function openDialog(
  title = "新增",
  row?: Store,
  refreshCallback?: () => void
) {
  addDialog({
    title: `${title}门店`,
    props: {
      formInline: {
        uid: row?.uid ?? undefined,
        name: row?.name ?? "",
        address: row?.address ?? "",
        defaultRepositoryId: row?.defaultRepositoryId ?? undefined,
        desc: row?.desc ?? "",
        status: row?.status ?? true
      },
      refreshCallback
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
      const FormRef = formRef.value?.formRef;
      if (!FormRef) return;
      const curData = (options.props as { formInline: FormItemProps })
        .formInline;
      const refreshCb = (options.props as { refreshCallback?: () => void })
        .refreshCallback;

      async function chores() {
        message(`您${title}了名称为${curData.name}的这条数据`, {
          type: "success"
        });
        done();
        refreshCb?.();
      }

      FormRef.validate(async (valid: boolean) => {
        if (!valid || !curData.defaultRepositoryId) return;

        const payload = {
          name: curData.name,
          address: curData.address,
          desc: curData.desc,
          status: curData.status,
          defaultRepository: {
            connect: { uid: curData.defaultRepositoryId }
          }
        };

        if (title === "新增") {
          await addStoreApi({
            ...payload,
            company: getCompanyConnect()
          });
          await chores();
          return;
        }

        if (!curData.uid) {
          message("缺少门店ID，无法更新", { type: "error" });
          return;
        }
        await updateStoreApi(curData.uid, payload);
        await chores();
      });
    }
  });
}

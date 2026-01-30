import { h, ref } from "vue";
import { message } from "@/utils/message";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId } from "@/api/company";
import { addRepoApi, updateRepoApi, type Repo } from "@/api/company/repo";
import editForm from "./form.vue";
import type { FormInstance } from "element-plus";

import type { FormItemProps } from "./types";

const formRef = ref<{ getRef: () => FormInstance } | null>(null);

type RepoRow = Repo & { manager?: { uid?: string } | null };

export function openDialog(
  title = "新增",
  row?: RepoRow,
  refreshCallback?: () => void
) {
  addDialog({
    title: `${title}仓库`,
    props: {
      formInline: {
        uid: row?.uid ?? undefined,
        name: row?.name ?? "",
        address: row?.address ?? "",
        managerId: row?.manager?.uid ?? undefined, // Assuming manager is an object in row
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
      const FormRef = formRef.value?.getRef();
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
        if (refreshCb) refreshCb();
      }

      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          if (title === "新增") {
            const { name, address, managerId, desc, status } = curData;
            await addRepoApi({
              name,
              address,
              manager: managerId ? { connect: { uid: managerId } } : undefined,
              desc,
              status,
              company: {
                connect: { uid: getCompanyId() }
              }
            });
            await chores();
          } else {
            const { uid, name, address, managerId, desc, status } = curData;
            if (!uid) {
              message("缺少仓库ID，无法更新", { type: "error" });
              return;
            }
            await updateRepoApi(uid, {
              name,
              address,
              manager: managerId ? { connect: { uid: managerId } } : undefined, // Check if update supports relation update like this
              desc,
              status
            });
            await chores();
          }
        }
      });
    }
  });
}

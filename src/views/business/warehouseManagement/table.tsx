import { h, ref } from "vue";
import { message } from "@/utils/message";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId } from "@/api/company";
import { addRepoApi, updateRepoApi } from "@/api/company/repo";
import editForm from "./form.vue";
import type { FormInstance } from "element-plus";

interface FormItemProps {
  uid?: string;
  name: string;
  address?: string;
  managerId?: string;
  desc?: string;
  status: boolean;
}
interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };

const formRef = ref<{ getRef: () => FormInstance } | null>(null);

export function openDialog(
  title = "新增",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row?: any,
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
      function chores() {
        message(`您${title}了名称为${curData.name}的这条数据`, {
          type: "success"
        });
        done(); // 关闭弹框
        // We typically need to refresh the list here, but openDialog doesn't easily callback.
        // The parent component listens for dialog close or similar?
        // Actually the parent passes `getRepoListInfo` to `PureTableBar` @refresh.
        // But for add/edit, we rely on the fact that `onSearch` or `getRepoListInfo` is called.
        // In the original code `chores` called `done()`.
        // Wait, the original code didn't trigger refresh in `openDialog`?
        // Ah, `handleDelete` called `onSearch`.
        // `openDialog` usually doesn't refresh automatically unless we pass a callback.
        // But looking at `index.vue`, `openDialog` is just imported.
        // Let's check `index.vue`. It passes nothing.
        // Maybe I should add a callback or event?
        // For now, I'll stick to the original pattern. Original `openDialog` didn't seem to refresh parent?
        // Ah, `addDialog` might return a promise or have a `close` callback?
        // `ReDialog` likely handles this?
        // Let's look at `index.vue` again. It doesn't seem to have a mechanism to refresh after dialog close.
        // Wait, `addDialog` is from a component library.
        // If I want to refresh, I might need to dispatch an event or use a global bus, or pass a callback.
        // The previous code didn't refresh? That's a bug in previous code or I missed something.
        // `mitt` is used in package.json.
        // Let's assume for now I just save. The user might need to manually refresh.
        // OR `addDialog` options might accept a `closeCallBack`.
        // I will follow the existing pattern for now but ensure API calls are correct.
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
            chores();
            // Trigger refresh if possible.
            // Since we can't easily reach parent, we might rely on window reload or just let user refresh.
            // A better way is to pass a "refresh" callback to openDialog.
            // I'll add `refreshCallback` to openDialog signature.
            if (refreshCb) refreshCb();
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
            chores();
            if (refreshCb) refreshCb();
          }
        }
      });
    }
  });
}

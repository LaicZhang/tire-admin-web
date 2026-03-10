import { Fragment, h, ref, type Component } from "vue";
import { ElButton } from "element-plus";
import { closeDialog } from "@/components/ReDialog";
import { openManagedFormDialog } from "./formDialogBase";

export interface ManagedSubmitDialogRef {
  submit: () => Promise<boolean>;
}

export interface OpenManagedSubmitDialogOptions {
  title: string;
  formComponent: Component;
  width?: string | number;
  closeOnClickModal?: boolean;
  confirmText?: string;
  cancelText?: string;
  buildProps?: () => Record<string, unknown>;
  onSuccess?: () => void | Promise<void>;
}

export function useManagedSubmitDialog<TRef extends ManagedSubmitDialogRef>() {
  const formRef = ref<TRef | null>(null);

  const openDialog = (options: OpenManagedSubmitDialogOptions) => {
    const submitting = ref(false);
    formRef.value = null;

    openManagedFormDialog({
      title: options.title,
      width: options.width,
      closeOnClickModal: options.closeOnClickModal,
      contentRenderer: () =>
        h(options.formComponent, {
          ref: formRef,
          ...(options.buildProps?.() ?? {})
        }),
      footerRenderer: ({ options: dialogOptions, index }) =>
        h(Fragment, [
          h(
            ElButton,
            {
              disabled: submitting.value,
              onClick: () =>
                closeDialog(dialogOptions, index, { command: "cancel" })
            },
            () => options.cancelText ?? "取消"
          ),
          h(
            ElButton,
            {
              type: "primary",
              loading: submitting.value,
              onClick: async () => {
                if (submitting.value || !formRef.value) return;

                submitting.value = true;
                try {
                  const isSuccess =
                    (await formRef.value.submit().catch(() => false)) === true;
                  if (!isSuccess) return;

                  closeDialog(dialogOptions, index, { command: "sure" });
                  await options.onSuccess?.();
                } finally {
                  submitting.value = false;
                }
              }
            },
            () => options.confirmText ?? "确定"
          )
        ])
    });
  };

  return {
    formRef,
    openDialog
  };
}

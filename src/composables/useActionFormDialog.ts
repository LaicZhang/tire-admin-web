import type { Component, Ref } from "vue";
import { h } from "vue";
import type { FormInstance } from "element-plus";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { handleApiError } from "@/utils";

export type ActionFormDialogAction =
  | "新增"
  | "修改"
  | "查看"
  | "审核"
  | "收款"
  | "付款";

export interface ActionFormDialogFormRef {
  getRef: () => FormInstance;
}

export type ActionFormDialogHandlers<TData> = Partial<
  Record<
    ActionFormDialogAction,
    /**
     * Return false to keep dialog open (e.g. local validation failed).
     */
    (formData: TData) => Promise<void | boolean>
  >
>;

export interface UseActionFormDialogOptions<
  TData,
  TFormRef extends ActionFormDialogFormRef
> {
  entityName: string;
  formComponent: Component;
  formRef: Ref<TFormRef | null>;
  dialogWidth?: string | number;
  closeOnClickModal?: boolean;
  buildFormData: (row?: TData) => TData;
  buildFormProps: (
    formData: TData,
    action: ActionFormDialogAction
  ) => Record<string, unknown>;
  handlers: ActionFormDialogHandlers<TData>;
  afterSuccess?: () => void | Promise<void>;
}

export function useActionFormDialog<
  TData,
  TFormRef extends ActionFormDialogFormRef
>(options: UseActionFormDialogOptions<TData, TFormRef>) {
  const {
    entityName,
    formComponent,
    formRef,
    dialogWidth = "90%",
    closeOnClickModal = false,
    buildFormData,
    buildFormProps,
    handlers,
    afterSuccess
  } = options;

  const getDialogTitle = (action: ActionFormDialogAction) =>
    `${action}${entityName}`;

  const openDialog = (action: ActionFormDialogAction, row?: TData) => {
    const formData = buildFormData(row);

    addDialog({
      title: getDialogTitle(action),
      props: buildFormProps(formData, action),
      width: dialogWidth,
      hideFooter: action === "查看",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal,
      contentRenderer: () =>
        h(formComponent, {
          ref: formRef,
          ...buildFormProps(formData, action)
        }),
      beforeSure: async done => {
        if (action === "查看") {
          done();
          return;
        }

        const handler = handlers[action];
        if (!handler) {
          done();
          return;
        }

        const formInstance = formRef.value?.getRef();
        if (!formInstance) return;

        formInstance.validate(async (valid: boolean) => {
          if (!valid) return;
          try {
            const result = await handler(formData);
            if (result === false) return;
            done();
            await afterSuccess?.();
          } catch (error) {
            handleApiError(error, `${action}失败`);
          }
        });
      }
    });
  };

  return { openDialog };
}

import { ref, type Component, type Ref, h } from "vue";
import { addDialog } from "@/components/ReDialog";
import type { CommonResult } from "@/api/type";
import { message } from "@/utils";
import { createLogger } from "@/utils/logger";

const logger = createLogger("useFormDialog");

/**
 * 对话框模式
 */
export type DialogMode = "create" | "edit" | "view";

/**
 * 对话框配置
 */
export interface DialogConfig {
  /** 对话框标题 */
  title: string;
  /** 宽度 */
  width?: string | number;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 自定义类名 */
  customClass?: string;
  /** 关闭前的回调 */
  beforeClose?: (done: () => void) => void;
}

/**
 * 表单对话框选项
 */
export interface UseFormDialogOptions<T> {
  /** 表单组件 */
  formComponent: Component;
  /** 对话框配置 */
  dialogConfig?: Partial<DialogConfig>;
  /** 默认表单数据 */
  defaultFormData?: Partial<T>;
  /** 提交 API */
  submitApi?: (data: T) => Promise<CommonResult<T>>;
  /** 更新 API */
  updateApi?: (uid: string, data: Partial<T>) => Promise<CommonResult<T>>;
  /** 提交前钩子 */
  beforeSubmit?: (mode: DialogMode, data: T) => T | Promise<T>;
  /** 提交后钩子 */
  afterSubmit?: (
    mode: DialogMode,
    result: CommonResult<T>
  ) => void | Promise<void>;
  /** 提交错误钩子 */
  onSubmitError?: (error: unknown) => void;
  /** 关闭后钩子 */
  afterClose?: () => void;
}

/**
 * 表单对话框返回值
 */
export interface UseFormDialogReturn<T> {
  /** 打开对话框 */
  openDialog: (mode: DialogMode, data?: T) => void;
  /** 关闭对话框 */
  closeDialog: () => void;
  /** 对话框是否可见 */
  visible: Ref<boolean>;
  /** 当前模式 */
  mode: Ref<DialogMode>;
  /** 表单数据 */
  formData: Ref<Partial<T>>;
  /** 提交表单 */
  submitForm: () => Promise<void>;
  /** 刷新列表的回调 */
  setRefreshCallback: (callback: () => Promise<void>) => void;
}

/**
 * 表单对话框 Composable
 *
 * @example
 * ```typescript
 * const {
 *   openDialog,
 *   formData,
 *   mode
 * } = useFormDialog<Customer>({
 *   formComponent: CustomerForm,
 *   submitApi: addCustomerApi,
 *   updateApi: updateCustomerApi
 * });
 *
 * // 打开新增对话框
 * openDialog('create');
 *
 * // 打开编辑对话框
 * openDialog('edit', customerData);
 *
 * // 打开查看对话框
 * openDialog('view', customerData);
 * ```
 */
export function useFormDialog<
  T extends Record<string, unknown> & { uid?: string } = Record<
    string,
    unknown
  > & { uid?: string }
>(options: UseFormDialogOptions<T>): UseFormDialogReturn<T> {
  const {
    formComponent,
    dialogConfig = {},
    defaultFormData = {},
    submitApi,
    updateApi,
    beforeSubmit,
    afterSubmit,
    onSubmitError,
    afterClose
  } = options;

  // State
  const visible = ref(false);
  const mode = ref<DialogMode>("create");
  const formData = ref<Partial<T>>({ ...defaultFormData }) as Ref<Partial<T>>;
  const formRef = ref();
  let refreshCallback: (() => Promise<void>) | null = null;

  // Methods
  const getDialogTitle = (m: DialogMode, customTitle?: string): string => {
    if (customTitle) return customTitle;
    const titles = {
      create: "新增",
      edit: "编辑",
      view: "查看"
    };
    return titles[m];
  };

  const openDialog = (m: DialogMode, data?: T) => {
    mode.value = m;
    if (data) {
      formData.value = { ...data };
    } else {
      formData.value = { ...defaultFormData };
    }
    visible.value = true;

    const title = getDialogTitle(m, dialogConfig.title);
    const width = dialogConfig.width || "60%";

    addDialog({
      title,
      width,
      showClose: dialogConfig.showClose !== false,
      hideFooter: m === "view",
      class: dialogConfig.customClass,
      beforeClose: dialogConfig.beforeClose,
      props: {
        formData: formData.value,
        mode: m,
        ref: formRef
      },
      contentRenderer: () => formComponent,
      beforeSure: async done => {
        try {
          await submitForm();
          done();
        } catch {
          // 错误已在 submitForm 中处理
        }
      },
      closeCallBack: () => {
        visible.value = false;
        if (afterClose) {
          afterClose();
        }
      }
    });
  };

  const closeDialog = () => {
    visible.value = false;
    formData.value = { ...defaultFormData };
  };

  const submitForm = async () => {
    if (!formRef.value) {
      logger.warn("formRef is not available");
      return;
    }

    // 验证表单
    const isValid = await formRef.value.validate?.();
    if (!isValid) {
      message("请检查表单数据", { type: "warning" });
      return;
    }

    let data = { ...formData.value } as T;

    // 提交前钩子
    if (beforeSubmit) {
      data = await beforeSubmit(mode.value, data);
    }

    try {
      let result: CommonResult<T>;

      if (mode.value === "create" && submitApi) {
        result = await submitApi(data);
        message("创建成功", { type: "success" });
      } else if (mode.value === "edit" && updateApi) {
        const uid = data.uid;
        if (!uid) {
          message("缺少 ID", { type: "error" });
          return;
        }
        result = await updateApi(uid, data);
        message("更新成功", { type: "success" });
      } else {
        throw new Error("不支持的模式或缺少 API");
      }

      // 提交后钩子
      if (afterSubmit) {
        await afterSubmit(mode.value, result);
      }

      // 刷新列表
      if (refreshCallback) {
        await refreshCallback();
      }

      closeDialog();
    } catch (error) {
      if (onSubmitError) {
        onSubmitError(error);
      } else {
        message("提交失败", { type: "error" });
        logger.error("提交失败", error);
      }
      throw error;
    }
  };

  const setRefreshCallback = (callback: () => Promise<void>) => {
    refreshCallback = callback;
  };

  return {
    openDialog,
    closeDialog,
    visible,
    mode,
    formData,
    submitForm,
    setRefreshCallback
  };
}

/**
 * 创建带页面状态的表单对话框
 *
 * @example
 * ```typescript
 * const { dataList, loading, fetchData } = usePageState({
 *   api: getCustomerListApi
 * });
 *
 * const { openDialog } = useFormDialogWithPageState<Customer>({
 *   formComponent: CustomerForm,
 *   submitApi: addCustomerApi,
 *   updateApi: updateCustomerApi
 * }, fetchData);
 *
 * // 打开对话框，提交后会自动刷新列表
 * openDialog('create');
 * ```
 */
export function useFormDialogWithPageState<
  T extends Record<string, unknown> & { uid?: string } = Record<
    string,
    unknown
  > & { uid?: string }
>(
  formDialogOptions: UseFormDialogOptions<T>,
  refreshFn: () => Promise<void>
): UseFormDialogReturn<T> {
  const formDialog = useFormDialog<T>(formDialogOptions);
  formDialog.setRefreshCallback(refreshFn);
  return formDialog;
}

/**
 * 创建快速对话框（用于简单的确认操作）
 */
export interface QuickDialogOptions {
  /** 标题 */
  title: string;
  /** 内容 */
  content: string;
  /** 确认操作 */
  onConfirm: () => void | Promise<void>;
}

export function useQuickDialog() {
  const openQuickDialog = (options: QuickDialogOptions) => {
    addDialog({
      title: options.title,
      width: "400px",
      showClose: true,
      contentRenderer: () => h("div", options.content),
      beforeSure: async done => {
        try {
          await options.onConfirm();
          done();
        } catch (error) {
          logger.error("快速对话框操作失败", error);
        }
      }
    });
  };

  return {
    openQuickDialog
  };
}

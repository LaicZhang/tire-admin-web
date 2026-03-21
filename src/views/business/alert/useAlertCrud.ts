import { h, ref, type Component } from "vue";
import type { FormInstance } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { addDialog } from "@/composables/useDialogService";
import { useCrud } from "@/composables";
import { message } from "@/utils";
import { PAGE_SIZE_SMALL } from "@/utils/constants";

interface UseAlertCrudOptions<TItem, TResponse, TForm, TSubmit> {
  title: string;
  formComponent: Component;
  defaultForm: () => TForm;
  listApi: (page: number) => Promise<TResponse>;
  createApi: (data: TSubmit) => Promise<unknown>;
  transform: (response: TResponse) => { list: TItem[]; total: number };
  normalizeSubmit?: (form: TForm) => TSubmit;
}

const getFormData = <TForm>(options: unknown) =>
  (options as { props: { formInline: TForm } }).props.formInline;

export function useAlertCrud<TItem, TResponse, TForm, TSubmit = TForm>(
  options: UseAlertCrudOptions<TItem, TResponse, TForm, TSubmit>
) {
  const { loading, dataList, pagination, fetchData, onCurrentChange } = useCrud<
    TItem,
    TResponse,
    { page: number; pageSize: number }
  >({
    api: ({ page }) => options.listApi(page),
    pagination: {
      total: 0,
      pageSize: PAGE_SIZE_SMALL,
      currentPage: 1,
      background: true
    },
    transform: options.transform,
    immediate: true
  });

  const openDialog = (action = "新增") => {
    const dialogFormRef = ref<{ formRef?: FormInstance }>();
    addDialog({
      title: `${action}${options.title}`,
      props: { formInline: options.defaultForm() },
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: ({ options: dialogOptions }) =>
        h(options.formComponent, {
          ref: dialogFormRef,
          formInline: getFormData<TForm>(dialogOptions)
        }),
      beforeSure: async (done, { options: dialogOptions }) => {
        const valid = await dialogFormRef.value?.formRef
          ?.validate()
          .catch(() => false);
        if (!valid) return;
        const formData = getFormData<TForm>(dialogOptions);
        const submitData = options.normalizeSubmit
          ? options.normalizeSubmit(formData)
          : (formData as unknown as TSubmit);
        await options.createApi(submitData);
        message("操作成功", { type: "success" });
        done();
        fetchData();
      }
    });
  };

  return {
    loading,
    dataList,
    pagination,
    fetchData,
    onCurrentChange,
    openDialog
  };
}

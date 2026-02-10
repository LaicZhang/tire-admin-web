import { ref, computed } from "vue";
import { message } from "@/utils";
import { getCustomerListApi } from "@/api/business/customer";
import { getProviderListApi } from "@/api/business/provider";
import { getRepoListApi } from "@/api/company/repo";

import { PAGE_SIZE_SMALL } from "@/utils/constants";
export type SelectType = "customer" | "supplier" | "warehouse";

export type SelectRow = {
  uid: string;
  id?: number;
  code?: string;
  name: string;
  phone?: string;
};

export function useAuthObjectSelector() {
  const selectType = ref<SelectType>("customer");
  const selectKeyword = ref("");
  const selectLoading = ref(false);
  const selectList = ref<SelectRow[]>([]);
  const selectSelectedRows = ref<SelectRow[]>([]);
  const selectPagination = ref({
    total: 0,
    pageSize: PAGE_SIZE_SMALL,
    currentPage: 1,
    background: true
  });

  const selectDialogTitle = computed(() => {
    if (selectType.value === "customer") return "选择客户";
    if (selectType.value === "supplier") return "选择供应商";
    return "选择仓库";
  });

  const selectColumns = computed<TableColumnList>(() => {
    const base: TableColumnList = [
      { type: "selection", width: 50 },
      {
        label: "编码",
        prop: "code",
        minWidth: 120,
        formatter: row => String(row.code ?? row.id ?? row.uid ?? "")
      },
      { label: "名称", prop: "name", minWidth: 180 }
    ];
    if (selectType.value !== "warehouse") {
      base.push({ label: "电话", prop: "phone", minWidth: 120 });
    }
    return base;
  });

  const loadSelectList = async () => {
    selectLoading.value = true;
    try {
      const page = selectPagination.value.currentPage;
      if (selectType.value === "customer") {
        const { code, data, msg } = await getCustomerListApi(page, {
          keyword: selectKeyword.value || undefined
        });
        if (code !== 200) {
          message(msg || "加载客户列表失败", { type: "error" });
          return;
        }
        selectList.value = (data?.list ?? []) as SelectRow[];
        selectPagination.value.total = data?.count ?? data?.total ?? 0;
        return;
      }

      if (selectType.value === "supplier") {
        const { code, data, msg } = await getProviderListApi(page, {
          keyword: selectKeyword.value || undefined
        });
        if (code !== 200) {
          message(msg || "加载供应商列表失败", { type: "error" });
          return;
        }
        selectList.value = (data?.list ?? []) as SelectRow[];
        selectPagination.value.total = data?.count ?? data?.total ?? 0;
        return;
      }

      const { code, data, msg } = await getRepoListApi(page, {
        keyword: selectKeyword.value || undefined
      });
      if (code !== 200) {
        message(msg || "加载仓库列表失败", { type: "error" });
        return;
      }
      selectList.value = (data?.list ?? []) as SelectRow[];
      selectPagination.value.total = data?.count ?? data?.total ?? 0;
    } catch {
      message("加载选择列表失败", { type: "error" });
    } finally {
      selectLoading.value = false;
    }
  };

  const openSelectDialog = async (type: SelectType) => {
    selectType.value = type;
    selectKeyword.value = "";
    selectSelectedRows.value = [];
    selectPagination.value.currentPage = 1;
    await loadSelectList();
  };

  const handleSelectSelectionChange = (rows: SelectRow[]) => {
    selectSelectedRows.value = rows;
  };

  const handleSelectPageChange = (page: number) => {
    selectPagination.value.currentPage = page;
    loadSelectList();
  };

  const handleSelectSearch = () => {
    selectPagination.value.currentPage = 1;
    loadSelectList();
  };

  const handleSelectReset = () => {
    selectKeyword.value = "";
    selectPagination.value.currentPage = 1;
    loadSelectList();
  };

  return {
    selectType,
    selectKeyword,
    selectLoading,
    selectList,
    selectSelectedRows,
    selectPagination,
    selectDialogTitle,
    selectColumns,
    loadSelectList,
    openSelectDialog,
    handleSelectSelectionChange,
    handleSelectPageChange,
    handleSelectSearch,
    handleSelectReset
  };
}

import { ref, reactive, computed, type Ref } from "vue";
import { message } from "@/utils/message";
import { PAGE_SIZE_SMALL } from "../../../../utils/constants";
import {
  getReserveListApi,
  batchStockTakingApi,
  type Reserve
} from "@/api/business/reserve";
import { calculateStockTakingSummary } from "../utils";

interface QuickStockTakingItem {
  repoId?: string;
  tireId: string;
  count: number;
  actualCount: number;
  tire?: Reserve["tire"];
  tireName?: string;
  description?: string;
}

export function useQuickStockTaking(currentRepo: Ref<string | undefined>) {
  const loading = ref(false);
  const tableData = ref<QuickStockTakingItem[]>([]);
  const showResultSummary = ref(false);

  const pagination = ref({
    currentPage: 1,
    pageSize: PAGE_SIZE_SMALL,
    total: 0
  });

  const quickPagination = reactive({
    total: 0,
    pageSize: PAGE_SIZE_SMALL,
    currentPage: 1,
    background: true
  });

  const stockTakingSummary = computed(() => {
    return calculateStockTakingSummary(tableData.value);
  });

  const loadData = async () => {
    if (!currentRepo.value) return;
    loading.value = true;
    showResultSummary.value = false;
    try {
      const { data, code } = await getReserveListApi(
        pagination.value.currentPage,
        {
          limit: pagination.value.pageSize,
          repoId: currentRepo.value
        }
      );
      if (code === 200 && data) {
        const list = Array.isArray(data) ? data : data.list || [];
        pagination.value.total = Array.isArray(data)
          ? data.length
          : data.total || 0;

        tableData.value = (list as Reserve[]).map((item: Reserve) => ({
          ...item,
          actualCount: item.count,
          tireName: item.tire?.name,
          description: ""
        }));
        quickPagination.total = pagination.value.total;
        quickPagination.currentPage = pagination.value.currentPage;
        quickPagination.pageSize = pagination.value.pageSize;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "加载库存数据失败";
      message(msg, { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  const handleSubmit = async () => {
    const itemsWithDifference = tableData.value.filter(
      item => item.actualCount !== item.count
    );

    if (itemsWithDifference.length === 0) {
      message("没有需要调整的库存差异", { type: "info" });
      return;
    }

    const items = itemsWithDifference.map(item => ({
      repoId: item.repoId || currentRepo.value || "",
      tireId: item.tireId,
      actualCount: item.actualCount,
      desc: item.description
    }));

    try {
      await batchStockTakingApi({ items });
      message("盘点提交成功", { type: "success" });
      showResultSummary.value = true;
      loadData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "提交失败";
      message(msg, { type: "error" });
    }
  };

  const handleSizeChange = (val: number) => {
    pagination.value.pageSize = val;
    loadData();
  };

  const handleCurrentChange = (val: number) => {
    pagination.value.currentPage = val;
    loadData();
  };

  return {
    loading,
    tableData,
    showResultSummary,
    pagination,
    quickPagination,
    stockTakingSummary,
    loadData,
    handleSubmit,
    handleSizeChange,
    handleCurrentChange
  };
}

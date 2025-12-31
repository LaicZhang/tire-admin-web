import { ref, reactive, type Ref } from "vue";
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import {
  createInventoryCheckTaskApi,
  getInventoryCheckTasksApi,
  getInventoryCheckTaskApi,
  updateInventoryCheckDetailsApi,
  completeInventoryCheckTaskApi,
  cancelInventoryCheckTaskApi,
  type InventoryCheckTask,
  type InventoryCheckDetail
} from "@/api/business/inventory-check";

export function useStockTakingTasks(currentRepo: Ref<string | undefined>) {
  const router = useRouter();
  const loading = ref(false);
  const taskList = ref<InventoryCheckTask[]>([]);
  const currentTask = ref<InventoryCheckTask | null>(null);
  const showCreateTaskDialog = ref(false);
  const newTaskForm = ref({
    name: "",
    remark: ""
  });

  const taskPagination = reactive({
    currentPage: 1,
    pageSize: 10,
    total: 0,
    background: true
  });

  const loadTaskList = async () => {
    loading.value = true;
    try {
      const { data, code } = await getInventoryCheckTasksApi(
        taskPagination.currentPage,
        { repoId: currentRepo.value }
      );
      if (code === 200) {
        taskList.value = data.list || [];
        taskPagination.total = data.count || 0;
      }
    } catch {
      message("加载盘点任务失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  const handleCreateTask = async () => {
    if (!currentRepo.value) {
      message("请先选择仓库", { type: "warning" });
      return;
    }

    try {
      loading.value = true;
      const { data, code } = await createInventoryCheckTaskApi({
        repoId: currentRepo.value,
        name: newTaskForm.value.name || undefined,
        remark: newTaskForm.value.remark || undefined
      });
      if (code === 200) {
        message("盘点任务创建成功", { type: "success" });
        showCreateTaskDialog.value = false;
        newTaskForm.value = { name: "", remark: "" };
        loadTaskList();
        handleViewTask(data);
      }
    } catch {
      message("创建盘点任务失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  const handleViewTask = async (task: InventoryCheckTask) => {
    loading.value = true;
    try {
      const { data, code } = await getInventoryCheckTaskApi(task.id);
      if (code === 200) {
        currentTask.value = data;
      }
    } catch {
      message("加载任务详情失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  const handleSaveDetails = async () => {
    if (!currentTask.value) return;

    const updates = (currentTask.value.details || [])
      .filter(
        (d: InventoryCheckDetail) =>
          d.actualCount !== null && d.actualCount !== undefined
      )
      .map((d: InventoryCheckDetail) => ({
        detailId: d.id,
        actualCount: d.actualCount ?? 0,
        remark: d.remark
      }));

    if (updates.length === 0) {
      message("请先录入实盘数量", { type: "warning" });
      return;
    }

    try {
      loading.value = true;
      const { data, code } = await updateInventoryCheckDetailsApi(
        currentTask.value.id,
        { details: updates }
      );
      if (code === 200) {
        message("保存成功", { type: "success" });
        currentTask.value = data;
      }
    } catch {
      message("保存失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  const handleCompleteTask = async () => {
    if (!currentTask.value) return;

    try {
      loading.value = true;
      const { data, code } = await completeInventoryCheckTaskApi(
        currentTask.value.id
      );
      if (code === 200) {
        message(
          "盘点完成！" +
            (data.surplusOrderId ? " 已生成盘盈单" : "") +
            (data.wasteOrderId ? " 已生成盘亏单" : ""),
          { type: "success" }
        );
        currentTask.value = data.task;
        loadTaskList();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "完成盘点失败";
      message(errorMessage, { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  const handleCancelTask = async () => {
    if (!currentTask.value) return;

    try {
      loading.value = true;
      const { code } = await cancelInventoryCheckTaskApi(currentTask.value.id);
      if (code === 200) {
        message("盘点任务已取消", { type: "success" });
        currentTask.value = null;
        loadTaskList();
      }
    } catch {
      message("取消失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  const handleBackToList = () => {
    currentTask.value = null;
  };

  const handleCreateSurplusOrder = () => {
    if (!currentTask.value) return;
    const surplusItems = (currentTask.value.details || []).filter(
      (item: InventoryCheckDetail) => (item.actualCount ?? 0) > item.bookCount
    );
    if (surplusItems.length === 0) {
      message("没有盘盈商品", { type: "warning" });
      return;
    }
    sessionStorage.setItem(
      "stockTakingSurplus",
      JSON.stringify(
        surplusItems.map((item: InventoryCheckDetail) => ({
          repoId: item.repoId || currentRepo.value,
          tireId: item.tireId,
          tireName: item.tire?.name || item.tireName,
          count: (item.actualCount ?? 0) - item.bookCount
        }))
      )
    );
    router.push("/business/surplus");
  };

  const handleCreateWasteOrder = () => {
    if (!currentTask.value) return;
    const wasteItems = (currentTask.value.details || []).filter(
      (item: InventoryCheckDetail) => (item.actualCount ?? 0) < item.bookCount
    );
    if (wasteItems.length === 0) {
      message("没有盘亏商品", { type: "warning" });
      return;
    }
    sessionStorage.setItem(
      "stockTakingWaste",
      JSON.stringify(
        wasteItems.map((item: InventoryCheckDetail) => ({
          repoId: item.repoId || currentRepo.value,
          tireId: item.tireId,
          tireName: item.tire?.name || item.tireName,
          count: item.bookCount - (item.actualCount ?? 0)
        }))
      )
    );
    router.push("/business/waste");
  };

  return {
    loading,
    taskList,
    currentTask,
    showCreateTaskDialog,
    newTaskForm,
    taskPagination,
    loadTaskList,
    handleCreateTask,
    handleViewTask,
    handleSaveDetails,
    handleCompleteTask,
    handleCancelTask,
    handleBackToList,
    handleCreateSurplusOrder,
    handleCreateWasteOrder
  };
}

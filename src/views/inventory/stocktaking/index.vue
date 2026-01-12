<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import View from "~icons/ep/view";
import Delete from "~icons/ep/delete";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { columns, detailColumns } from "./columns";
import editForm from "./form.vue";
import {
  type StocktakingTask,
  type StocktakingQuery,
  type StocktakingDetail,
  StocktakingStatus,
  stocktakingStatusMap
} from "./types";
import {
  getInventoryCheckTasksApi,
  getInventoryCheckTaskApi,
  createInventoryCheckTaskApi,
  updateInventoryCheckDetailsApi,
  completeInventoryCheckTaskApi,
  cancelInventoryCheckTaskApi,
  deleteInventoryCheckTaskApi
} from "@/api/business/inventory-check";
import { getRepoListApi } from "@/api/company/repo";

defineOptions({
  name: "InventoryStocktaking"
});

const dataList = ref<StocktakingTask[]>([]);
const loading = ref(false);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const editFormRef = ref();
const repoList = ref<{ uid: string; name: string }[]>([]);
const detailDialogVisible = ref(false);
const currentTask = ref<StocktakingTask | null>(null);
const detailList = ref<StocktakingDetail[]>([]);
const detailLoading = ref(false);

const queryParams = reactive<StocktakingQuery>({
  status: undefined,
  repoId: ""
});

const pagination = ref({
  total: 0,
  pageSize: 15,
  currentPage: 1,
  background: true
});

const statusOptions = Object.entries(stocktakingStatusMap).map(
  ([value, config]) => ({
    value,
    label: config.label
  })
);

const fetchData = async () => {
  loading.value = true;
  try {
    const { data, code } = await getInventoryCheckTasksApi(
      pagination.value.currentPage,
      {
        status: queryParams.status || undefined,
        repoId: queryParams.repoId || undefined
      }
    );
    if (code === 200) {
      dataList.value = data.list as StocktakingTask[];
      pagination.value.total = data.count;
    }
  } catch (error) {
    console.error("获取盘点单列表失败", error);
  } finally {
    loading.value = false;
  }
};

const loadRepos = async () => {
  try {
    const { data, code } = await getRepoListApi(1, {});
    if (code === 200) {
      repoList.value = data.list;
    }
  } catch (error) {
    console.error("获取仓库列表失败", error);
  }
};

const handleSearch = () => {
  pagination.value.currentPage = 1;
  fetchData();
};

const onReset = () => {
  searchFormRef.value?.resetFields();
  queryParams.status = undefined;
  queryParams.repoId = "";
  handleSearch();
};

const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page;
  fetchData();
};

const openCreateDialog = () => {
  addDialog({
    title: "创建盘点单",
    props: {
      formInline: {},
      isView: false
    },
    width: "50%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () => h(editForm, { ref: editFormRef }),
    beforeSure: async done => {
      const formInstance = editFormRef.value?.getRef();
      if (!formInstance) return;

      await formInstance.validate(async (valid: boolean) => {
        if (valid) {
          try {
            const formData = editFormRef.value?.getFormData();
            await createInventoryCheckTaskApi(formData);
            ElMessage.success("创建成功");
            done();
            fetchData();
          } catch (error) {
            ElMessage.error("创建失败");
          }
        }
      });
    }
  });
};

const handleViewDetails = async (row: StocktakingTask) => {
  currentTask.value = row;
  detailDialogVisible.value = true;
  detailLoading.value = true;
  try {
    const { data, code } = await getInventoryCheckTaskApi(row.id);
    if (code === 200) {
      detailList.value = (data.details || []) as StocktakingDetail[];
    }
  } catch (error) {
    ElMessage.error("获取盘点明细失败");
  } finally {
    detailLoading.value = false;
  }
};

const handleUpdateDetail = async (detail: StocktakingDetail) => {
  if (!currentTask.value) return;

  try {
    const { value } = await ElMessageBox.prompt(
      `当前系统库存: ${detail.bookCount}`,
      "录入实际库存",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValue: String(detail.actualCount || detail.bookCount),
        inputPattern: /^\d+$/,
        inputErrorMessage: "请输入有效数量"
      }
    );

    await updateInventoryCheckDetailsApi(currentTask.value.id, {
      details: [
        {
          detailId: detail.id,
          actualCount: parseInt(value),
          remark: detail.remark
        }
      ]
    });

    ElMessage.success("更新成功");
    handleViewDetails(currentTask.value);
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("更新失败");
    }
  }
};

const handleComplete = async (row: StocktakingTask) => {
  try {
    await ElMessageBox.confirm(
      "完成盘点后将根据盘点结果生成盘盈/盘亏单据。确认完成?",
      "确认完成",
      { type: "warning" }
    );
    const { data, code } = await completeInventoryCheckTaskApi(row.id);
    if (code === 200) {
      let msg = "盘点完成";
      if (data.surplusOrderId) msg += `，已生成盘盈单`;
      if (data.wasteOrderId) msg += `，已生成盘亏单`;
      ElMessage.success(msg);
      fetchData();
    }
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("操作失败");
    }
  }
};

const handleCancel = async (row: StocktakingTask) => {
  try {
    await ElMessageBox.confirm("确认取消该盘点任务?", "确认取消", {
      type: "warning"
    });
    await cancelInventoryCheckTaskApi(row.id);
    ElMessage.success("已取消");
    fetchData();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("操作失败");
    }
  }
};

const handleDelete = async (row: StocktakingTask) => {
  try {
    await ElMessageBox.confirm("确认删除该盘点单?", "确认删除", {
      type: "warning"
    });
    await deleteInventoryCheckTaskApi(row.id);
    ElMessage.success("删除成功");
    fetchData();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

onMounted(() => {
  Promise.all([fetchData(), loadRepos()]);
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      :form="queryParams"
      :loading="loading"
      @search="handleSearch"
      @reset="onReset"
    >
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择状态"
          clearable
          class="w-[150px]"
        >
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="仓库" prop="repoId">
        <el-select
          v-model="queryParams.repoId"
          placeholder="请选择仓库"
          clearable
          class="w-[150px]"
        >
          <el-option
            v-for="repo in repoList"
            :key="repo.uid"
            :label="repo.name"
            :value="repo.uid"
          />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <el-card>
      <PureTableBar title="盘点单列表" @refresh="fetchData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openCreateDialog"
          >
            创建盘点单
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="id"
            adaptive
            :size="size"
            :columns="columns"
            border
            :data="dataList"
            :loading="loading"
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handleCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                link
                type="primary"
                :icon="useRenderIcon(View)"
                @click="handleViewDetails(row)"
              >
                录入/查看
              </el-button>
              <el-button
                v-if="row.status === 'IN_PROGRESS'"
                link
                type="success"
                @click="handleComplete(row)"
              >
                完成盘点
              </el-button>
              <el-button
                v-if="row.status === 'IN_PROGRESS'"
                link
                type="warning"
                @click="handleCancel(row)"
              >
                取消
              </el-button>
              <el-button
                v-if="row.status !== 'IN_PROGRESS'"
                link
                type="danger"
                :icon="useRenderIcon(Delete)"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>

    <!-- 盘点明细弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`盘点明细 - ${currentTask?.name || ''}`"
      width="80%"
      destroy-on-close
    >
      <pure-table
        border
        :loading="detailLoading"
        :data="detailList"
        :columns="
          currentTask?.status === 'IN_PROGRESS'
            ? detailColumns
            : detailColumns.filter(col => col.slot !== 'operation')
        "
        max-height="500"
      >
        <template #actualCount="{ row }">
          <span v-if="row.actualCount !== undefined">{{
            row.actualCount
          }}</span>
          <span v-else class="text-gray-400">未录入</span>
        </template>
        <template #difference="{ row }">
          <span
            v-if="row.difference !== undefined"
            :class="
              row.difference > 0
                ? 'text-green-600'
                : row.difference < 0
                  ? 'text-red-600'
                  : ''
            "
          >
            {{ row.difference > 0 ? "+" : "" }}{{ row.difference }}
          </span>
          <span v-else>-</span>
        </template>
        <template #operation="{ row }">
          <el-button link type="primary" @click="handleUpdateDetail(row)">
            录入
          </el-button>
        </template>
      </pure-table>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.main {
  padding: 16px;
}

.text-gray-400 {
  color: #9ca3af;
}

.text-green-600 {
  color: #16a34a;
}

.text-red-600 {
  color: #dc2626;
}
</style>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import View from "~icons/ep/view";
import Delete from "~icons/ep/delete";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import { columns } from "./columns";
import editForm from "./form.vue";
import StocktakingDetailForm from "./StocktakingDetailForm.vue";
import {
  type StocktakingTask,
  type CreateStocktakingDto,
  type StocktakingQuery,
  StocktakingStatus,
  stocktakingStatusMap
} from "./types";
import {
  getInventoryCheckTasksApi,
  createInventoryCheckTaskApi,
  completeInventoryCheckTaskApi,
  cancelInventoryCheckTaskApi,
  deleteInventoryCheckTaskApi
} from "@/api/business/inventory-check";
import { getRepoListApi } from "@/api/company/repo";
import { handleApiError } from "@/utils";

defineOptions({
  name: "InventoryStocktaking"
});

const dataList = ref<StocktakingTask[]>([]);
const loading = ref(false);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const { confirm } = useConfirmDialog();
const editFormRef = ref<{
  getRef: () => FormInstance | undefined;
  getFormData: () => CreateStocktakingDto;
} | null>(null);
const detailFormRef = ref<{
  loadDetails: () => void;
} | null>(null);
const repoList = ref<{ uid: string; name: string }[]>([]);

const queryParams = reactive<StocktakingQuery>({
  status: undefined,
  repoId: undefined
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
    handleApiError(error, "获取盘点单列表失败");
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
    handleApiError(error, "获取仓库列表失败");
  }
};

const handleSearch = () => {
  pagination.value.currentPage = 1;
  fetchData();
};

const onReset = () => {
  searchFormRef.value?.resetFields();
  queryParams.status = undefined;
  queryParams.repoId = undefined;
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
    contentRenderer: ({ options }) =>
      h(editForm, {
        ref: editFormRef,
        formInline: (options.props as { formInline: Partial<StocktakingTask> })
          .formInline,
        isView: (options.props as { isView?: boolean }).isView,
        isEdit: (options.props as { isEdit?: boolean }).isEdit
      }),
    beforeSure: async done => {
      const formRef = editFormRef.value;
      if (!formRef) return;
      const formInstance = formRef.getRef();
      if (!formInstance) return;

      await formInstance.validate(async (valid: boolean) => {
        if (valid) {
          try {
            const formData = formRef.getFormData();
            await createInventoryCheckTaskApi(formData);
            ElMessage.success("创建成功");
            done();
            fetchData();
          } catch (error) {
            handleApiError(error, "创建失败");
          }
        }
      });
    }
  });
};

const handleViewDetails = (row: StocktakingTask) => {
  addDialog({
    title: `盘点明细 - ${row.name || ""}`,
    props: {
      formInline: {
        task: row
      }
    },
    width: "80%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: true,
    hideFooter: true,
    contentRenderer: ({ options }) =>
      h(StocktakingDetailForm, {
        ref: detailFormRef,
        formInline: (
          options.props as { formInline: { task: StocktakingTask | null } }
        ).formInline
      })
  });
};

const handleComplete = async (row: StocktakingTask) => {
  const ok = await confirm(
    "完成盘点后将根据盘点结果生成盘盈/盘亏单据。确认完成?",
    "确认完成"
  );
  if (!ok) return;

  try {
    const { data, code } = await completeInventoryCheckTaskApi(row.id);
    if (code === 200) {
      let msg = "盘点完成";
      if (data.surplusOrderId) msg += `，已生成盘盈单`;
      if (data.wasteOrderId) msg += `，已生成盘亏单`;
      ElMessage.success(msg);
      fetchData();
    }
  } catch (error) {
    handleApiError(error, "操作失败");
  }
};

const handleCancel = async (row: StocktakingTask) => {
  const ok = await confirm("确认取消该盘点任务?", "确认取消");
  if (!ok) return;

  try {
    await cancelInventoryCheckTaskApi(row.id);
    ElMessage.success("已取消");
    fetchData();
  } catch (error) {
    handleApiError(error, "操作失败");
  }
};

const handleDelete = async (row: StocktakingTask) => {
  const ok = await confirm("确认删除该盘点单?", "确认删除");
  if (!ok) return;

  try {
    await deleteInventoryCheckTaskApi(row.id);
    ElMessage.success("删除成功");
    fetchData();
  } catch (error) {
    handleApiError(error, "删除失败");
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
  </div>
</template>

<style scoped lang="scss">
.main {
  padding: 16px;
}
</style>

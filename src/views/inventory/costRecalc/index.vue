<script setup lang="ts">
import { PAGE_SIZE_MEDIUM } from "../../../utils/constants";
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
import {
  type CostRecalcTask,
  type CreateRecalcTaskDto,
  type RecalcTaskQuery,
  RecalcStatus,
  recalcStatusMap
} from "./types";
import {
  cancelCostRecalcTaskApi,
  createCostRecalcTaskApi,
  deleteCostRecalcTaskApi,
  getCostRecalcTaskListApi,
  restoreCostRecalcTaskApi
} from "@/api/inventory";
import { handleApiError } from "@/utils";

defineOptions({
  name: "InventoryCostRecalc"
});

const { confirm } = useConfirmDialog();

const dataList = ref<CostRecalcTask[]>([]);
const loading = ref(false);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const editFormRef = ref<{
  getRef: () => FormInstance | undefined;
  getFormData: () => CreateRecalcTaskDto;
} | null>(null);

const queryParams = reactive<RecalcTaskQuery>({
  status: undefined
});

const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_MEDIUM,
  currentPage: 1,
  background: true
});

const statusOptions = Object.entries(recalcStatusMap).map(
  ([value, config]) => ({
    value,
    label: config.label
  })
);

const fetchData = async () => {
  loading.value = true;
  try {
    const { data, code } = await getCostRecalcTaskListApi(
      pagination.value.currentPage,
      {
        status: queryParams.status || undefined
      }
    );
    if (code === 200) {
      dataList.value = data.list;
      pagination.value.total = data.count;
    }
  } catch (error) {
    handleApiError(error, "获取成本重算任务列表失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.value.currentPage = 1;
  fetchData();
};

const onReset = () => {
  searchFormRef.value?.resetFields();
  queryParams.status = undefined;
  handleSearch();
};

const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page;
  fetchData();
};

const openCreateDialog = () => {
  addDialog({
    title: "创建成本重算任务",
    props: {
      formInline: {}
    },
    width: "50%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(editForm, {
        ref: editFormRef,
        formInline: (
          options.props as { formInline: Partial<CreateRecalcTaskDto> }
        ).formInline
      }),
    beforeSure: async done => {
      const formRef = editFormRef.value;
      if (!formRef) return;
      const formInstance = formRef.getRef();
      if (!formInstance) return;

      await formInstance.validate(async (valid: boolean) => {
        if (valid) {
          const ok = await confirm(
            "成本重算将重新计算指定期间的成本,此操作不可撤销。系统将自动备份当前数据。确认执行?",
            "确认重算"
          );
          if (!ok) return;

          try {
            const formData = formRef.getFormData();
            await createCostRecalcTaskApi(formData);
            ElMessage.success("任务创建成功,正在后台执行");
            done();
            fetchData();
          } catch (error) {
            handleApiError(error, "操作失败");
          }
        }
      });
    }
  });
};

const handleViewDetail = (row: CostRecalcTask) => {
  ElMessage.info("查看详情功能开发中");
};

const handleCancel = async (row: CostRecalcTask) => {
  const ok = await confirm("确认取消该重算任务?", "确认取消");
  if (!ok) return;

  try {
    await cancelCostRecalcTaskApi(row.uid);
    ElMessage.success("已取消");
    fetchData();
  } catch (error) {
    handleApiError(error, "操作失败");
  }
};

const handleRestore = async (row: CostRecalcTask) => {
  if (!row.backupId) {
    ElMessage.warning("该任务没有备份数据");
    return;
  }
  const ok = await confirm(
    "确认恢复到重算前的数据?此操作将覆盖当前成本数据。",
    "确认恢复"
  );
  if (!ok) return;

  try {
    await restoreCostRecalcTaskApi(row.uid);
    ElMessage.success("恢复成功");
    fetchData();
  } catch (error) {
    handleApiError(error, "操作失败");
  }
};

const handleDelete = async (row: CostRecalcTask) => {
  const ok = await confirm("确认删除该重算记录?", "确认删除");
  if (!ok) return;

  try {
    await deleteCostRecalcTaskApi(row.uid);
    ElMessage.success("删除成功");
    fetchData();
  } catch (error) {
    handleApiError(error, "删除失败");
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="main">
    <!-- 注意事项提示 -->
    <el-alert title="成本重算说明" type="info" :closable="false" class="mb-4">
      成本重算适用于因做单顺序、参数设置等导致成本错误或对计算后成本存在疑问时,
      对商品的成本进行重新计算。重算前系统会自动备份数据,可在需要时恢复。
    </el-alert>

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
          class="w-[120px]"
        >
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <el-card>
      <PureTableBar title="成本重算任务列表" @refresh="fetchData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openCreateDialog"
          >
            创建重算任务
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
                @click="handleViewDetail(row)"
              >
                详情
              </el-button>
              <el-button
                v-if="row.status === 'pending' || row.status === 'processing'"
                link
                type="warning"
                @click="handleCancel(row)"
              >
                取消
              </el-button>
              <el-button
                v-if="row.status === 'completed' && row.backupId"
                link
                type="warning"
                @click="handleRestore(row)"
              >
                恢复
              </el-button>
              <el-button
                v-if="row.status !== 'processing'"
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

<script setup lang="ts">
import { PAGE_SIZE_MEDIUM } from "../../../utils/constants";
import { ref, reactive, onMounted, h } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import View from "~icons/ep/view";
import Delete from "~icons/ep/delete";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { columns } from "./columns";
import editForm from "./form.vue";
import type {
  CostAdjustOrder,
  CostAdjustQuery,
  CreateCostAdjustOrderDto
} from "./types";
import {
  getCostAdjustOrderList,
  createCostAdjustOrder,
  approveCostAdjustOrder,
  rejectCostAdjustOrder,
  deleteCostAdjustOrder
} from "@/api/business/costAdjust";
import { handleApiError } from "@/utils";
import { useConfirmDialog } from "@/composables/useConfirmDialog";

defineOptions({
  name: "InventoryCostAdjust"
});

const dataList = ref<CostAdjustOrder[]>([]);
const loading = ref(false);
const { confirm } = useConfirmDialog();
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const editFormRef = ref<{
  getRef: () => FormInstance | undefined;
  getFormData: () => CreateCostAdjustOrderDto;
} | null>(null);

const queryParams = reactive<CostAdjustQuery>({
  isApproved: "all"
});

const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_MEDIUM,
  currentPage: 1,
  background: true
});

const approvalOptions = [
  { label: "全部", value: "all" },
  { label: "待审核", value: false },
  { label: "已审核", value: true }
];

const fetchData = async () => {
  loading.value = true;
  try {
    const data = await getCostAdjustOrderList({
      index: pagination.value.currentPage,
      isApproved:
        queryParams.isApproved === "all"
          ? undefined
          : (queryParams.isApproved as boolean)
    });
    dataList.value = data.list;
    pagination.value.total = data.count;
  } catch (error) {
    handleApiError(error, "获取成本调整单列表失败");
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
  queryParams.isApproved = "all";
  handleSearch();
};

const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page;
  fetchData();
};

const openDialog = (
  title: string,
  row?: CostAdjustOrder,
  isView: boolean = false
) => {
  addDialog({
    title,
    props: {
      formInline: row || {},
      isView
    },
    width: "70%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(editForm, {
        ref: editFormRef,
        formInline: (options.props as { formInline: CreateCostAdjustOrderDto })
          .formInline,
        isView: (options.props as { isView?: boolean }).isView
      }),
    beforeSure: async done => {
      if (isView) {
        done();
        return;
      }
      const formRef = editFormRef.value;
      if (!formRef) return;
      const formInstance = formRef.getRef();
      if (!formInstance) return;

      await formInstance.validate(async (valid: boolean) => {
        if (valid) {
          try {
            const formData = formRef.getFormData();
            await createCostAdjustOrder(formData);
            ElMessage.success("创建成功");
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

const handleView = (row: CostAdjustOrder) => {
  openDialog("查看成本调整单", row, true);
};

const handleDelete = async (row: CostAdjustOrder) => {
  const ok = await confirm("确认删除该成本调整单?", "确认删除", {
    type: "warning"
  });
  if (!ok) return;

  try {
    await deleteCostAdjustOrder(row.id);
    ElMessage.success("删除成功");
    fetchData();
  } catch (error) {
    handleApiError(error, "删除失败");
  }
};

const handleApprove = async (row: CostAdjustOrder) => {
  const ok = await confirm(
    `确认审核成本调整单 #${row.number}?审核后将更新相关商品的库存成本。`,
    "确认审核",
    { type: "warning" }
  );
  if (!ok) return;

  try {
    await approveCostAdjustOrder(row.id);
    ElMessage.success("审核成功");
    fetchData();
  } catch (error) {
    handleApiError(error, "审核失败");
  }
};

const handleReject = async (row: CostAdjustOrder) => {
  try {
    const res = await ElMessageBox.prompt("请输入拒绝原因", "拒绝审核", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /.+/,
      inputErrorMessage: "请输入拒绝原因"
    });
    if (typeof res === "string") return;
    const { value } = res;
    await rejectCostAdjustOrder(row.id, value);
    ElMessage.success("已拒绝");
    fetchData();
  } catch (error) {
    if (error !== "cancel") {
      handleApiError(error, "操作失败");
    }
  }
};

onMounted(() => {
  fetchData();
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
      <el-form-item label="审核状态">
        <el-select
          v-model="queryParams.isApproved"
          placeholder="请选择"
          clearable
          class="w-[120px]"
        >
          <el-option
            v-for="item in approvalOptions"
            :key="String(item.value)"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <el-card>
      <PureTableBar title="成本调整单列表" @refresh="fetchData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新增成本调整单')"
          >
            新增调整单
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
                @click="handleView(row)"
              >
                查看
              </el-button>
              <el-button
                v-if="!row.isApproved && !row.isLocked"
                link
                type="success"
                @click="handleApprove(row)"
              >
                审核
              </el-button>
              <el-button
                v-if="!row.isApproved && !row.isLocked"
                link
                type="warning"
                @click="handleReject(row)"
              >
                拒绝
              </el-button>
              <el-button
                v-if="!row.isApproved"
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

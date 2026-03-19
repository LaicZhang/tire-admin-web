<script setup lang="ts">
import { PAGE_SIZE_MEDIUM } from "@/utils/constants";
import { ref, reactive, onMounted } from "vue";
import { ElMessageBox } from "element-plus";
import type { FormInstance } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import View from "~icons/ep/view";
import Delete from "~icons/ep/delete";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { columns } from "./columns";
import editForm from "./form.vue";
import {
  type OtherOutboundOrder,
  type OtherOutboundQuery,
  type CreateOtherOutboundDto,
  OtherOutboundStatus,
  OtherOutboundType,
  otherOutboundStatusMap,
  otherOutboundTypeMap
} from "./types";
import {
  approveOtherOutboundOrderApi,
  createOtherOutboundOrderApi,
  deleteOtherOutboundOrderApi,
  getOtherOutboundOrderListApi,
  rejectOtherOutboundOrderApi,
  updateOtherOutboundOrderApi
} from "@/api/inventory";
import { handleApiError, message } from "@/utils";
import { useCrud } from "@/composables";
import { useActionFormDialog } from "@/composables/useActionFormDialog";
import { useConfirmDialog } from "@/composables/useConfirmDialog";

defineOptions({
  name: "InventoryOtherOutbound"
});

const { confirm } = useConfirmDialog();
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const editFormRef = ref<{
  formRef?: FormInstance;
  getFormData: () => CreateOtherOutboundDto;
} | null>(null);

const queryParams = reactive<OtherOutboundQuery>({
  type: undefined,
  status: undefined,
  keyword: undefined
});

const { loading, dataList, pagination, fetchData, onCurrentChange } = useCrud<
  OtherOutboundOrder,
  Awaited<ReturnType<typeof getOtherOutboundOrderListApi>>,
  { page: number; pageSize: number }
>({
  api: ({ page }) =>
    getOtherOutboundOrderListApi(page, {
      ...queryParams,
      type: queryParams.type || undefined,
      status: queryParams.status || undefined
    }),
  pagination: {
    total: 0,
    pageSize: PAGE_SIZE_MEDIUM,
    currentPage: 1,
    background: true
  },
  immediate: true,
  transform: res => {
    if (res.code !== 200) {
      message(res.msg || "获取其他出库单列表失败", { type: "error" });
      return { list: [], total: 0 };
    }
    return {
      list: res.data?.list ?? [],
      total: res.data?.total ?? 0
    };
  }
});

const statusOptions = Object.entries(otherOutboundStatusMap).map(
  ([value, config]) => ({
    value,
    label: config.label
  })
);

const typeOptions = Object.entries(otherOutboundTypeMap).map(
  ([value, config]) => ({
    value,
    label: config.label
  })
);

const handleSearch = () => {
  pagination.value.currentPage = 1;
  fetchData();
};

const onReset = () => {
  searchFormRef.value?.resetFields();
  queryParams.type = undefined;
  queryParams.status = undefined;
  queryParams.keyword = "";
  handleSearch();
};

const { openDialog } = useActionFormDialog<
  Partial<OtherOutboundOrder>,
  {
    formRef?: FormInstance;
    getFormData: () => CreateOtherOutboundDto;
  }
>({
  entityName: "其他出库单",
  formComponent: editForm,
  formRef: editFormRef,
  dialogWidth: "70%",
  buildFormData: (row?: Partial<OtherOutboundOrder>) =>
    row
      ? { ...row }
      : {
          type: OtherOutboundType.OTHER_OUTBOUND,
          status: OtherOutboundStatus.DRAFT,
          details: []
        },
  buildFormProps: (formInline, action) => ({
    formInline,
    isView: action === "查看"
  }),
  handlers: {
    新增: async () => {
      const formData = editFormRef.value?.getFormData();
      if (!formData) return false;
      await createOtherOutboundOrderApi(formData);
      message("创建成功", { type: "success" });
    },
    修改: async formInline => {
      const formData = editFormRef.value?.getFormData();
      if (!formData) return false;
      if (!formInline.uid) {
        message("缺少出库单ID，无法更新", { type: "error" });
        return false;
      }
      await updateOtherOutboundOrderApi(formInline.uid, formData);
      message("更新成功", { type: "success" });
    }
  },
  afterSuccess: fetchData
});

const handleView = (row: OtherOutboundOrder) => {
  openDialog("查看", row);
};

const handleEdit = (row: OtherOutboundOrder) => {
  openDialog("修改", row);
};

const handleDelete = async (row: OtherOutboundOrder) => {
  const ok = await confirm("确认删除该出库单?", "确认删除", {
    type: "warning"
  });
  if (!ok) return;

  try {
    await deleteOtherOutboundOrderApi(row.uid);
    message("删除成功", { type: "success" });
    fetchData();
  } catch (error) {
    handleApiError(error, "删除失败");
  }
};

const handleApprove = async (row: OtherOutboundOrder) => {
  const ok = await confirm(
    "审核后将减少对应仓库的库存数量和成本。确认审核?",
    "确认审核",
    { type: "warning" }
  );
  if (!ok) return;

  try {
    await approveOtherOutboundOrderApi(row.uid);
    message("审核成功", { type: "success" });
    fetchData();
  } catch (error) {
    handleApiError(error, "审核失败");
  }
};

const handleReject = async (row: OtherOutboundOrder) => {
  try {
    const res = await ElMessageBox.prompt("请输入拒绝原因", "拒绝审核", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /.+/,
      inputErrorMessage: "请输入拒绝原因"
    });
    if (typeof res === "string") return;
    const { value } = res;
    await rejectOtherOutboundOrderApi(row.uid, value);
    message("已拒绝", { type: "success" });
    fetchData();
  } catch (error) {
    if (error !== "cancel") {
      handleApiError(error, "操作失败");
    }
  }
};
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
      <el-form-item label="业务类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择类型"
          clearable
          class="w-[130px]"
        >
          <el-option
            v-for="item in typeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
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
      <el-form-item label="关键字" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          placeholder="单据编号/备注"
          clearable
          class="w-[180px]"
        />
      </el-form-item>
    </ReSearchForm>

    <el-card>
      <PureTableBar title="其他出库单列表" @refresh="fetchData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新增')"
          >
            新增出库单
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
            @page-current-change="onCurrentChange"
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
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="row.status === 'pending'"
                link
                type="success"
                @click="handleApprove(row)"
              >
                审核
              </el-button>
              <el-button
                v-if="row.status === 'pending'"
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

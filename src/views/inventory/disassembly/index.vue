<script setup lang="ts">
import { PAGE_SIZE_MEDIUM } from "@/utils/constants";
import { ref, reactive, onMounted, h } from "vue";
import { ElMessageBox } from "element-plus";
import type { FormInstance } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
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
  type DisassemblyOrder,
  type CreateDisassemblyOrderDto,
  type DisassemblyOrderQuery,
  DisassemblyOrderStatus,
  disassemblyOrderStatusMap
} from "./types";
import {
  approveDisassemblyOrderApi,
  createDisassemblyOrderApi,
  deleteDisassemblyOrderApi,
  getDisassemblyOrderListApi,
  rejectDisassemblyOrderApi,
  saveDisassemblyOrderAsBomApi,
  updateDisassemblyOrderApi
} from "@/api/inventory";
import { handleApiError, message } from "@/utils";

defineOptions({
  name: "InventoryDisassembly"
});

const dataList = ref<DisassemblyOrder[]>([]);
const loading = ref(false);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const editFormRef = ref<{
  getRef: () => FormInstance | undefined;
  getFormData: () => CreateDisassemblyOrderDto;
} | null>(null);
const { confirm } = useConfirmDialog();

const queryParams = reactive<DisassemblyOrderQuery>({
  status: undefined,
  keyword: ""
});

const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_MEDIUM,
  currentPage: 1,
  background: true
});

const statusOptions = Object.entries(disassemblyOrderStatusMap).map(
  ([value, config]) => ({
    value,
    label: config.label
  })
);

const fetchData = async () => {
  loading.value = true;
  try {
    const { data, code } = await getDisassemblyOrderListApi(
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
    handleApiError(error, "获取拆卸单列表失败");
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
  queryParams.keyword = "";
  handleSearch();
};

const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page;
  fetchData();
};

const openDialog = (
  title: string,
  row?: DisassemblyOrder,
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
        formInline: (options.props as { formInline: Partial<DisassemblyOrder> })
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
            if (row?.uid) {
              await updateDisassemblyOrderApi(row.uid, formData);
              message("更新成功", { type: "success" });
            } else {
              await createDisassemblyOrderApi(formData);
              message("创建成功", { type: "success" });
            }
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

const handleView = (row: DisassemblyOrder) => {
  openDialog("查看拆卸单", row, true);
};

const handleEdit = (row: DisassemblyOrder) => {
  openDialog("编辑拆卸单", row, false);
};

const handleDelete = async (row: DisassemblyOrder) => {
  const ok = await confirm("确认删除该拆卸单?", "确认删除");
  if (!ok) return;

  try {
    await deleteDisassemblyOrderApi(row.uid);
    message("删除成功", { type: "success" });
    fetchData();
  } catch (error) {
    handleApiError(error, "删除失败");
  }
};

const handleApprove = async (row: DisassemblyOrder) => {
  const ok = await confirm(
    "审核后将执行拆卸操作:组合件出库,部件入库。确认审核?",
    "确认审核"
  );
  if (!ok) return;

  try {
    await approveDisassemblyOrderApi(row.uid);
    message("审核成功", { type: "success" });
    fetchData();
  } catch (error) {
    handleApiError(error, "审核失败");
  }
};

const handleReject = async (row: DisassemblyOrder) => {
  try {
    const res = await ElMessageBox.prompt("请输入拒绝原因", "拒绝审核", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /.+/,
      inputErrorMessage: "请输入拒绝原因"
    });
    if (typeof res === "string") return;
    const { value } = res;
    await rejectDisassemblyOrderApi(row.uid, value);
    message("已拒绝", { type: "success" });
    fetchData();
  } catch (error) {
    if (error !== "cancel") {
      handleApiError(error, "操作失败");
    }
  }
};

const handleSaveAsBom = async (row: DisassemblyOrder) => {
  const ok = await confirm("确认将该拆卸单保存为BOM模板?", "存为模板", {
    type: "info"
  });
  if (!ok) return;

  try {
    await saveDisassemblyOrderAsBomApi(row.uid);
    message("已保存为BOM模板", { type: "success" });
  } catch (error) {
    handleApiError(error, "操作失败");
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
          placeholder="单据编号"
          clearable
          class="w-[180px]"
        />
      </el-form-item>
    </ReSearchForm>

    <el-card>
      <PureTableBar title="拆卸单列表" @refresh="fetchData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新增拆卸单')"
          >
            新增拆卸单
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
                v-if="row.isApproved"
                link
                type="primary"
                @click="handleSaveAsBom(row)"
              >
                存为模板
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

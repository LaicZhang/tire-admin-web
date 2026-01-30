<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import View from "~icons/ep/view";
import Delete from "~icons/ep/delete";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { columns } from "./columns";
import editForm from "./form.vue";
import {
  type AssemblyOrder,
  type AssemblyOrderQuery,
  AssemblyOrderStatus,
  assemblyOrderStatusMap
} from "./types";
import {
  getAssemblyOrderListApi,
  addAssemblyOrderApi,
  updateAssemblyOrderApi,
  deleteAssemblyOrderApi
} from "@/api/business/assembly";
import { http } from "@/utils/http";
import { handleApiError } from "@/utils";

defineOptions({
  name: "InventoryAssembly"
});

const dataList = ref<AssemblyOrder[]>([]);
const loading = ref(false);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const editFormRef = ref();

const queryParams = reactive<AssemblyOrderQuery>({
  status: undefined,
  keyword: ""
});

const pagination = ref({
  total: 0,
  pageSize: 15,
  currentPage: 1,
  background: true
});

const statusOptions = Object.entries(assemblyOrderStatusMap).map(
  ([value, config]) => ({
    value,
    label: config.label
  })
);

const fetchData = async () => {
  loading.value = true;
  try {
    const { data, code } = await getAssemblyOrderListApi(
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
    handleApiError(error, "获取组装单列表失败");
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
  row?: AssemblyOrder,
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
    contentRenderer: () => h(editForm, { ref: editFormRef }),
    beforeSure: async done => {
      if (isView) {
        done();
        return;
      }
      const formInstance = editFormRef.value?.getRef();
      if (!formInstance) return;

      await formInstance.validate(async (valid: boolean) => {
        if (valid) {
          try {
            const formData = editFormRef.value?.getFormData();
            if (row?.uid) {
              await updateAssemblyOrderApi(row.uid, formData);
              ElMessage.success("更新成功");
            } else {
              await addAssemblyOrderApi(formData);
              ElMessage.success("创建成功");
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

const handleView = (row: AssemblyOrder) => {
  openDialog("查看组装单", row, true);
};

const handleEdit = (row: AssemblyOrder) => {
  openDialog("编辑组装单", row, false);
};

const handleDelete = async (row: AssemblyOrder) => {
  try {
    await ElMessageBox.confirm("确认删除该组装单?", "确认删除", {
      type: "warning"
    });
    await deleteAssemblyOrderApi(row.uid);
    ElMessage.success("删除成功");
    fetchData();
  } catch (error) {
    if (error !== "cancel") {
      handleApiError(error, "删除失败");
    }
  }
};

const handleApprove = async (row: AssemblyOrder) => {
  try {
    await ElMessageBox.confirm(
      "审核后将执行组装操作:子件出库,成品入库。确认审核?",
      "确认审核",
      { type: "warning" }
    );
    await http.request("post", `/api/assembly-order/${row.uid}/approve`);
    ElMessage.success("审核成功");
    fetchData();
  } catch (error) {
    if (error !== "cancel") {
      handleApiError(error, "审核失败");
    }
  }
};

const handleReject = async (row: AssemblyOrder) => {
  try {
    const { value } = await ElMessageBox.prompt("请输入拒绝原因", "拒绝审核", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /.+/,
      inputErrorMessage: "请输入拒绝原因"
    });
    await http.request("post", `/api/assembly-order/${row.uid}/reject`, {
      data: { reason: value }
    });
    ElMessage.success("已拒绝");
    fetchData();
  } catch (error) {
    if (error !== "cancel") {
      handleApiError(error, "操作失败");
    }
  }
};

const handleSaveAsBom = async (row: AssemblyOrder) => {
  try {
    await ElMessageBox.confirm("确认将该组装单保存为BOM模板?", "存为模板", {
      type: "info"
    });
    await http.request("post", `/api/assembly-order/${row.uid}/save-as-bom`);
    ElMessage.success("已保存为BOM模板");
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
      <PureTableBar title="组装单列表" @refresh="fetchData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新增组装单')"
          >
            新增组装单
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

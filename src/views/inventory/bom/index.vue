<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import View from "~icons/ep/view";
import Delete from "~icons/ep/delete";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { columns } from "./columns";
import editForm from "./form.vue";
import { type Bom, type BomQuery, BomStatus, bomStatusMap } from "./types";
import {
  approveBomApi,
  createAssemblyOrderFromBomApi,
  createBomApi,
  createDisassemblyOrderFromBomApi,
  deleteBomApi,
  disableBomApi,
  getBomListApi,
  updateBomApi
} from "@/api/inventory";

defineOptions({
  name: "InventoryBom"
});

const dataList = ref<Bom[]>([]);
const loading = ref(false);
const formRef = ref<FormInstance>();
const editFormRef = ref();

const queryParams = reactive<BomQuery>({
  status: undefined,
  keyword: ""
});

const pagination = ref({
  total: 0,
  pageSize: 15,
  currentPage: 1,
  background: true
});

const statusOptions = Object.entries(bomStatusMap).map(([value, config]) => ({
  value,
  label: config.label
}));

const fetchData = async () => {
  loading.value = true;
  try {
    const { data, code } = await getBomListApi(pagination.value.currentPage, {
      ...queryParams,
      status: queryParams.status || undefined
    });
    if (code === 200) {
      dataList.value = data.list as unknown as Bom[];
      pagination.value.total = data.count;
    }
  } catch (error) {
    console.error("获取BOM列表失败", error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.value.currentPage = 1;
  fetchData();
};

const handleReset = (formEl: FormInstance | undefined) => {
  if (formEl) formEl.resetFields();
  queryParams.status = undefined;
  queryParams.keyword = "";
  handleSearch();
};

const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page;
  fetchData();
};

const openDialog = (title: string, row?: Bom, isView: boolean = false) => {
  addDialog({
    title,
    props: {
      formInline: row || {},
      isView
    },
    width: "60%",
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
              await updateBomApi(row.uid, formData);
              ElMessage.success("更新成功");
            } else {
              await createBomApi(formData);
              ElMessage.success("创建成功");
            }
            done();
            fetchData();
          } catch (error) {
            ElMessage.error("操作失败");
          }
        }
      });
    }
  });
};

const handleView = (row: Bom) => {
  openDialog("查看BOM", row, true);
};

const handleEdit = (row: Bom) => {
  openDialog("编辑BOM", row, false);
};

const handleDelete = async (row: Bom) => {
  try {
    await ElMessageBox.confirm("确认删除该BOM?", "确认删除", {
      type: "warning"
    });
    await deleteBomApi(row.uid);
    ElMessage.success("删除成功");
    fetchData();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

const handleApprove = async (row: Bom) => {
  try {
    await ElMessageBox.confirm("确认审核该BOM?", "确认审核", {
      type: "warning"
    });
    await approveBomApi(row.uid);
    ElMessage.success("审核成功");
    fetchData();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("审核失败");
    }
  }
};

const handleDisable = async (row: Bom) => {
  try {
    await ElMessageBox.confirm("确认禁用该BOM?", "确认禁用", {
      type: "warning"
    });
    await disableBomApi(row.uid);
    ElMessage.success("已禁用");
    fetchData();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("操作失败");
    }
  }
};

const handleCreateAssembly = async (row: Bom) => {
  try {
    await ElMessageBox.confirm("确认根据该BOM创建组装单?", "创建组装单", {
      type: "info"
    });
    await createAssemblyOrderFromBomApi(row.uid);
    ElMessage.success("组装单创建成功");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("操作失败");
    }
  }
};

const handleCreateDisassembly = async (row: Bom) => {
  try {
    await ElMessageBox.confirm("确认根据该BOM创建拆卸单?", "创建拆卸单", {
      type: "info"
    });
    await createDisassemblyOrderFromBomApi(row.uid);
    ElMessage.success("拆卸单创建成功");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("操作失败");
    }
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="main">
    <el-card class="mb-4">
      <el-form ref="formRef" :model="queryParams" :inline="true">
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
            placeholder="BOM编码/名称"
            clearable
            class="w-[180px]"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:search-line')"
            :loading="loading"
            @click="handleSearch"
          >
            搜索
          </el-button>
          <el-button
            :icon="useRenderIcon(Refresh)"
            @click="handleReset(formRef)"
          >
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <PureTableBar title="BOM表列表" @refresh="fetchData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新增BOM')"
          >
            新增BOM
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
                v-if="row.status === 'draft'"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="row.status === 'draft'"
                link
                type="success"
                @click="handleApprove(row)"
              >
                审核
              </el-button>
              <el-button
                v-if="row.status === 'approved'"
                link
                type="primary"
                @click="handleCreateAssembly(row)"
              >
                组装
              </el-button>
              <el-button
                v-if="row.status === 'approved'"
                link
                type="primary"
                @click="handleCreateDisassembly(row)"
              >
                拆卸
              </el-button>
              <el-button
                v-if="row.status === 'approved'"
                link
                type="warning"
                @click="handleDisable(row)"
              >
                禁用
              </el-button>
              <el-button
                v-if="row.status === 'draft'"
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

.mb-4 {
  margin-bottom: 16px;
}
</style>

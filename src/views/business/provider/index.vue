<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { openDialog } from "./table";
import {
  getProviderListApi,
  deleteProviderApi,
  restoreProviderApi
} from "@/api";
import type { Provider } from "@/api/business/provider";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { ImportDialog, ExportDialog } from "@/components/ImportExport";
import ImportIcon from "~icons/ri/upload-cloud-2-line";
import ExportIcon from "~icons/ri/download-cloud-2-line";
import { useCrud } from "@/composables";
import type { CommonResult } from "@/api/type";

defineOptions({
  name: "tire"
});

const formRef = ref();
const form = ref({
  name: undefined as string | undefined,
  desc: undefined as string | undefined,
  scope: "nonDeleted" as "nonDeleted" | "deleted" | "all"
});

const showImportDialog = ref(false);
const showExportDialog = ref(false);

const { loading, dataList, pagination, fetchData, onCurrentChange } = useCrud<
  Provider,
  CommonResult<{ list: Provider[]; count: number }>,
  { page: number; pageSize: number }
>({
  api: ({ page }) =>
    getProviderListApi(page, {
      name: form.value.name,
      desc: form.value.desc,
      scope: form.value.scope
    }) as Promise<CommonResult<{ list: Provider[]; count: number }>>,
  pagination: {
    total: 0,
    pageSize: PAGE_SIZE_SMALL,
    currentPage: 1,
    background: true
  },
  transform: res => {
    if (res.code !== 200) {
      message(res.msg || "加载失败", { type: "error" });
      return { list: [], total: 0 };
    }
    return {
      list: res.data?.list ?? [],
      total: res.data?.count ?? 0
    };
  },
  immediate: true
});

const onSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  fetchData();
};

const resetForm = (formEl: { resetFields: () => void } | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

async function handleDelete(row: Provider) {
  await deleteProviderApi(row.uid);
  message(`您删除了${row.name}这条数据`, { type: "success" });
  fetchData();
}

async function handleRestore(row: Provider) {
  await restoreProviderApi(row.uid);
  message(`已恢复${row.name}`, { type: "success" });
  fetchData();
}
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="formRef"
      class="m-1"
      :form="form"
      :loading="loading"
      :body-style="{ paddingBottom: '0', overflow: 'auto' }"
      @search="onSearch"
      @reset="resetForm(formRef)"
    >
      <el-form-item label="供应商名称：" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入供应商名称"
          clearable
          class="w-[180px]!"
        />
      </el-form-item>
      <el-form-item label="备注：" prop="desc">
        <el-input
          v-model="form.desc"
          placeholder="请输入备注"
          clearable
          class="w-[180px]!"
        />
      </el-form-item>
      <el-form-item label="范围：" prop="scope">
        <el-select v-model="form.scope" class="w-[180px]!" clearable>
          <el-option label="未删除" value="nonDeleted" />
          <el-option label="已删除" value="deleted" />
          <el-option label="全部" value="all" />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar :title="$route.meta.title" @refresh="fetchData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增供应商
          </el-button>

          <el-button
            :icon="useRenderIcon(ImportIcon)"
            @click="showImportDialog = true"
          >
            导入
          </el-button>

          <el-button
            :icon="useRenderIcon(ExportIcon)"
            @click="showExportDialog = true"
          >
            导出
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="id"
            adaptive
            :size
            :columns
            border
            :data="dataList"
            :loading="loading"
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="onCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="openDialog('查看', row)"
              >
                查看
              </el-button>

              <el-button
                class="reset-margin"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="openDialog('修改', row)"
              >
                修改
              </el-button>

              <DeleteButton
                v-if="!row.deleteAt"
                :show-icon="false"
                :title="`是否确认删除${row.name}这条数据`"
                @confirm="handleDelete(row)"
              />
              <el-button
                v-else
                class="reset-margin"
                link
                type="primary"
                @click="handleRestore(row)"
              >
                恢复
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>

    <ImportDialog
      v-model:visible="showImportDialog"
      type="provider"
      title="批量导入供应商"
      @success="fetchData"
    />
    <ExportDialog
      v-model:visible="showExportDialog"
      type="provider"
      title="导出供应商数据"
    />
  </div>
</template>

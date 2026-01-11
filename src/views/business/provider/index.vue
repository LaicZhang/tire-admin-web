<script setup lang="ts">
import { onMounted, ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { openDialog } from "./table";
import { getProviderListApi, deleteProviderApi } from "@/api";
import type { Provider } from "@/api/business/provider";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { ImportDialog, ExportDialog } from "@/components/ImportExport";
import ImportIcon from "~icons/ri/upload-cloud-2-line";
import ExportIcon from "~icons/ri/download-cloud-2-line";

defineOptions({
  name: "tire"
});
const dataList = ref<Provider[]>([]);
const loading = ref(false);
const formRef = ref();
const form = ref({
  name: undefined,
  desc: undefined
});
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const showImportDialog = ref(false);
const showExportDialog = ref(false);
const getProviderListInfo = async () => {
  const { data, code, msg } = await getProviderListApi(
    pagination.value.currentPage
  );
  if (code === 200) dataList.value = data.list;
  else message(msg, { type: "error" });
  pagination.value.total = data.count;
};
const onSearch = async () => {
  loading.value = true;
  if (form.value.name === undefined && form.value.desc === undefined)
    await getProviderListInfo();

  const { data } = await getProviderListApi(pagination.value.currentPage, {
    name: form.value.name,
    desc: form.value.desc
  });

  dataList.value = data.list;
  pagination.value.total = data.count;
  loading.value = false;
};

const resetForm = (formEl: { resetFields: () => void } | undefined) => {
  loading.value = true;
  if (!formEl) return;
  formEl.resetFields();
  loading.value = false;
};

async function handleCurrentChange(val: number) {
  pagination.value.currentPage = val;
  await getProviderListInfo();
}

async function handleDelete(row: Provider) {
  await deleteProviderApi(row.uid);
  message(`您删除了${row.name}这条数据`, { type: "success" });
  onSearch();
}

// async function handleToggleProvider(row) {
//   await toggleProviderApi(row.uid);
//   onSearch();
// }

onMounted(async () => {
  await getProviderListInfo();
});
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
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar :title="$route.meta.title" @refresh="getProviderListInfo">
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
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handleCurrentChange"
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
                :show-icon="false"
                :title="`是否确认删除${row.name}这条数据`"
                @confirm="handleDelete(row)"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>

    <ImportDialog
      v-model:visible="showImportDialog"
      type="provider"
      title="批量导入供应商"
      @success="getProviderListInfo"
    />
    <ExportDialog
      v-model:visible="showExportDialog"
      type="provider"
      title="导出供应商数据"
    />
  </div>
</template>

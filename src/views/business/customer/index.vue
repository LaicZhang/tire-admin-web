<script setup lang="ts">
import { onMounted, ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { openDialog } from "./table";
import { getCustomerListApi, deleteCustomerApi } from "@/api";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import TagDialog from "./tagDialog.vue";
import LevelDialog from "./levelDialog.vue";
import FollowUpDialog from "./followUpDialog.vue";
import { ImportDialog, ExportDialog } from "@/components/ImportExport";

// Icons
import TagIcon from "~icons/ri/price-tag-3-line";
import LevelIcon from "~icons/ri/vip-crown-line";
import ImportIcon from "~icons/ri/upload-cloud-2-line";
import ExportIcon from "~icons/ri/download-cloud-2-line";
import UserFollowIcon from "~icons/ri/user-follow-line";

defineOptions({
  name: "tire"
});

interface Customer {
  uid: string;
  name: string;
  desc?: string;
  levelId?: number;
  tagIds?: number[];
  creditLimit?: number;
}

const dataList = ref<Customer[]>([]);
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

// Dialog Controls
const showTagDialog = ref(false);
const showLevelDialog = ref(false);
const showImportDialog = ref(false);
const showExportDialog = ref(false);
const showFollowUpDialog = ref(false);
const currentCustomerUid = ref("");

// Handlers
function handleFollowUp(row: Customer) {
  currentCustomerUid.value = row.uid;
  showFollowUpDialog.value = true;
}
const getCustomerListInfo = async () => {
  const { data, code, msg } = await getCustomerListApi(
    pagination.value.currentPage
  );
  if (code === 200) dataList.value = (data.list || []) as Customer[];
  else message(msg, { type: "error" });
  pagination.value.total = data.count;
};
const onSearch = async () => {
  loading.value = true;
  if (form.value.name === undefined && form.value.desc === undefined)
    await getCustomerListInfo();

  const { data } = await getCustomerListApi(pagination.value.currentPage, {
    name: form.value.name,
    desc: form.value.desc
  });

  dataList.value = (data.list || []) as Customer[];
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
  await getCustomerListInfo();
}

async function handleDelete(row: Customer) {
  await deleteCustomerApi(row.uid);
  message(`您删除了${row.name}这条数据`, { type: "success" });
  onSearch();
}

// async function handleToggleCustomer(row) {
//   await toggleCustomerApi(row.uid);
//   onSearch();
// }

onMounted(async () => {
  await getCustomerListInfo();
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
      <el-form-item label="客户名称：" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入客户名称"
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
      <PureTableBar :title="$route.meta.title" @refresh="getCustomerListInfo">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新增', undefined, getCustomerListInfo)"
          >
            新增客户
          </el-button>

          <el-button
            :icon="useRenderIcon(TagIcon)"
            @click="showTagDialog = true"
          >
            标签管理
          </el-button>

          <el-button
            :icon="useRenderIcon(LevelIcon)"
            @click="showLevelDialog = true"
          >
            等级管理
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
                @click="openDialog('查看', row, getCustomerListInfo)"
              >
                查看
              </el-button>

              <el-button
                class="reset-margin"
                link
                type="primary"
                :icon="useRenderIcon(UserFollowIcon)"
                @click="handleFollowUp(row)"
              >
                跟进
              </el-button>

              <el-button
                class="reset-margin"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="openDialog('修改', row, getCustomerListInfo)"
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

    <!-- 弹窗组件 -->
    <TagDialog v-model="showTagDialog" />
    <LevelDialog v-model="showLevelDialog" />
    <FollowUpDialog
      v-if="showFollowUpDialog"
      v-model:visible="showFollowUpDialog"
      :customer-uid="currentCustomerUid"
    />
    <ImportDialog
      v-model:visible="showImportDialog"
      type="customer"
      title="批量导入客户"
      @success="getCustomerListInfo"
    />
    <ExportDialog
      v-model:visible="showExportDialog"
      type="customer"
      title="导出客户数据"
    />
  </div>
</template>

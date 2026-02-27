<script setup lang="ts">
import { h, ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { openDialog } from "./table";
import { addDialog } from "@/components/ReDialog";
import {
  getCustomerListApi,
  deleteCustomerApi,
  restoreCustomerApi
} from "@/api";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import TagDialog from "./tagDialog.vue";
import LevelDialog from "./levelDialog.vue";
import FollowUpDialog from "./followUpDialog.vue";
import { ImportDialog, ExportDialog } from "@/components/ImportExport";
import { useCrud } from "@/composables";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";

// Icons
import TagIcon from "~icons/ri/price-tag-3-line";
import LevelIcon from "~icons/ri/vip-crown-line";
import ImportIcon from "~icons/ri/upload-cloud-2-line";
import ExportIcon from "~icons/ri/download-cloud-2-line";
import UserFollowIcon from "~icons/ri/user-follow-line";
import BalanceHistoryPanel from "@/components/BalanceAdjustment/BalanceHistoryPanel.vue";

defineOptions({
  name: "tire"
});

interface Customer {
  uid: string;
  name: string;
  desc?: string;
  deleteAt?: string | null;
  levelId?: number;
  tagIds?: number[];
  creditLimit?: number;
}

const formRef = ref();
const form = ref({
  name: undefined as string | undefined,
  desc: undefined as string | undefined,
  scope: "nonDeleted" as "nonDeleted" | "deleted" | "all"
});

// Dialog Controls
const showTagDialog = ref(false);
const showLevelDialog = ref(false);
const showImportDialog = ref(false);
const showExportDialog = ref(false);
const showFollowUpDialog = ref(false);
const currentCustomerUid = ref("");

const buildQuery = () => ({
  name: form.value.name,
  desc: form.value.desc,
  scope: form.value.scope
});

const { loading, dataList, pagination, fetchData, onCurrentChange } = useCrud<
  Customer,
  CommonResult<PaginatedResponseDto<Customer>>,
  { page: number; pageSize: number }
>({
  api: ({ page }) =>
    getCustomerListApi(page, buildQuery()) as Promise<
      CommonResult<PaginatedResponseDto<Customer>>
    >,
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

// Handlers
function handleFollowUp(row: Customer) {
  currentCustomerUid.value = row.uid;
  showFollowUpDialog.value = true;
}

function handleBalance(row: Customer) {
  addDialog({
    title: `${row.name} - 余额`,
    width: "980px",
    draggable: true,
    closeOnClickModal: false,
    hideFooter: true,
    contentRenderer: () =>
      h(BalanceHistoryPanel, {
        partyType: "customer",
        partyUid: row.uid,
        partyName: row.name
      })
  });
}

const onSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  fetchData();
};

const resetForm = (formEl: { resetFields: () => void } | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

async function handleDelete(row: Customer) {
  await deleteCustomerApi(row.uid);
  message(`您删除了${row.name}这条数据`, { type: "success" });
  fetchData();
}

async function handleRestore(row: Customer) {
  await restoreCustomerApi(row.uid);
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
            @click="openDialog('新增', undefined, fetchData)"
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
            @page-current-change="onCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="handleBalance(row)"
              >
                余额
              </el-button>

              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="openDialog('查看', row, fetchData)"
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
                @click="openDialog('修改', row, fetchData)"
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
      @success="fetchData"
    />
    <ExportDialog
      v-model:visible="showExportDialog"
      type="customer"
      title="导出客户数据"
    />
  </div>
</template>

<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { onMounted, ref, h } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EditPen from "~icons/ep/edit-pen";
import { getStockBalancePage, stockTakingApi } from "@/api";
import type { StockBalanceRow } from "@/api/business/stock-ledger";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { addDialog } from "@/composables/useDialogService";
import { deviceDetection } from "@pureadmin/utils";
import editForm from "./form.vue";
import type { FormInstance } from "element-plus";

defineOptions({
  name: "StockTaking"
});

type StockRow = StockBalanceRow & { count: number };

const dataList = ref<StockRow[]>([]);
const loading = ref(false);
const formRef = ref<{ formRef?: FormInstance } | null>(null);
const activeRow = ref<StockRow | null>(null);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const form = ref({
  keyword: ""
});
const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

const getList = async () => {
  loading.value = true;
  try {
    const { data, code, msg } = await getStockBalancePage(
      pagination.value.currentPage,
      {
        limit: pagination.value.pageSize
      }
    );
    if (code === 200) {
      dataList.value = data.list.map(item => ({
        ...item,
        count: item.availableQuantity
      }));
      pagination.value.total = data.count ?? 0;
    } else {
      message(msg, { type: "error" });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "获取失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
};

const onSearch = async () => {
  pagination.value.currentPage = 1;
  await getList();
};

const resetForm = () => {
  searchFormRef.value?.resetFields();
  onSearch();
};

async function handleCurrentChange(val: number) {
  pagination.value.currentPage = val;
  await getList();
}

async function handleSizeChange(val: number) {
  pagination.value.pageSize = val;
  pagination.value.currentPage = 1;
  await getList();
}

function openDialog(row: StockRow) {
  type StockFormInline = {
    uid: number;
    tireName?: string;
    repoName?: string;
    batchNo?: string;
    systemCount: number;
    actualCount: number;
  };

  addDialog({
    title: "盘点录入",
    props: {
      formInline: {
        uid: row.id, // Reserve ID
        tireName: row.tire?.name,
        repoName: row.repo?.name,
        batchNo: row.batchNo,
        systemCount: row.count,
        actualCount: row.count // Default to system count
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(editForm, {
        ref: formRef,
        formInline: (options.props as { formInline: StockFormInline })
          .formInline
      }),
    beforeSure: (done, { options }) => {
      activeRow.value = row;
      const FormRef = formRef.value?.formRef;
      if (!FormRef) return;
      const curData = (
        options.props as { formInline: { uid: number; actualCount: number } }
      ).formInline;
      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          try {
            if (!activeRow.value?.repoId || !activeRow.value.tireId) {
              message("缺少仓库或商品标识，无法提交盘点", { type: "error" });
              return;
            }
            await stockTakingApi({
              repoId: activeRow.value.repoId,
              tireId: activeRow.value.tireId,
              actualCount: curData.actualCount
            });
            message("盘点成功", { type: "success" });
            done();
            onSearch();
          } catch (e: unknown) {
            const errorMsg = e instanceof Error ? e.message : "盘点失败";
            message(errorMsg, { type: "error" });
          }
        }
      });
    }
  });
}

onMounted(() => {
  getList();
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      :form="form"
      :loading="loading"
      @search="onSearch"
      @reset="resetForm"
    >
      <el-form-item label="关键字">
        <el-input v-model="form.keyword" placeholder="搜索（预留）" disabled />
      </el-form-item>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar :title="$route.meta.title" @refresh="getList">
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
            @page-size-change="handleSizeChange"
          >
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="openDialog(row)"
              >
                盘点
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

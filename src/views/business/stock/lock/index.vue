<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "../../../../utils/constants";
import { ref, reactive } from "vue";
import { columns } from "./columns";
import {
  getRepoBinListApi,
  lockRepoBinApi,
  unlockRepoBinApi,
  type Bin
} from "@/api/business/stock";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Lock from "~icons/ep/lock";
import Unlock from "~icons/ep/unlock";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { useCrud } from "@/composables";
import type { CommonResult } from "@/api/type";

defineOptions({
  name: "StockLock"
});

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const form = reactive({
  keyword: ""
});

const {
  loading,
  dataList,
  pagination,
  fetchData,
  onCurrentChange,
  onSizeChange
} = useCrud<
  Bin,
  CommonResult<{ list: Bin[]; count: number; total?: number }>,
  { page: number; pageSize: number }
>({
  api: ({ page }) =>
    getRepoBinListApi(page, { keyword: form.keyword }) as Promise<
      CommonResult<{ list: Bin[]; count: number; total?: number }>
    >,
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
      total: res.data?.total ?? res.data?.count ?? 0
    };
  },
  immediate: true
});

const onSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  fetchData();
};

const onReset = () => {
  searchFormRef.value?.resetFields();
  onSearch();
};

const handleLock = async (row: { id: string | number }) => {
  ElMessageBox.prompt("请输入锁定原因", "锁定货位", {
    confirmButtonText: "确定",
    cancelButtonText: "取消"
  })
    .then(async res => {
      if (typeof res === "string") return;
      const { value } = res;
      try {
        await lockRepoBinApi({ id: String(row.id), reason: value });
        message("锁定成功", { type: "success" });
        fetchData();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "锁定失败";
        message(msg, { type: "error" });
      }
    })
    .catch(() => {});
};

const handleUnlock = async (row: { id: string | number }) => {
  try {
    await unlockRepoBinApi(String(row.id));
    message("解锁成功", { type: "success" });
    fetchData();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "解锁失败";
    message(msg, { type: "error" });
  }
};
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      :form="form"
      :loading="loading"
      @search="onSearch"
      @reset="onReset"
    >
      <el-form-item label="关键字" prop="keyword">
        <el-input
          v-model="form.keyword"
          placeholder="搜索货位"
          clearable
          class="w-[180px]"
        />
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="库存锁定管理" @refresh="onSearch">
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          :loading="loading"
          :size="size"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :paginationSmall="size === 'small'"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="onSearch"
          @page-current-change="onSearch"
        >
          <template #operation="{ row }">
            <el-button
              v-if="!row.isLocked"
              class="reset-margin"
              link
              type="danger"
              :icon="useRenderIcon(Lock)"
              @click="handleLock(row)"
            >
              锁定
            </el-button>
            <el-button
              v-else
              class="reset-margin"
              link
              type="success"
              :icon="useRenderIcon(Unlock)"
              @click="handleUnlock(row)"
            >
              解锁
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

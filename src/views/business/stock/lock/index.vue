<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import {
  getRepoBinListApi,
  lockRepoBinApi,
  unlockRepoBinApi
} from "@/api/business/stock";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import Lock from "~icons/ep/lock";
import Unlock from "~icons/ep/unlock";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";

defineOptions({
  name: "StockLock"
});

const formRef = ref();
const loading = ref(true);
const dataList = ref([]);
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const form = reactive({
  keyword: ""
});

const columns: TableColumnList = [
  {
    label: "货位名称",
    prop: "name"
  },
  {
    label: "所属仓库",
    prop: "repoName"
  },
  {
    label: "状态",
    prop: "isLocked",
    formatter: ({ isLocked }) => (isLocked ? "已锁定" : "正常")
  },
  {
    label: "锁定原因",
    prop: "lockReason"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation"
  }
];

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getRepoBinListApi(pagination.currentPage, {
      keyword: form.keyword
    });
    dataList.value = data.list;
    pagination.total = data.total;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

const resetForm = formEl => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

const handleLock = async row => {
  ElMessageBox.prompt("请输入锁定原因", "锁定货位", {
    confirmButtonText: "确定",
    cancelButtonText: "取消"
  })
    .then(async ({ value }) => {
      try {
        await lockRepoBinApi({ id: row.id, reason: value });
        message("锁定成功", { type: "success" });
        onSearch();
      } catch (e) {
        message(e.message || "锁定失败", { type: "error" });
      }
    })
    .catch(() => {});
};

const handleUnlock = async row => {
  try {
    await unlockRepoBinApi(row.id);
    message("解锁成功", { type: "success" });
    onSearch();
  } catch (e) {
    message(e.message || "解锁失败", { type: "error" });
  }
};

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <el-form
      ref="formRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="关键字" prop="keyword">
        <el-input
          v-model="form.keyword"
          placeholder="搜索货位"
          clearable
          class="w-[180px]!"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="loading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)">
          重置
        </el-button>
      </el-form-item>
    </el-form>

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

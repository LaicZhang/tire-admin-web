<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { ref, reactive, onMounted } from "vue";
import { columns } from "./columns";
import { getCollectionReminderListApi } from "@/api/finance";
import type { CollectionReminder } from "@/api/finance";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Add from "~icons/ep/plus";
import { handleApiError } from "@/utils";

defineOptions({
  name: "FinanceReminder"
});

const loading = ref(true);
const dataList = ref<CollectionReminder[]>([]);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const pagination = reactive({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

const form = reactive({
  status: ""
});

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getCollectionReminderListApi(
      pagination.currentPage,
      { status: form.status }
    );
    dataList.value = data.list;
    pagination.total = data.total ?? data.count;
  } catch (e) {
    handleApiError(e, "获取催收提醒列表失败");
  } finally {
    loading.value = false;
  }
}

const onReset = () => {
  searchFormRef.value?.resetFields();
  onSearch();
};

onMounted(() => {
  onSearch();
});
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
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="form.status"
          placeholder="请选择状态"
          clearable
          class="w-[180px]"
        >
          <el-option label="待处理" value="pending" />
          <el-option label="已处理" value="processed" />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="催收提醒" @refresh="onSearch">
      <template #buttons>
        <el-button type="primary" :icon="useRenderIcon(Add)">
          新增提醒
        </el-button>
      </template>
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
        />
      </template>
    </PureTableBar>
  </div>
</template>

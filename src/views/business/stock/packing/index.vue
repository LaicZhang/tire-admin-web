<script setup lang="ts">
import { ref, reactive } from "vue";
import { columns } from "./columns";
import {
  getPackingBoxListApi,
  createPackingBoxApi
} from "@/api/business/packing-box";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Add from "~icons/ep/plus";
import { message } from "@/utils/message";
import { addDialog } from "@/components/ReDialog";
import editForm from "./form.vue";
import { useCrud } from "@/composables";
import type { CommonResult } from "@/api/type";

interface PackingBox {
  id: string | number;
  code: string;
  remark?: string;
}

defineOptions({
  name: "StockPacking"
});

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const form = reactive({
  code: ""
});

const {
  loading,
  dataList,
  pagination,
  fetchData,
  onCurrentChange,
  onSizeChange
} = useCrud<
  PackingBox,
  CommonResult<{ list: PackingBox[]; total: number }>,
  { page: number; pageSize: number }
>({
  api: ({ page, pageSize }) =>
    getPackingBoxListApi({
      page,
      pageSize,
      code: form.code
    }) as Promise<CommonResult<{ list: PackingBox[]; total: number }>>,
  pagination: {
    total: 0,
    pageSize: 10,
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
      total: res.data?.total ?? 0
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

const handleAdd = () => {
  addDialog({
    title: "新建装箱单",
    props: {
      formInline: { code: "", remark: "" }
    },
    width: "40%",
    draggable: true,
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () => editForm,
    beforeSure: (done, { options }) => {
      const curData = (
        options.props as { formInline: { code: string; remark: string } }
      ).formInline;

      createPackingBoxApi(curData)
        .then(() => {
          message("新建装箱单成功", { type: "success" });
          done();
          fetchData();
        })
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : "创建失败";
          message(msg, { type: "error" });
        });
    }
  });
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
      <el-form-item label="单号" prop="code">
        <el-input
          v-model="form.code"
          placeholder="请输入装箱单号"
          clearable
          class="w-[180px]"
        />
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="装箱管理" @refresh="onSearch">
      <template #buttons>
        <el-button type="primary" :icon="useRenderIcon(Add)" @click="handleAdd">
          新建装箱单
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

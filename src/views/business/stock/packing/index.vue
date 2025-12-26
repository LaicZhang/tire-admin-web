<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import type { FormInstance } from "element-plus";
import {
  getPackingBoxListApi,
  createPackingBoxApi
} from "@/api/business/packing-box";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import Add from "~icons/ep/plus";
import { message } from "@/utils/message";
import { addDialog } from "@/components/ReDialog";
import editForm from "./form.vue";

defineOptions({
  name: "StockPacking"
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
  code: ""
});

const columns: TableColumnList = [
  {
    label: "装箱单号",
    prop: "code"
  },
  {
    label: "创建时间",
    prop: "createdAt",
    formatter: ({ createdAt }) => new Date(createdAt).toLocaleString()
  },
  {
    label: "商品数量",
    prop: "itemCount"
  },
  {
    label: "状态",
    prop: "status",
    formatter: ({ status }) => (status === 1 ? "已完成" : "进行中")
  },
  {
    label: "备注",
    prop: "remark"
  }
];

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getPackingBoxListApi({
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      code: form.code
    });
    dataList.value = data.list;
    pagination.total = data.total;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
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
      const FormRef = options.props.formInline;
      // The form ref logic in ReDialog usually involves `options.props.formInline` being the reactive state
      // OR using the `getRef` if exposed.
      // Let's simplified use the props to get data as they are reactive.
      const curData = options.props.formInline;

      createPackingBoxApi(curData)
        .then(() => {
          message("新建装箱单成功", { type: "success" });
          done(); // close dialog
          onSearch(); // refresh list
        })
        .catch(e => {
          message(e.message || "创建失败", { type: "error" });
        });
    }
  });
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
      <el-form-item label="单号" prop="code">
        <el-input
          v-model="form.code"
          placeholder="请输入装箱单号"
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

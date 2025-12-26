<script setup lang="ts">
import { ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";
import { getStatementList, type Statement } from "@/api/business/statement";
import { message } from "@/utils/message";

defineOptions({
  name: "StatementList"
});

const form = ref({
  type: "",
  targetName: "",
  status: ""
});

const dataList = ref<Statement[]>([]);
const loading = ref(true);
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const columns: TableColumnList = [
  {
    label: "对账单号",
    prop: "statementNo",
    minWidth: 160
  },
  {
    label: "类型",
    prop: "type",
    minWidth: 100,
    formatter: ({ type }) => (type === "CUSTOMER" ? "客户对账" : "供应商对账")
  },
  {
    label: "往来单位",
    prop: "targetName",
    minWidth: 160
  },
  {
    label: "对账周期",
    prop: "period",
    minWidth: 200,
    formatter: row => `${row.startTime} ~ ${row.endTime}`
  },
  {
    label: "应收/应付金额",
    prop: "amount",
    minWidth: 120
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 100,
    slot: "status"
  },
  {
    label: "创建时间",
    prop: "createTime",
    minWidth: 160
  },
  {
    label: "操作",
    fixed: "right",
    width: 140,
    slot: "operation"
  }
];

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getStatementList({
      page: pagination.value.currentPage,
      pageSize: pagination.value.pageSize,
      ...form.value
    });
    dataList.value = data.list;
    pagination.value.total = data.total ?? data.count;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "查询失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
}

function resetForm(formEl: { resetFields: () => void } | undefined) {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
}

const formRef = ref();

function handleAdd() {
  message("功能开发中", { type: "info" });
}

function handleDetail(_row: Statement) {
  message("功能开发中", { type: "info" });
}

onSearch();
</script>

<template>
  <div class="main">
    <el-form
      ref="formRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="对账类型" prop="type">
        <el-select
          v-model="form.type"
          placeholder="请选择类型"
          clearable
          class="w-[160px]!"
        >
          <el-option label="客户对账" value="CUSTOMER" />
          <el-option label="供应商对账" value="PROVIDER" />
        </el-select>
      </el-form-item>
      <el-form-item label="往来单位" prop="targetName">
        <el-input
          v-model="form.targetName"
          placeholder="请输入单位名称"
          clearable
          class="w-[160px]!"
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

    <PureTableBar title="对账单列表" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleAdd"
        >
          新建对账
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
          @page-size-change="val => (pagination.pageSize = val) && onSearch()"
          @page-current-change="
            val => (pagination.currentPage = val) && onSearch()
          "
        >
          <template #status="{ row }">
            <el-tag
              :type="
                row.status === 'CONFIRMED'
                  ? 'success'
                  : row.status === 'VOID'
                    ? 'info'
                    : 'warning'
              "
            >
              {{
                row.status === "CONFIRMED"
                  ? "已确认"
                  : row.status === "VOID"
                    ? "已作废"
                    : "草稿"
              }}
            </el-tag>
          </template>
          <template #operation="{ row }">
            <el-button
              link
              type="primary"
              :size="size"
              @click="handleDetail(row)"
            >
              查看
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

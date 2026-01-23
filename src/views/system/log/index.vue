<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import {
  getOperationLogListApi,
  type OperationLogItem
} from "@/api/system/log";
import { columns } from "./columns";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import View from "~icons/ep/view";

defineOptions({
  name: "SystemLog"
});

const loading = ref(true);
const dataList = ref<OperationLogItem[]>([]);
const formRef = ref<{ resetFields: () => void }>();
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const form = reactive({
  module: "",
  operator: "",
  status: undefined as boolean | undefined,
  dateRange: [] as string[]
});

async function onSearch() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = { ...form };
    if (form.dateRange && form.dateRange.length === 2) {
      params.startDate = form.dateRange[0];
      params.endDate = form.dateRange[1];
    }
    delete params.dateRange;

    const { data } = await getOperationLogListApi(
      pagination.currentPage,
      params
    );
    dataList.value = data.list || [];
    pagination.total = data.total || 0;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

const resetForm = (formEl?: { resetFields: () => void }) => {
  if (!formEl) return;
  formEl.resetFields();
  form.dateRange = [];
  onSearch();
};

function viewDetail(row: OperationLogItem) {
  addDialog({
    title: "日志详情",
    width: "50%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: true,
    contentRenderer: () =>
      h("div", { class: "log-detail" }, [
        h(
          "el-descriptions",
          { column: 2, border: true },
          {
            default: () =>
              [
                h("el-descriptions-item", { label: "模块" }, row.module),
                h("el-descriptions-item", { label: "方法" }, row.method),
                h("el-descriptions-item", { label: "操作人" }, row.operator),
                h("el-descriptions-item", { label: "IP地址" }, row.ip),
                h(
                  "el-descriptions-item",
                  { label: "耗时" },
                  `${row.duration} ms`
                ),
                h("el-descriptions-item", { label: "状态" }, [
                  h(
                    "el-tag",
                    { type: row.success ? "success" : "danger" },
                    row.success ? "成功" : "失败"
                  )
                ]),
                h(
                  "el-descriptions-item",
                  { label: "时间", span: 2 },
                  row.createdAt
                ),
                h("el-descriptions-item", { label: "请求参数", span: 2 }, [
                  h(
                    "pre",
                    {
                      style:
                        "margin: 0; white-space: pre-wrap; word-break: break-all;"
                    },
                    row.params || "-"
                  )
                ]),
                h("el-descriptions-item", { label: "返回结果", span: 2 }, [
                  h(
                    "pre",
                    {
                      style:
                        "margin: 0; white-space: pre-wrap; word-break: break-all;"
                    },
                    row.result || "-"
                  )
                ]),
                row.error
                  ? h("el-descriptions-item", { label: "错误信息", span: 2 }, [
                      h(
                        "pre",
                        {
                          style:
                            "margin: 0; white-space: pre-wrap; word-break: break-all; color: #f56c6c;"
                        },
                        row.error
                      )
                    ])
                  : null
              ].filter(Boolean)
          }
        )
      ])
  });
}

function handlePageChange() {
  onSearch();
}

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="formRef"
      :form="form"
      :loading="loading"
      @search="onSearch"
      @reset="resetForm(formRef)"
    >
      <el-form-item label="模块" prop="module">
        <el-input
          v-model="form.module"
          placeholder="请输入模块"
          clearable
          class="w-[180px]!"
        />
      </el-form-item>
      <el-form-item label="操作人" prop="operator">
        <el-input
          v-model="form.operator"
          placeholder="请输入操作人"
          clearable
          class="w-[180px]!"
        />s
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="form.status"
          placeholder="请选择状态"
          clearable
          class="w-[120px]!"
        >
          <el-option label="成功" :value="true" />
          <el-option label="失败" :value="false" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="form.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="!w-[240px]"
        />
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="操作日志" @refresh="onSearch">
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
          @page-size-change="handlePageChange"
          @page-current-change="handlePageChange"
        >
          <template #operation="{ row }">
            <el-button
              class="reset-margin"
              link
              type="primary"
              :icon="useRenderIcon(View)"
              @click="viewDetail(row)"
            >
              详情
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

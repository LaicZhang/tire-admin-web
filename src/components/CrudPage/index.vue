<script
  setup
  lang="ts"
  generic="
    T extends Record<string, unknown>,
    QueryDto extends Record<string, unknown>
  "
>
import { PAGE_SIZE_SMALL } from "../../utils/constants";

import { ref, onMounted, computed } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { ImportDialog, ExportDialog } from "@/components/ImportExport";
import { PureTableBar } from "@/components/RePureTableBar";
import { message } from "@/utils";
import type {
  CrudPageConfig,
  RowData,
  FormRef,
  PaginationConfig
} from "./types";
import type { TableColumnList } from "@/utils/columnFactories";

// Icons
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import ImportIcon from "~icons/ri/upload-cloud-2-line";
import ExportIcon from "~icons/ri/download-cloud-2-line";

type InputModelValue = string | number | null | undefined;
type SelectModelValue = string | number | boolean | null | undefined;
type ScopeModelValue = "nonDeleted" | "deleted" | "all" | undefined;
type DatePickerModelValue =
  | string
  | number
  | Date
  | string[]
  | number[]
  | Date[]
  | null
  | undefined;
type NumberModelValue = number | null | undefined;

// Props
const props = withDefaults(defineProps<CrudPageConfig<T, QueryDto>>(), {
  enableRestore: false,
  showScope: false,
  showPagination: true,
  tableOperation: () => ({
    showView: true,
    showEdit: true,
    showDelete: true,
    showRestore: false
  }),
  actions: () => ({
    create: true,
    import: true,
    export: true
  })
});

// Emits
const emit = defineEmits<{
  refresh: [];
  rowAction: [action: string, row: RowData<T> | null];
}>();

// State
const dataList = ref<RowData<T>[]>([]);
const loading = ref(false);
const formRef = ref<FormRef>();
const form = ref<Record<string, unknown>>({
  ...props.searchForm?.defaultValues,
  scope: "nonDeleted"
});
const pagination = ref<PaginationConfig>({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

// Dialog Controls
const showImportDialog = ref(false);
const showExportDialog = ref(false);

// Computed
const scopeOptions = computed(() => [
  { label: "未删除", value: "nonDeleted" },
  { label: "已删除", value: "deleted" },
  { label: "全部", value: "all" }
]);

// Methods
const buildQuery = (): QueryDto => {
  const query: Record<string, unknown> = {};
  if (props.searchForm) {
    props.searchForm.fields.forEach(field => {
      if (
        form.value[field.prop] !== undefined &&
        form.value[field.prop] !== ""
      ) {
        query[field.prop] = form.value[field.prop];
      }
    });
  }
  if (props.showScope) {
    query.scope = form.value.scope;
  }
  return query as QueryDto;
};

const getListInfo = async () => {
  loading.value = true;
  try {
    const { data, code, msg } = await props.api.getList(
      pagination.value.currentPage,
      buildQuery()
    );
    if (code === 200) {
      dataList.value = (data.list || []) as RowData<T>[];
      pagination.value.total = data.count || data.total || 0;
    } else {
      message(msg || "获取数据失败", { type: "error" });
    }
  } catch (error) {
    message("获取数据失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const onSearch = async () => {
  loading.value = true;
  pagination.value.currentPage = 1;
  if (props.onSearch) {
    await props.onSearch(buildQuery());
  } else {
    await getListInfo();
  }
  loading.value = false;
};

const resetForm = (formEl: FormRef | undefined) => {
  loading.value = true;
  if (!formEl) return;
  formEl.resetFields();
  form.value = {
    ...props.searchForm?.defaultValues,
    scope: "nonDeleted"
  };
  loading.value = false;
};

const handleCurrentChange = async (val: number) => {
  pagination.value.currentPage = val;
  await getListInfo();
};

const handleDelete = async (row: RowData<T>) => {
  if (props.onDelete) {
    await props.onDelete(row);
  } else if (props.api.delete) {
    await props.api.delete(row.uid);
    message(`删除成功`, { type: "success" });
  }
  emit("rowAction", "delete", row);
  await getListInfo();
};

const handleRestore = async (row: RowData<T>) => {
  if (props.onRestore) {
    await props.onRestore(row);
  } else if (props.api.restore) {
    await props.api.restore(row.uid);
    message(`恢复成功`, { type: "success" });
  }
  emit("rowAction", "restore", row);
  await getListInfo();
};

const handleRefresh = async () => {
  await getListInfo();
  emit("refresh");
};

const handleCustomAction = async (handler: () => void) => {
  handler();
};

// Lifecycle
onMounted(async () => {
  await getListInfo();
});

// Expose
defineExpose({
  refresh: getListInfo,
  getData: () => dataList.value,
  getPagination: () => pagination.value,
  resetSearch: () => resetForm(formRef.value)
});
</script>

<template>
  <div class="crud-page">
    <!-- 搜索表单 -->
    <ReSearchForm
      v-if="searchForm"
      ref="formRef"
      class="m-1"
      :form="form"
      :loading="loading"
      :body-style="{ paddingBottom: '0', overflow: 'auto' }"
      @search="onSearch"
      @reset="resetForm(formRef)"
    >
      <template v-for="field in searchForm.fields" :key="field.prop">
        <el-form-item :label="field.label" :prop="field.prop">
          <!-- 输入框 -->
          <el-input
            v-if="field.type === 'input'"
            :model-value="form[field.prop] as InputModelValue"
            :placeholder="field.placeholder || `请输入${field.label}`"
            clearable
            :style="{ width: field.width || '180px' }"
            v-bind="field.props"
            @update:model-value="val => (form[field.prop] = val)"
          />

          <!-- 选择框 -->
          <el-select
            v-else-if="field.type === 'select'"
            :model-value="form[field.prop] as SelectModelValue"
            :placeholder="field.placeholder || `请选择${field.label}`"
            clearable
            :style="{ width: field.width || '180px' }"
            v-bind="field.props"
            @update:model-value="val => (form[field.prop] = val)"
          >
            <el-option
              v-for="option in field.options"
              :key="String(option.value)"
              :label="option.label"
              :value="option.value"
            />
          </el-select>

          <!-- 日期选择 -->
          <el-date-picker
            v-else-if="field.type === 'date'"
            :model-value="form[field.prop] as DatePickerModelValue"
            type="date"
            :placeholder="field.placeholder || `请选择${field.label}`"
            clearable
            :style="{ width: field.width || '180px' }"
            v-bind="field.props"
            @update:model-value="val => (form[field.prop] = val)"
          />

          <!-- 日期范围选择 -->
          <el-date-picker
            v-else-if="field.type === 'daterange'"
            :model-value="form[field.prop] as DatePickerModelValue"
            type="daterange"
            :placeholder="field.placeholder || `请选择${field.label}`"
            clearable
            :style="{ width: field.width || '280px' }"
            v-bind="field.props"
            @update:model-value="val => (form[field.prop] = val)"
          />

          <!-- 数字输入 -->
          <el-input-number
            v-else-if="field.type === 'number'"
            :model-value="form[field.prop] as NumberModelValue"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :style="{ width: field.width || '180px' }"
            v-bind="field.props"
            @update:model-value="val => (form[field.prop] = val)"
          />
        </el-form-item>
      </template>

      <!-- 范围选择 -->
      <el-form-item v-if="showScope" label="范围：" prop="scope">
        <el-select
          :model-value="form.scope as ScopeModelValue"
          class="w-[180px]!"
          clearable
          @update:model-value="val => (form.scope = val)"
        >
          <el-option
            v-for="option in scopeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <!-- 表格 -->
    <el-card class="m-1">
      <PureTableBar :title="$route.meta.title" @refresh="handleRefresh">
        <template #buttons>
          <!-- 新增按钮 -->
          <el-button
            v-if="actions?.create"
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="emit('rowAction', 'create', null)"
          >
            {{ actions.createText || "新增" }}
          </el-button>

          <!-- 自定义操作按钮 -->
          <el-button
            v-for="(action, index) in actions?.customActions || []"
            :key="index"
            :type="action.type"
            :icon="action.icon ? useRenderIcon(action.icon) : undefined"
            @click="handleCustomAction(action.handler)"
          >
            {{ action.label }}
          </el-button>

          <!-- 导入按钮 -->
          <el-button
            v-if="actions?.import"
            :icon="useRenderIcon(ImportIcon)"
            @click="showImportDialog = true"
          >
            导入
          </el-button>

          <!-- 导出按钮 -->
          <el-button
            v-if="actions?.export"
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
            :columns="columns as TableColumnList"
            border
            :data="dataList"
            showOverflowTooltip
            :pagination="showPagination ? { ...pagination, size } : undefined"
            @page-current-change="handleCurrentChange"
          >
            <template #operation="{ row }">
              <!-- 查看按钮 -->
              <el-button
                v-if="tableOperation?.showView"
                class="reset-margin"
                link
                type="primary"
                @click="emit('rowAction', 'view', row)"
              >
                查看
              </el-button>

              <!-- 自定义操作按钮 -->
              <el-button
                v-for="(action, index) in tableOperation?.customActions || []"
                v-show="!action.show || action.show(row)"
                :key="index"
                class="reset-margin"
                link
                :type="action.type"
                :icon="action.icon ? useRenderIcon(action.icon) : undefined"
                @click="action.handler(row)"
              >
                {{ action.label }}
              </el-button>

              <!-- 编辑按钮 -->
              <el-button
                v-if="tableOperation?.showEdit"
                class="reset-margin"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="emit('rowAction', 'edit', row)"
              >
                修改
              </el-button>

              <!-- 删除按钮 -->
              <DeleteButton
                v-if="tableOperation?.showDelete && !row.deleteAt"
                :show-icon="false"
                :title="`是否确认删除这条数据`"
                @confirm="handleDelete(row)"
              />

              <!-- 恢复按钮 -->
              <el-button
                v-if="
                  (enableRestore || tableOperation?.showRestore) && row.deleteAt
                "
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

    <!-- 导入导出对话框 -->
    <ImportDialog
      v-if="actions?.import"
      v-model:visible="showImportDialog"
      :type="actions.importType || 'default'"
      :title="actions.importTitle || '导入数据'"
      @success="getListInfo"
    />
    <ExportDialog
      v-if="actions?.export"
      v-model:visible="showExportDialog"
      :type="actions.exportType || 'default'"
      :title="actions.exportTitle || '导出数据'"
    />
  </div>
</template>

<style scoped>
.crud-page {
  width: 100%;
  height: 100%;
}

.reset-margin {
  margin: 0 4px;
}
</style>

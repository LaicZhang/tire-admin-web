<script setup lang="ts">
import { ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import SaveIcon from "~icons/ep/check";
import ResetIcon from "~icons/ep/refresh-left";
import UpIcon from "~icons/ep/arrow-up";
import DownIcon from "~icons/ep/arrow-down";
import { message } from "@/utils";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { PureTableBar } from "@/components/RePureTableBar";
import type { ColumnSetting, ModuleOption } from "./types";
import {
  clearColumnSettingsApi,
  getColumnSettingsApi,
  saveColumnSettingsApi,
  type ColumnSettings
} from "@/api/data/column-settings";
import { useCrud } from "@/composables";

defineOptions({
  name: "ColumnSettings"
});

const currentModule = ref("tire");
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);

// 模块选项
const moduleOptions: ModuleOption[] = [
  { label: "商品", value: "tire" },
  { label: "客户", value: "customer" },
  { label: "供应商", value: "provider" },
  { label: "仓库", value: "repo" },
  { label: "员工", value: "employee" },
  { label: "订单", value: "order" },
  { label: "库存", value: "stock" }
];

// 表格列定义
const columns = [
  { label: "序号", type: "index", width: 60 },
  { label: "字段名", prop: "field", width: 120 },
  { label: "列名称", prop: "label", width: 120 },
  { label: "别名", prop: "alias", slot: "alias" },
  { label: "是否显示", prop: "visible", slot: "visible", width: 100 },
  { label: "排序", prop: "sortOrder", slot: "sortOrder", width: 140 },
  {
    label: "操作",
    prop: "operation",
    slot: "operation",
    width: 100,
    fixed: "right"
  }
];

// 默认列配置
const defaultColumns: Record<string, ColumnSetting[]> = {
  tire: [
    {
      id: 1,
      uid: "1",
      module: "tire",
      field: "id",
      label: "ID",
      visible: true,
      sortOrder: 1
    },
    {
      id: 2,
      uid: "2",
      module: "tire",
      field: "name",
      label: "名称",
      visible: true,
      sortOrder: 2
    },
    {
      id: 3,
      uid: "3",
      module: "tire",
      field: "group",
      label: "分组",
      visible: true,
      sortOrder: 3
    },
    {
      id: 4,
      uid: "4",
      module: "tire",
      field: "brand",
      label: "品牌",
      visible: true,
      sortOrder: 4
    },
    {
      id: 5,
      uid: "5",
      module: "tire",
      field: "pattern",
      label: "花纹",
      visible: true,
      sortOrder: 5
    },
    {
      id: 6,
      uid: "6",
      module: "tire",
      field: "purchasePrice",
      label: "进价",
      visible: true,
      sortOrder: 6
    },
    {
      id: 7,
      uid: "7",
      module: "tire",
      field: "salePrice",
      label: "售价",
      visible: true,
      sortOrder: 7
    },
    {
      id: 8,
      uid: "8",
      module: "tire",
      field: "desc",
      label: "备注",
      visible: true,
      sortOrder: 8
    }
  ],
  customer: [
    {
      id: 1,
      uid: "1",
      module: "customer",
      field: "id",
      label: "ID",
      visible: true,
      sortOrder: 1
    },
    {
      id: 2,
      uid: "2",
      module: "customer",
      field: "name",
      label: "名称",
      visible: true,
      sortOrder: 2
    },
    {
      id: 3,
      uid: "3",
      module: "customer",
      field: "phone",
      label: "电话",
      visible: true,
      sortOrder: 3
    },
    {
      id: 4,
      uid: "4",
      module: "customer",
      field: "address",
      label: "地址",
      visible: true,
      sortOrder: 4
    },
    {
      id: 5,
      uid: "5",
      module: "customer",
      field: "level",
      label: "等级",
      visible: true,
      sortOrder: 5
    }
  ],
  provider: [
    {
      id: 1,
      uid: "1",
      module: "provider",
      field: "id",
      label: "ID",
      visible: true,
      sortOrder: 1
    },
    {
      id: 2,
      uid: "2",
      module: "provider",
      field: "name",
      label: "名称",
      visible: true,
      sortOrder: 2
    },
    {
      id: 3,
      uid: "3",
      module: "provider",
      field: "contact",
      label: "联系人",
      visible: true,
      sortOrder: 3
    },
    {
      id: 4,
      uid: "4",
      module: "provider",
      field: "phone",
      label: "电话",
      visible: true,
      sortOrder: 4
    }
  ]
};

const {
  loading,
  dataList: columnList,
  fetchData: loadColumnSettings
} = useCrud<
  ColumnSetting,
  ColumnSettings | null,
  { module: string; page: number; pageSize: number }
>({
  api: ({ module }) => getColumnSettingsApi(module),
  params: () => ({ module: currentModule.value }),
  transform: (stored: ColumnSettings | null) => {
    const list = Array.isArray(stored)
      ? (stored as ColumnSetting[])
      : defaultColumns[currentModule.value] || [];
    return { list, total: list.length };
  },
  immediate: true
});

// 保存配置
const handleSave = () => {
  saveColumnSettingsApi(currentModule.value, columnList.value).then(() =>
    message("保存成功", { type: "success" })
  );
};

// 恢复默认
const handleResetDefault = () => {
  columnList.value = defaultColumns[currentModule.value] || [];
  clearColumnSettingsApi(currentModule.value).then(() =>
    message("已恢复默认设置", { type: "success" })
  );
};

// 上移
const handleMoveUp = (index: number) => {
  if (index === 0) return;
  const temp = columnList.value[index];
  columnList.value[index] = columnList.value[index - 1];
  columnList.value[index - 1] = temp;
  updateSortOrder();
};

// 下移
const handleMoveDown = (index: number) => {
  if (index === columnList.value.length - 1) return;
  const temp = columnList.value[index];
  columnList.value[index] = columnList.value[index + 1];
  columnList.value[index + 1] = temp;
  updateSortOrder();
};

// 更新排序顺序
const updateSortOrder = () => {
  columnList.value.forEach((col, idx) => {
    col.sortOrder = idx + 1;
  });
};

// 模块变更
const handleModuleChange = () => {
  loadColumnSettings();
};
</script>

<template>
  <div class="main">
    <ReSearchForm ref="searchFormRef" :loading="loading">
      <el-form-item label="模块选择">
        <el-select
          v-model="currentModule"
          placeholder="请选择模块"
          class="w-[200px]"
          @change="handleModuleChange"
        >
          <el-option
            v-for="item in moduleOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <template #actions>
        <el-button
          type="primary"
          :icon="useRenderIcon(SaveIcon)"
          @click="handleSave"
        >
          保存设置
        </el-button>
        <el-button :icon="useRenderIcon(ResetIcon)" @click="handleResetDefault">
          恢复默认
        </el-button>
      </template>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar title="基础资料列设置" @refresh="loadColumnSettings">
        <template v-slot="{ size }">
          <pure-table
            row-key="uid"
            adaptive
            :size
            :columns
            border
            :data="columnList"
            :loading="loading"
            showOverflowTooltip
          >
            <template #alias="{ row }">
              <el-input
                v-model="row.alias"
                placeholder="输入别名"
                clearable
                size="small"
              />
            </template>
            <template #visible="{ row }">
              <el-switch v-model="row.visible" />
            </template>
            <template #sortOrder="{ row, $index }">
              <el-button
                link
                type="primary"
                :disabled="$index === 0"
                @click="handleMoveUp($index)"
              >
                <IconifyIconOffline :icon="UpIcon" />
              </el-button>
              <el-button
                link
                type="primary"
                :disabled="$index === columnList.length - 1"
                @click="handleMoveDown($index)"
              >
                <IconifyIconOffline :icon="DownIcon" />
              </el-button>
              <span class="ml-2 text-gray-400">{{ row.sortOrder }}</span>
            </template>
            <template #operation="{ row }">
              <el-button
                link
                type="primary"
                size="small"
                @click="row.visible = !row.visible"
              >
                {{ row.visible ? "隐藏" : "显示" }}
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

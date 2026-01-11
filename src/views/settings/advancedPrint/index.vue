<script setup lang="tsx">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";
import AddFill from "~icons/ri/add-circle-line";
import Check from "~icons/ep/check";
import DocumentCopy from "~icons/ep/document-copy";
import Download from "~icons/ep/download";
import Upload from "~icons/ep/upload";
import { PureTableBar } from "@/components/RePureTableBar";
import { message } from "@/utils";
import { downloadBlob, generateFilenameWithTimestamp } from "@/utils/download";
import { ElMessageBox } from "element-plus";
import StatusTag from "@/components/StatusTag/index.vue";
import {
  getPrintTemplatesApi,
  setDefaultPrintTemplateApi,
  copyPrintTemplateApi,
  deletePrintTemplateApi,
  exportPrintTemplatesApi,
  importPrintTemplatesApi
} from "@/api/setting";
import type { AdvancedPrintTemplate } from "./types";

defineOptions({
  name: "AdvancedPrint"
});

const router = useRouter();
const loading = ref(false);
const templateList = ref<AdvancedPrintTemplate[]>([]);
const activeDocType = ref("sales_out");
const selectedRows = ref<AdvancedPrintTemplate[]>([]);

const documentTypes = [
  { value: "purchase_order", label: "采购订单" },
  { value: "purchase_in", label: "采购入库单" },
  { value: "purchase_return", label: "采购退货单" },
  { value: "sales_order", label: "销售订单" },
  { value: "sales_out", label: "销售出库单" },
  { value: "sales_return", label: "销售退货单" },
  { value: "transfer", label: "调拨单" },
  { value: "inventory_check", label: "盘点单" },
  { value: "other_in", label: "其他入库单" },
  { value: "other_out", label: "其他出库单" },
  { value: "receive", label: "收款单" },
  { value: "pay", label: "付款单" }
];

const columns: TableColumnList = [
  {
    type: "selection",
    width: 55,
    align: "center"
  },
  {
    label: "模板名称",
    prop: "name",
    minWidth: 180
  },
  {
    label: "纸张大小",
    prop: "paperSize",
    minWidth: 100
  },
  {
    label: "纸张方向",
    prop: "paperOrientation",
    minWidth: 100,
    cellRenderer: ({ row }) => (
      <span>{row.paperOrientation === "portrait" ? "纵向" : "横向"}</span>
    )
  },
  {
    label: "是否默认",
    prop: "isDefault",
    minWidth: 100,
    cellRenderer: ({ row }) => (
      <StatusTag
        status={row.isDefault}
        statusMap={{
          true: { label: "默认", type: "success" },
          false: { label: "非默认", type: "info" }
        }}
      />
    )
  },
  {
    label: "更新时间",
    prop: "updateTime",
    minWidth: 160
  },
  {
    label: "操作",
    width: 280,
    fixed: "right",
    slot: "operation"
  }
];

const loadData = async () => {
  loading.value = true;
  try {
    const { code, data } = await getPrintTemplatesApi(activeDocType.value);
    if (code === 200 && data) {
      templateList.value = data as AdvancedPrintTemplate[];
    }
  } catch {
    message("加载模板列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const filterByDocType = (docType: string) => {
  activeDocType.value = docType;
  loadData();
};

const handleSelectionChange = (rows: AdvancedPrintTemplate[]) => {
  selectedRows.value = rows;
};

const addTemplate = () => {
  router.push(`/settings/printDesigner/${activeDocType.value}/new`);
};

const setDefault = async (row: AdvancedPrintTemplate) => {
  if (row.isDefault) return;
  loading.value = true;
  try {
    const { code } = await setDefaultPrintTemplateApi(row.uid);
    if (code === 200) {
      templateList.value.forEach(t => {
        if (t.documentType === row.documentType) {
          t.isDefault = t.uid === row.uid;
        }
      });
      message("设置成功", { type: "success" });
    } else {
      message("设置失败", { type: "error" });
    }
  } catch {
    message("设置失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const editTemplate = (row: AdvancedPrintTemplate) => {
  router.push(`/settings/printDesigner/${row.documentType}/${row.uid}`);
};

const copyTemplate = async (row: AdvancedPrintTemplate) => {
  try {
    const { value } = await ElMessageBox.prompt(
      "请输入新模板名称",
      "复制模板",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValue: `${row.name} - 副本`
      }
    );
    loading.value = true;
    try {
      const { code } = await copyPrintTemplateApi(row.uid, value);
      if (code === 200) {
        message("复制成功", { type: "success" });
        loadData();
      } else {
        message("复制失败", { type: "error" });
      }
    } catch {
      message("复制失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  } catch {
    // cancelled
  }
};

const deleteTemplate = async (row: AdvancedPrintTemplate) => {
  if (row.isDefault) {
    message("默认模板不能删除", { type: "warning" });
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除模板 "${row.name}" 吗？`,
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    loading.value = true;
    try {
      const { code } = await deletePrintTemplateApi(row.uid);
      if (code === 200) {
        message("删除成功", { type: "success" });
        loadData();
      } else {
        message("删除失败", { type: "error" });
      }
    } catch {
      message("删除失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  } catch {
    // cancelled
  }
};

const exportTemplates = async () => {
  if (selectedRows.value.length === 0) {
    message("请先选择要导出的模板", { type: "warning" });
    return;
  }
  loading.value = true;
  try {
    const blob = await exportPrintTemplatesApi(
      selectedRows.value.map(row => row.uid)
    );
    downloadBlob(
      blob,
      generateFilenameWithTimestamp(
        `print_templates_${activeDocType.value}`,
        "json"
      ),
      {
        showMessage: true
      }
    );
  } catch {
    message("导出失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const importTemplates = async () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;

    loading.value = true;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { code, msg } = await importPrintTemplatesApi(formData);
      if (code === 200) {
        message("导入成功", { type: "success" });
        loadData();
      } else {
        message(msg || "导入失败", { type: "error" });
      }
    } catch {
      message("导入失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  };
  input.click();
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="main">
    <div class="flex gap-4">
      <!-- 左侧单据类型列表 -->
      <div class="w-48 bg-white p-4 rounded-md shrink-0">
        <div class="text-sm font-medium text-gray-600 mb-3">单据类型</div>
        <el-menu :default-active="activeDocType" @select="filterByDocType">
          <el-menu-item
            v-for="item in documentTypes"
            :key="item.value"
            :index="item.value"
          >
            {{ item.label }}
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 右侧模板列表 -->
      <div class="flex-1 bg-white p-4 rounded-md">
        <PureTableBar title="高级打印模板" @refresh="loadData">
          <template #buttons>
            <el-button
              type="primary"
              :icon="useRenderIcon(AddFill)"
              @click="addTemplate"
            >
              新增模板
            </el-button>
            <el-button
              :icon="useRenderIcon(Download)"
              :disabled="selectedRows.length === 0"
              @click="exportTemplates"
            >
              导出
            </el-button>
            <el-button :icon="useRenderIcon(Upload)" @click="importTemplates">
              导入
            </el-button>
          </template>
          <template v-slot="{ size }">
            <pure-table
              border
              adaptive
              row-key="uid"
              alignWhole="center"
              showOverflowTooltip
              :loading="loading"
              :data="templateList"
              :columns="columns"
              @selection-change="handleSelectionChange"
            >
              <template #operation="{ row }">
                <el-button
                  class="reset-margin"
                  link
                  type="primary"
                  :size="size"
                  :icon="useRenderIcon(Check)"
                  :disabled="row.isDefault"
                  @click="setDefault(row)"
                >
                  设为默认
                </el-button>
                <el-button
                  class="reset-margin"
                  link
                  type="primary"
                  :size="size"
                  :icon="useRenderIcon(EditPen)"
                  @click="editTemplate(row)"
                >
                  编辑
                </el-button>
                <el-button
                  class="reset-margin"
                  link
                  type="primary"
                  :size="size"
                  :icon="useRenderIcon(DocumentCopy)"
                  @click="copyTemplate(row)"
                >
                  复制
                </el-button>
                <el-button
                  class="reset-margin"
                  link
                  type="danger"
                  :size="size"
                  :icon="useRenderIcon(Delete)"
                  :disabled="row.isDefault"
                  @click="deleteTemplate(row)"
                >
                  删除
                </el-button>
              </template>
            </pure-table>
          </template>
        </PureTableBar>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 20px;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item) {
  height: 40px;
  font-size: 14px;
  line-height: 40px;
}
</style>

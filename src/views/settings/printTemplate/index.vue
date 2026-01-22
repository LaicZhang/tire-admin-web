<script setup lang="tsx">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";
import Check from "~icons/ep/check";
import DocumentCopy from "~icons/ep/document-copy";
import { PureTableBar } from "@/components/RePureTableBar";
import { message } from "@/utils";
import { ElMessageBox } from "element-plus";
import StatusTag from "@/components/StatusTag/index.vue";
import {
  getPrintTemplatesApi,
  setDefaultTemplateApi,
  copyTemplateApi,
  deleteTemplateApi
} from "@/api/setting";
import type { PrintTemplate, DocumentType } from "./types";

defineOptions({
  name: "PrintTemplate"
});

const router = useRouter();
const loading = ref(false);
const templateList = ref<PrintTemplate[]>([]);
const activeDocType = ref("purchase_order");

const documentTypes: DocumentType[] = [
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
    label: "模板名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "单据类型",
    prop: "documentTypeName",
    minWidth: 120
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
      templateList.value = data as PrintTemplate[];
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

const setDefault = async (row: PrintTemplate) => {
  if (row.isDefault) return;
  try {
    const { code } = await setDefaultTemplateApi(row.uid);
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
  }
};

const editTemplate = (row: PrintTemplate) => {
  router.push({
    path: `/settings/print-designer/${activeDocType.value}/${row.uid}`
  });
};

const copyTemplate = async (row: PrintTemplate) => {
  try {
    const { value } = await ElMessageBox.prompt(
      "请输入新模板名称",
      "复制模板",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValue: `${row.name} - 副本`,
        inputValidator: val => {
          if (!val || !val.trim()) {
            return "模板名称不能为空";
          }
          return true;
        }
      }
    );
    const { code } = await copyTemplateApi(row.uid, value);
    if (code === 200) {
      message("复制成功", { type: "success" });
      loadData();
    } else {
      message("复制失败", { type: "error" });
    }
  } catch {
    // cancelled or error
  }
};

const deleteTemplate = async (row: PrintTemplate) => {
  if (row.isSystem) {
    message("系统模板不能删除", { type: "warning" });
    return;
  }
  if (row.isDefault) {
    message("默认模板不能删除", { type: "warning" });
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除模板 "${row.name}" 吗？此操作不可恢复。`,
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    const { code } = await deleteTemplateApi(row.uid);
    if (code === 200) {
      message("删除成功", { type: "success" });
      loadData();
    } else {
      message("删除失败", { type: "error" });
    }
  } catch {
    // cancelled or error
  }
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="main">
    <div class="flex flex-col md:flex-row gap-4">
      <!-- 左侧单据类型列表 -->
      <div class="w-full md:w-48 bg-white p-4 rounded-md shrink-0">
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
      <div class="flex-1 bg-white p-4 rounded-md overflow-hidden">
        <PureTableBar title="打印模板" @refresh="loadData">
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
                  :disabled="row.isSystem || row.isDefault"
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
.page-container {
  @extend .page-container;
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

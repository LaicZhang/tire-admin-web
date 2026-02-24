<script setup lang="tsx">
import { onMounted, ref } from "vue";
import { columns } from "./columns";
import { useRouter } from "vue-router";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";
import Check from "~icons/ep/check";
import DocumentCopy from "~icons/ep/document-copy";
import { PureTableBar } from "@/components/RePureTableBar";
import { message } from "@/utils";
import { ElMessageBox } from "element-plus";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import StatusTag from "@/components/StatusTag/index.vue";
import {
  getPrintTemplatesApi,
  setDefaultTemplateApi,
  copyTemplateApi,
  deleteTemplateApi
} from "@/api/setting";
import type { PrintTemplate } from "./types";
import { documentTypes } from "../shared/documentTypes";

defineOptions({
  name: "PrintTemplate"
});

const router = useRouter();
const loading = ref(false);
const { confirm } = useConfirmDialog();
const templateList = ref<PrintTemplate[]>([]);
const activeDocType = ref("purchase_order");

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
    const res = await ElMessageBox.prompt("请输入新模板名称", "复制模板", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: `${row.name} - 副本`,
      inputValidator: val => {
        if (!val || !val.trim()) {
          return "模板名称不能为空";
        }
        return true;
      }
    });
    if (typeof res === "string") return;
    const { value } = res;
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
  const ok = await confirm(
    `确定要删除模板 "${row.name}" 吗？此操作不可恢复。`,
    "删除确认",
    {
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
      type: "warning"
    }
  );
  if (!ok) return;

  try {
    const { code } = await deleteTemplateApi(row.uid);
    if (code === 200) {
      message("删除成功", { type: "success" });
      loadData();
    } else {
      message("删除失败", { type: "error" });
    }
  } catch {
    message("删除失败", { type: "error" });
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

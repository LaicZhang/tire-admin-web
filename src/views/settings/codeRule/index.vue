<script setup lang="tsx">
import { onMounted, ref, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";
import AddFill from "~icons/ri/add-circle-line";
import Check from "~icons/ep/check";
import Close from "~icons/ep/close";
import "plus-pro-components/es/components/search/style/css";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils";
import { ElMessageBox } from "element-plus";
import StatusTag from "@/components/StatusTag/index.vue";
import { ENABLE_STATUS_MAP } from "@/components/StatusTag/types";
import {
  getCodeRulesApi,
  saveCodeRuleApi,
  updateCodeRuleApi,
  enableCodeRuleApi,
  disableCodeRuleApi,
  deleteCodeRuleApi,
  batchDeleteCodeRulesApi
} from "@/api/setting";
import CodeRuleForm from "./form.vue";
import type { CodeRule } from "./types";

defineOptions({
  name: "CodeRule"
});

const loading = ref(false);
const activeTab = ref("document");
const documentRules = ref<CodeRule[]>([]);
const basicRules = ref<CodeRule[]>([]);
const formRef = ref();
const selectedRows = ref<CodeRule[]>([]);

const targetTypeNameMap = {
  document: "单据",
  basic: "基础资料"
} as const;

const resetTypeNameMap = {
  daily: "当日从起始值开始",
  monthly: "当月从起始值开始",
  quarterly: "当季从起始值开始",
  yearly: "当年从起始值开始"
} as const;

const targetNameMap: Record<string, string> = {
  purchase_order: "采购订单",
  purchase_in: "采购入库单",
  purchase_return: "采购退货单",
  sales_order: "销售订单",
  sales_out: "销售出库单",
  sales_return: "销售退货单",
  transfer: "调拨单",
  inventory_check: "盘点单",
  product: "商品",
  customer: "客户",
  supplier: "供应商",
  warehouse: "仓库"
};

const normalizeCodeRule = (raw: Record<string, unknown>) => {
  const targetType = (raw.targetType as CodeRule["targetType"]) || "document";
  const targetCode = String(raw.targetCode ?? "");
  const resetType = (raw.resetType as CodeRule["resetType"]) || "daily";

  const uid = String(raw.uid ?? raw.id ?? "");
  const name = String(raw.name ?? "");

  return {
    uid,
    name,
    targetType,
    targetTypeName: String(raw.targetTypeName ?? targetTypeNameMap[targetType]),
    targetCode,
    targetName: String(
      raw.targetName ?? targetNameMap[targetCode] ?? targetCode
    ),
    prefix: String(raw.prefix ?? ""),
    dateFormat: String(raw.dateFormat ?? ""),
    serialDigits: Number(raw.serialDigits ?? 4),
    serialStart: Number(raw.serialStart ?? 1),
    resetType,
    resetTypeName: String(raw.resetTypeName ?? resetTypeNameMap[resetType]),
    autoFillGap: Boolean(raw.autoFillGap ?? false),
    allowManualEdit: Boolean(raw.allowManualEdit ?? false),
    resetOnDateChange: Boolean(raw.resetOnDateChange ?? false),
    isActive: Boolean(raw.isActive ?? false),
    isDefault: Boolean(raw.isDefault ?? false),
    createTime: String(raw.createTime ?? ""),
    updateTime: String(raw.updateTime ?? "")
  } satisfies CodeRule;
};

const documentColumns: TableColumnList = [
  {
    type: "selection",
    width: 55,
    align: "center"
  },
  {
    label: "规则名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "适用单据",
    prop: "targetName",
    minWidth: 120
  },
  {
    label: "编码格式",
    minWidth: 180,
    cellRenderer: ({ row }) => (
      <span class="font-mono text-sm">
        {`${row.prefix}${row.dateFormat ? `[${row.dateFormat}]` : ""}[${String(row.serialStart).padStart(row.serialDigits, "0")}]`}
      </span>
    )
  },
  {
    label: "流水号清零",
    prop: "resetTypeName",
    minWidth: 120
  },
  {
    label: "状态",
    prop: "isActive",
    minWidth: 80,
    cellRenderer: ({ row }) => (
      <StatusTag
        status={row.isActive}
        statusMap={{
          true: { label: "使用中", type: "success" },
          false: { label: "未启用", type: "info" }
        }}
      />
    )
  },
  {
    label: "操作",
    width: 250,
    fixed: "right",
    slot: "operation"
  }
];

const loadData = async () => {
  loading.value = true;
  try {
    const { code, data } = await getCodeRulesApi();
    if (code !== 200) {
      message("加载编码规则失败", { type: "error" });
      return;
    }

    const list = Array.isArray(data)
      ? data
      : (data as { list?: unknown })?.list;
    const rules = Array.isArray(list)
      ? list.map(item => normalizeCodeRule(item as Record<string, unknown>))
      : [];

    documentRules.value = rules.filter(r => r.targetType === "document");
    basicRules.value = rules.filter(r => r.targetType === "basic");
    selectedRows.value = [];
  } catch {
    message("加载编码规则失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleSelectionChange = (rows: CodeRule[]) => {
  selectedRows.value = rows;
};

const openDialog = (title = "新增", row?: CodeRule) => {
  addDialog({
    title: `${title}编码规则`,
    props: {
      formInline: {
        uid: row?.uid,
        name: row?.name ?? "",
        targetType:
          row?.targetType ?? (activeTab.value as "document" | "basic"),
        targetCode: row?.targetCode ?? "",
        prefix: row?.prefix ?? "",
        dateFormat: row?.dateFormat ?? "YYYYMMDD",
        serialDigits: row?.serialDigits ?? 4,
        serialStart: row?.serialStart ?? 1,
        resetType: row?.resetType ?? "daily",
        autoFillGap: row?.autoFillGap ?? false,
        allowManualEdit: row?.allowManualEdit ?? false,
        resetOnDateChange: row?.resetOnDateChange ?? false
      }
    },
    width: "600px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(CodeRuleForm, {
        ref: formRef,
        formInline: options.props!.formInline
      }),
    beforeSure: (done, { options }) => {
      const FormRef = formRef.value.getRef();
      FormRef.validate((valid: boolean) => {
        if (!valid) return;

        const formInline = options.props!.formInline as Partial<CodeRule>;
        const payload = {
          name: formInline.name,
          targetType: formInline.targetType,
          targetCode: formInline.targetCode,
          prefix: formInline.prefix,
          dateFormat: formInline.dateFormat,
          serialDigits: formInline.serialDigits,
          serialStart: formInline.serialStart,
          resetType: formInline.resetType,
          autoFillGap: formInline.autoFillGap,
          allowManualEdit: formInline.allowManualEdit,
          resetOnDateChange: formInline.resetOnDateChange
        } satisfies Record<string, unknown>;

        const request = formInline.uid
          ? updateCodeRuleApi(formInline.uid, payload)
          : saveCodeRuleApi(payload);

        request
          .then(({ code, msg }) => {
            if (code !== 200) {
              message(msg || "操作失败", { type: "error" });
              return;
            }
            message("操作成功", { type: "success" });
            done();
            loadData();
          })
          .catch(() => {
            message("操作失败", { type: "error" });
          });
      });
    }
  });
};

const enableRule = async (row: CodeRule) => {
  if (!row.uid) {
    message("缺少规则ID", { type: "warning" });
    return;
  }
  try {
    const { code, msg } = await enableCodeRuleApi(row.uid);
    if (code === 200) {
      message("启用成功", { type: "success" });
      loadData();
    } else {
      message(msg || "启用失败", { type: "error" });
    }
  } catch {
    message("启用失败", { type: "error" });
  }
};

const disableRule = async (row: CodeRule) => {
  if (row.isDefault) {
    message("默认规则不能停用", { type: "warning" });
    return;
  }
  if (!row.uid) {
    message("缺少规则ID", { type: "warning" });
    return;
  }
  try {
    const { code, msg } = await disableCodeRuleApi(row.uid);
    if (code === 200) {
      message("停用成功", { type: "success" });
      loadData();
    } else {
      message(msg || "停用失败", { type: "error" });
    }
  } catch {
    message("停用失败", { type: "error" });
  }
};

const deleteRule = async (row: CodeRule) => {
  if (row.isDefault) {
    message("默认规则不能删除", { type: "warning" });
    return;
  }
  if (row.isActive) {
    message("使用中的规则不能删除", { type: "warning" });
    return;
  }
  if (!row.uid) {
    message("缺少规则ID", { type: "warning" });
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除规则 "${row.name}" 吗？`,
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    const { code, msg } = await deleteCodeRuleApi(row.uid);
    if (code === 200) {
      message("删除成功", { type: "success" });
      loadData();
    } else {
      message(msg || "删除失败", { type: "error" });
    }
  } catch {
    // cancelled
  }
};

const batchDelete = async () => {
  if (selectedRows.value.length === 0) {
    message("请先选择要删除的规则", { type: "warning" });
    return;
  }
  const canDelete = selectedRows.value.filter(r => !r.isDefault && !r.isActive);
  if (canDelete.length === 0) {
    message("选中的规则都不能删除", { type: "warning" });
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要批量删除选中的 ${canDelete.length} 个规则吗？`,
      "批量删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    const { code, msg } = await batchDeleteCodeRulesApi(
      canDelete.map(r => r.uid)
    );
    if (code === 200) {
      message("删除成功", { type: "success" });
      loadData();
    } else {
      message(msg || "删除失败", { type: "error" });
    }
  } catch {
    // cancelled
  }
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="main">
    <div class="bg-white p-4 rounded-md">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="单据编码规则" name="document">
          <PureTableBar title="单据编码规则" @refresh="loadData">
            <template #buttons>
              <el-button
                type="primary"
                :icon="useRenderIcon(AddFill)"
                @click="openDialog()"
              >
                新增规则
              </el-button>
              <el-button
                type="danger"
                :icon="useRenderIcon(Delete)"
                :disabled="selectedRows.length === 0"
                @click="batchDelete"
              >
                批量删除
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
                :data="documentRules"
                :columns="documentColumns"
                @selection-change="handleSelectionChange"
              >
                <template #operation="{ row }">
                  <el-button
                    v-if="!row.isActive"
                    class="reset-margin"
                    link
                    type="success"
                    :size="size"
                    :icon="useRenderIcon(Check)"
                    @click="enableRule(row)"
                  >
                    启用
                  </el-button>
                  <el-button
                    v-else
                    class="reset-margin"
                    link
                    type="warning"
                    :size="size"
                    :icon="useRenderIcon(Close)"
                    :disabled="row.isDefault"
                    @click="disableRule(row)"
                  >
                    停用
                  </el-button>
                  <el-button
                    class="reset-margin"
                    link
                    type="primary"
                    :size="size"
                    :icon="useRenderIcon(EditPen)"
                    @click="openDialog('修改', row)"
                  >
                    编辑
                  </el-button>
                  <el-button
                    class="reset-margin"
                    link
                    type="danger"
                    :size="size"
                    :icon="useRenderIcon(Delete)"
                    :disabled="row.isDefault || row.isActive"
                    @click="deleteRule(row)"
                  >
                    删除
                  </el-button>
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </el-tab-pane>

        <el-tab-pane label="基础资料编码规则" name="basic">
          <PureTableBar title="基础资料编码规则" @refresh="loadData">
            <template #buttons>
              <el-button
                type="primary"
                :icon="useRenderIcon(AddFill)"
                @click="openDialog()"
              >
                新增规则
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
                :data="basicRules"
                :columns="documentColumns"
              >
                <template #operation="{ row }">
                  <el-button
                    v-if="!row.isActive"
                    class="reset-margin"
                    link
                    type="success"
                    :size="size"
                    :icon="useRenderIcon(Check)"
                    @click="enableRule(row)"
                  >
                    启用
                  </el-button>
                  <el-button
                    v-else
                    class="reset-margin"
                    link
                    type="warning"
                    :size="size"
                    :icon="useRenderIcon(Close)"
                    :disabled="row.isDefault"
                    @click="disableRule(row)"
                  >
                    停用
                  </el-button>
                  <el-button
                    class="reset-margin"
                    link
                    type="primary"
                    :size="size"
                    :icon="useRenderIcon(EditPen)"
                    @click="openDialog('修改', row)"
                  >
                    编辑
                  </el-button>
                  <el-button
                    class="reset-margin"
                    link
                    type="danger"
                    :size="size"
                    :icon="useRenderIcon(Delete)"
                    :disabled="row.isDefault || row.isActive"
                    @click="deleteRule(row)"
                  >
                    删除
                  </el-button>
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 20px;
}
</style>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import dayjs from "dayjs";
import {
  createReportSubscriptionApi,
  deleteReportSubscriptionApi,
  exportReportApi,
  getReportSubscriptionsApi,
  updateReportSubscriptionApi,
  type CreateReportSubscriptionPayload,
  type ReportSubscription,
  type ReportSubscriptionFrequency,
  type ReportSubscriptionReportType
} from "@/api/analysis";
import {
  downloadBlob,
  generateFilenameWithTimestamp,
  handleApiError,
  message
} from "@/utils";
import { ElMessageBox } from "element-plus";

defineOptions({
  name: "AnalysisReportSubscriptions"
});

const REPORT_TYPE_OPTIONS: Array<{
  label: string;
  value: ReportSubscriptionReportType;
}> = [
  { label: "销售汇总", value: "sales_summary" },
  { label: "采购汇总", value: "purchase_summary" },
  { label: "库存汇总", value: "inventory_summary" }
];

const FREQUENCY_OPTIONS: Array<{
  label: string;
  value: ReportSubscriptionFrequency;
}> = [
  { label: "每日", value: "daily" },
  { label: "每周", value: "weekly" },
  { label: "每月", value: "monthly" }
];

const CHANNEL_OPTIONS = [
  { label: "邮件", value: "email" },
  { label: "短信", value: "sms" }
];

const loading = ref(false);
const exporting = ref(false);
const saving = ref(false);
const list = ref<ReportSubscription[]>([]);
const dialogVisible = ref(false);
const editingUid = ref<string | null>(null);

const filters = reactive({
  reportType: "" as string,
  status: "" as "" | "true" | "false"
});

const exportRange = ref<[string, string] | null>([
  dayjs().subtract(29, "day").format("YYYY-MM-DD"),
  dayjs().format("YYYY-MM-DD")
]);
const exportFormat = ref<"excel" | "pdf">("excel");

const form = reactive({
  name: "",
  reportType: "sales_summary" as ReportSubscriptionReportType,
  frequency: "daily" as ReportSubscriptionFrequency,
  channels: ["email"] as string[],
  recipientsText: "",
  status: true
});

const dialogTitle = computed(() =>
  editingUid.value ? "编辑报表订阅" : "新建报表订阅"
);

const reportTypeLabel = (value: string) =>
  REPORT_TYPE_OPTIONS.find(item => item.value === value)?.label ?? value;

const frequencyLabel = (value: string) =>
  FREQUENCY_OPTIONS.find(item => item.value === value)?.label ?? value;

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : value;
}

function resetForm() {
  form.name = "";
  form.reportType = "sales_summary";
  form.frequency = "daily";
  form.channels = ["email"];
  form.recipientsText = "";
  form.status = true;
  editingUid.value = null;
}

function openCreate() {
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row: ReportSubscription) {
  editingUid.value = row.uid;
  form.name = row.name;
  form.reportType = (row.reportType ||
    "sales_summary") as ReportSubscriptionReportType;
  form.frequency = (row.frequency || "daily") as ReportSubscriptionFrequency;
  form.channels = Array.isArray(row.channels) ? [...row.channels] : ["email"];
  form.recipientsText = Array.isArray(row.recipients)
    ? row.recipients.join("\n")
    : "";
  form.status = row.status !== false;
  dialogVisible.value = true;
}

function parseRecipients(text: string): string[] {
  return text
    .split(/[\n,;，；\s]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

async function loadList() {
  loading.value = true;
  try {
    const params: { reportType?: string; status?: boolean } = {};
    if (filters.reportType) params.reportType = filters.reportType;
    if (filters.status === "true") params.status = true;
    if (filters.status === "false") params.status = false;

    const { code, data } = await getReportSubscriptionsApi(params);
    if (code !== 200) {
      message("加载订阅列表失败", { type: "error" });
      list.value = [];
      return;
    }
    list.value = Array.isArray(data) ? data : [];
  } catch (error) {
    handleApiError(error, "加载订阅列表失败");
    list.value = [];
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  const name = form.name.trim();
  const recipients = parseRecipients(form.recipientsText);
  if (!name) {
    message("请填写订阅名称", { type: "warning" });
    return;
  }
  if (!form.channels.length) {
    message("请至少选择一个推送渠道", { type: "warning" });
    return;
  }
  if (!recipients.length) {
    message("请填写至少一个接收地址", { type: "warning" });
    return;
  }

  const payload: CreateReportSubscriptionPayload = {
    name,
    reportType: form.reportType,
    frequency: form.frequency,
    channels: form.channels,
    recipients
  };

  saving.value = true;
  try {
    if (editingUid.value) {
      const { code } = await updateReportSubscriptionApi(editingUid.value, {
        ...payload,
        status: form.status
      });
      if (code !== 200) {
        message("更新订阅失败", { type: "error" });
        return;
      }
      message("订阅已更新", { type: "success" });
    } else {
      const { code } = await createReportSubscriptionApi(payload);
      if (code !== 200) {
        message("创建订阅失败", { type: "error" });
        return;
      }
      message("订阅已创建", { type: "success" });
    }
    dialogVisible.value = false;
    await loadList();
  } catch (error) {
    handleApiError(error, editingUid.value ? "更新订阅失败" : "创建订阅失败");
  } finally {
    saving.value = false;
  }
}

async function handleToggleStatus(row: ReportSubscription, next: boolean) {
  try {
    const { code } = await updateReportSubscriptionApi(row.uid, {
      status: next
    });
    if (code !== 200) {
      message("更新启用状态失败", { type: "error" });
      await loadList();
      return;
    }
    row.status = next;
    message(next ? "已启用" : "已停用", { type: "success" });
  } catch (error) {
    handleApiError(error, "更新启用状态失败");
    await loadList();
  }
}

async function handleDelete(row: ReportSubscription) {
  try {
    await ElMessageBox.confirm(
      `确认删除订阅「${row.name}」？删除后不可恢复。`,
      "删除确认",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" }
    );
  } catch {
    return;
  }

  try {
    const { code } = await deleteReportSubscriptionApi(row.uid);
    if (code !== 200) {
      message("删除订阅失败", { type: "error" });
      return;
    }
    message("订阅已删除", { type: "success" });
    await loadList();
  } catch (error) {
    handleApiError(error, "删除订阅失败");
  }
}

async function handleExport() {
  if (!exportRange.value || exportRange.value.length !== 2) {
    message("请选择导出日期区间", { type: "warning" });
    return;
  }
  const [startDate, endDate] = exportRange.value;
  exporting.value = true;
  try {
    const blob = await exportReportApi({
      startDate,
      endDate,
      format: exportFormat.value
    });
    const ext = exportFormat.value === "pdf" ? ".pdf" : ".xlsx";
    const mime =
      exportFormat.value === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const fileBlob =
      blob instanceof Blob
        ? blob.type
          ? blob
          : new Blob([blob], { type: mime })
        : new Blob([blob as unknown as BlobPart], { type: mime });
    downloadBlob(
      fileBlob,
      generateFilenameWithTimestamp("analysis-overview", ext),
      { showMessage: true, skipMimeCheck: !fileBlob.type }
    );
  } catch (error) {
    handleApiError(error, "导出失败");
  } finally {
    exporting.value = false;
  }
}

onMounted(() => {
  void loadList();
});
</script>

<template>
  <div class="p-4 space-y-4">
    <el-card shadow="never">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div class="text-base font-medium">经营概览导出</div>
            <div class="text-xs text-gray-500 mt-1">
              调用 `GET /analysis/export`，一次导出销售/采购/库存汇总
            </div>
          </div>
          <el-button type="primary" :loading="exporting" @click="handleExport">
            导出报表
          </el-button>
        </div>
      </template>
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <div class="text-xs text-gray-500 mb-1">日期区间</div>
          <el-date-picker
            v-model="exportRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            unlink-panels
          />
        </div>
        <div>
          <div class="text-xs text-gray-500 mb-1">格式</div>
          <el-radio-group v-model="exportFormat">
            <el-radio-button value="excel">Excel</el-radio-button>
            <el-radio-button value="pdf">PDF</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div class="text-base font-medium">报表订阅</div>
            <div class="text-xs text-gray-500 mt-1">
              对接 `analysis/subscriptions` CRUD；支持日/周/月推送
            </div>
          </div>
          <el-button type="primary" @click="openCreate">新建订阅</el-button>
        </div>
      </template>

      <div class="flex flex-wrap items-center gap-3 mb-4">
        <el-select
          v-model="filters.reportType"
          clearable
          placeholder="报表类型"
          class="!w-44"
          @change="loadList"
        >
          <el-option
            v-for="item in REPORT_TYPE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select
          v-model="filters.status"
          clearable
          placeholder="启用状态"
          class="!w-36"
          @change="loadList"
        >
          <el-option label="已启用" value="true" />
          <el-option label="已停用" value="false" />
        </el-select>
        <el-button @click="loadList">刷新</el-button>
      </div>

      <el-table v-loading="loading" :data="list" stripe empty-text="暂无订阅">
        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column label="报表类型" min-width="120">
          <template #default="{ row }">
            {{ reportTypeLabel(row.reportType) }}
          </template>
        </el-table-column>
        <el-table-column label="频率" width="90">
          <template #default="{ row }">
            {{ frequencyLabel(row.frequency) }}
          </template>
        </el-table-column>
        <el-table-column label="渠道" min-width="120">
          <template #default="{ row }">
            {{
              ((row as ReportSubscription).channels || [])
                .map(ch =>
                  ch === "email" ? "邮件" : ch === "sms" ? "短信" : ch
                )
                .join("、") || "—"
            }}
          </template>
        </el-table-column>
        <el-table-column label="接收人" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ (row.recipients || []).join("、") || "—" }}
          </template>
        </el-table-column>
        <el-table-column label="启用" width="90">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status"
              @change="
                (val: string | number | boolean) =>
                  handleToggleStatus(row as ReportSubscription, Boolean(val))
              "
            />
          </template>
        </el-table-column>
        <el-table-column label="下次执行" min-width="150">
          <template #default="{ row }">
            {{ formatDateTime(row.nextRunAt) }}
          </template>
        </el-table-column>
        <el-table-column label="上次执行" min-width="150">
          <template #default="{ row }">
            {{ formatDateTime(row.lastRunAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="openEdit(row as ReportSubscription)"
              >编辑</el-button
            >
            <el-button
              link
              type="danger"
              @click="handleDelete(row as ReportSubscription)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="560px"
      destroy-on-close
    >
      <el-form label-width="96px">
        <el-form-item label="名称" required>
          <el-input
            v-model="form.name"
            maxlength="64"
            placeholder="例如：每日销售汇总"
          />
        </el-form-item>
        <el-form-item label="报表类型" required>
          <el-select v-model="form.reportType" class="w-full">
            <el-option
              v-for="item in REPORT_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="频率" required>
          <el-radio-group v-model="form.frequency">
            <el-radio
              v-for="item in FREQUENCY_OPTIONS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="渠道" required>
          <el-checkbox-group v-model="form.channels">
            <el-checkbox
              v-for="item in CHANNEL_OPTIONS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="接收地址" required>
          <el-input
            v-model="form.recipientsText"
            type="textarea"
            :rows="3"
            placeholder="每行一个邮箱或手机号，也可用逗号分隔"
          />
        </el-form-item>
        <el-form-item v-if="editingUid" label="启用">
          <el-switch v-model="form.status" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

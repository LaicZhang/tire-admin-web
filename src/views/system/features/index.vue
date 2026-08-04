<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Refresh from "~icons/ep/refresh";
import { ElMessageBox } from "element-plus";
import { handleApiError, message } from "@/utils";
import {
  createFeatureApi,
  disableFeatureApi,
  listFeaturesApi,
  updateFeatureApi,
  type FeatureDefinition
} from "@/api/system/subscription";

defineOptions({
  name: "SystemFeatures"
});

const loading = ref(false);
const features = ref<FeatureDefinition[]>([]);
const editVisible = ref(false);
const isCreate = ref(false);
const editingKey = ref<string | null>(null);

const form = reactive({
  key: "",
  name: "",
  group: "",
  description: "",
  menuUidsText: "",
  permissionPathsText: "",
  limitsText: ""
});

const columns: TableColumnList = [
  { label: "Key", prop: "key", minWidth: 160 },
  { label: "名称", prop: "name", minWidth: 140 },
  {
    label: "分组",
    prop: "group",
    minWidth: 100,
    formatter: ({ group }) => group || "—"
  },
  {
    label: "说明",
    prop: "description",
    minWidth: 180,
    formatter: ({ description }) => description || "—"
  },
  {
    label: "菜单数",
    prop: "menuUids",
    width: 90,
    formatter: ({ menuUids }) =>
      Array.isArray(menuUids) ? String(menuUids.length) : "0"
  },
  {
    label: "权限数",
    prop: "permissionPaths",
    width: 90,
    formatter: ({ permissionPaths }) =>
      Array.isArray(permissionPaths) ? String(permissionPaths.length) : "0"
  },
  { label: "状态", prop: "status", width: 90, slot: "status" },
  { label: "操作", fixed: "right", width: 180, slot: "operation" }
];

function splitLines(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map(s => s.trim())
    .filter(Boolean);
}

function parseLimits(text: string): Record<string, unknown> | undefined {
  const raw = text.trim();
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    message("limits 须为 JSON 对象", { type: "warning" });
    return undefined;
  } catch {
    message("limits JSON 解析失败", { type: "warning" });
    return undefined;
  }
}

async function loadData() {
  loading.value = true;
  try {
    const { code, data, msg } = await listFeaturesApi();
    if (code === 200) {
      features.value = Array.isArray(data) ? data : [];
    } else {
      message(msg || "加载功能目录失败", { type: "error" });
      features.value = [];
    }
  } catch (error) {
    features.value = [];
    handleApiError(error, "加载功能目录失败");
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  isCreate.value = true;
  editingKey.value = null;
  form.key = "";
  form.name = "";
  form.group = "";
  form.description = "";
  form.menuUidsText = "";
  form.permissionPathsText = "";
  form.limitsText = "";
  editVisible.value = true;
}

function openEdit(row: FeatureDefinition) {
  isCreate.value = false;
  editingKey.value = row.key;
  form.key = row.key;
  form.name = row.name;
  form.group = row.group ?? "";
  form.description = row.description ?? "";
  form.menuUidsText = Array.isArray(row.menuUids)
    ? row.menuUids.join("\n")
    : "";
  form.permissionPathsText = Array.isArray(row.permissionPaths)
    ? row.permissionPaths.join("\n")
    : "";
  form.limitsText =
    row.limits && typeof row.limits === "object"
      ? JSON.stringify(row.limits, null, 2)
      : "";
  editVisible.value = true;
}

async function submitEdit() {
  const name = form.name.trim();
  if (!name) {
    message("请填写功能名称", { type: "warning" });
    return;
  }
  const menuUids = splitLines(form.menuUidsText);
  const permissionPaths = splitLines(form.permissionPathsText);
  let limits: Record<string, unknown> | undefined;
  if (form.limitsText.trim()) {
    limits = parseLimits(form.limitsText);
    if (limits === undefined) return;
  }

  loading.value = true;
  try {
    if (isCreate.value) {
      const key = form.key.trim();
      if (!key) {
        message("请填写功能 key（如 org.salary）", { type: "warning" });
        return;
      }
      const { code, msg } = await createFeatureApi({
        key,
        name,
        group: form.group.trim() || undefined,
        description: form.description.trim() || undefined,
        menuUids: menuUids.length ? menuUids : undefined,
        permissionPaths: permissionPaths.length ? permissionPaths : undefined,
        limits
      });
      if (code !== 200) {
        message(msg || "创建失败", { type: "error" });
        return;
      }
      message("功能已创建", { type: "success" });
    } else if (editingKey.value) {
      const { code, msg } = await updateFeatureApi(editingKey.value, {
        name,
        group: form.group.trim() || undefined,
        description: form.description.trim() || undefined,
        menuUids,
        permissionPaths,
        limits
      });
      if (code !== 200) {
        message(msg || "更新失败", { type: "error" });
        return;
      }
      message("功能已更新", { type: "success" });
    }
    editVisible.value = false;
    await loadData();
  } catch (error) {
    handleApiError(error, "保存功能失败");
  } finally {
    loading.value = false;
  }
}

async function handleDisable(row: FeatureDefinition) {
  try {
    await ElMessageBox.confirm(
      `停用功能「${row.key}」后，新绑定计划将不再包含它（已授予快照不受影响）。确认？`,
      "停用功能",
      { type: "warning", confirmButtonText: "停用", cancelButtonText: "取消" }
    );
  } catch {
    return;
  }
  loading.value = true;
  try {
    const { code, msg } = await disableFeatureApi(row.key);
    if (code !== 200) {
      message(msg || "停用失败", { type: "error" });
      return;
    }
    message("已停用", { type: "success" });
    await loadData();
  } catch (error) {
    handleApiError(error, "停用功能失败");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="main p-4">
    <div class="bg-white p-4 rounded-md mb-3 text-sm text-gray-600">
      功能目录是订阅计划的能力原子；与「免费账套导入」无关。停用不会撤销已授予公司的
      BUYOUT 快照。无在线购买入口。
    </div>
    <div class="bg-white p-4 rounded-md">
      <PureTableBar title="功能目录" :columns="columns" @refresh="loadData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openCreate"
          >
            新建功能
          </el-button>
          <el-button
            :icon="useRenderIcon(Refresh)"
            :loading="loading"
            @click="loadData"
          >
            刷新
          </el-button>
        </template>
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            border
            row-key="key"
            align-whole="center"
            showOverflowTooltip
            :loading="loading"
            :size="size"
            :data="features"
            :columns="dynamicColumns"
          >
            <template #status="{ row }">
              <el-tag :type="row.status ? 'success' : 'info'" effect="plain">
                {{ row.status ? "启用" : "停用" }}
              </el-tag>
            </template>
            <template #operation="{ row }">
              <el-button
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(EditPen)"
                @click="openEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="row.status"
                link
                type="danger"
                :size="size"
                @click="handleDisable(row)"
              >
                停用
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </div>

    <el-dialog
      v-model="editVisible"
      :title="isCreate ? '新建功能' : `编辑功能 · ${editingKey}`"
      width="560px"
      destroy-on-close
    >
      <el-form label-width="110px">
        <el-form-item label="Key" required>
          <el-input
            v-model="form.key"
            :disabled="!isCreate"
            placeholder="如 org.salary / core.workplace"
            maxlength="80"
          />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="展示名" maxlength="80" />
        </el-form-item>
        <el-form-item label="分组">
          <el-input
            v-model="form.group"
            placeholder="如 org / core"
            maxlength="40"
          />
        </el-form-item>
        <el-form-item label="说明">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            maxlength="200"
          />
        </el-form-item>
        <el-form-item label="菜单 UID">
          <el-input
            v-model="form.menuUidsText"
            type="textarea"
            :rows="3"
            placeholder="每行一个 menu uid（可选）"
          />
        </el-form-item>
        <el-form-item label="权限 path">
          <el-input
            v-model="form.permissionPathsText"
            type="textarea"
            :rows="3"
            placeholder="每行一个 permission path（可选）"
          />
        </el-form-item>
        <el-form-item label="limits JSON">
          <el-input
            v-model="form.limitsText"
            type="textarea"
            :rows="3"
            placeholder='可选，如 {"maxStores": 3}'
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="submitEdit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

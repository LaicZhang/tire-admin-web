<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Refresh from "~icons/ep/refresh";
import { ElMessageBox } from "element-plus";
import { handleApiError, message } from "@/utils";
import {
  createSubscriptionPlanApi,
  disableSubscriptionPlanApi,
  listFeaturesApi,
  listSubscriptionPlansApi,
  replacePlanFeaturesApi,
  updateSubscriptionPlanApi,
  type FeatureDefinition,
  type SubscriptionPlan,
  type SubscriptionPlanCode
} from "@/api/system/subscription";

defineOptions({
  name: "SystemSubscriptionPlans"
});

const PLAN_CODE_OPTIONS: Array<{ label: string; value: SubscriptionPlanCode }> =
  [
    { label: "免费计划 FREE", value: "FREE" },
    { label: "高级 PREMIUM", value: "PREMIUM" },
    { label: "买断 BUYOUT", value: "BUYOUT" }
  ];

const loading = ref(false);
const plans = ref<SubscriptionPlan[]>([]);
const features = ref<FeatureDefinition[]>([]);

const editVisible = ref(false);
const featuresVisible = ref(false);
const editing = ref<SubscriptionPlan | null>(null);
const isCreate = ref(false);

const form = reactive({
  code: "PREMIUM" as SubscriptionPlanCode,
  name: "",
  description: "",
  receivesUpdates: true,
  status: true,
  sortOrder: 0
});

const featureForm = reactive({
  planUid: "",
  planName: "",
  featureKeys: [] as string[]
});

const featureOptions = computed(() =>
  features.value.map(f => ({
    label: `${f.key} · ${f.name}${f.status === false ? "（已停用）" : ""}`,
    value: f.key
  }))
);

const columns: TableColumnList = [
  { label: "代码", prop: "code", minWidth: 100 },
  { label: "名称", prop: "name", minWidth: 140 },
  {
    label: "说明",
    prop: "description",
    minWidth: 180,
    formatter: ({ description }) => description || "—"
  },
  {
    label: "跟随更新",
    prop: "receivesUpdates",
    width: 100,
    slot: "receivesUpdates"
  },
  {
    label: "功能数",
    prop: "features",
    width: 90,
    formatter: ({ features: feats }) =>
      Array.isArray(feats) ? String(feats.length) : "0"
  },
  { label: "排序", prop: "sortOrder", width: 80 },
  { label: "状态", prop: "status", width: 90, slot: "status" },
  { label: "操作", fixed: "right", width: 260, slot: "operation" }
];

async function loadData() {
  loading.value = true;
  try {
    const [planRes, featureRes] = await Promise.all([
      listSubscriptionPlansApi(),
      listFeaturesApi()
    ]);
    if (planRes.code === 200) {
      plans.value = Array.isArray(planRes.data) ? planRes.data : [];
    } else {
      message(planRes.msg || "加载订阅计划失败", { type: "error" });
      plans.value = [];
    }
    if (featureRes.code === 200) {
      features.value = Array.isArray(featureRes.data) ? featureRes.data : [];
    }
  } catch (error) {
    plans.value = [];
    handleApiError(error, "加载订阅计划失败");
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  isCreate.value = true;
  editing.value = null;
  form.code = "PREMIUM";
  form.name = "";
  form.description = "";
  form.receivesUpdates = true;
  form.status = true;
  form.sortOrder = plans.value.length;
  editVisible.value = true;
}

function openEdit(row: SubscriptionPlan) {
  isCreate.value = false;
  editing.value = row;
  form.code = row.code;
  form.name = row.name;
  form.description = row.description ?? "";
  form.receivesUpdates = row.receivesUpdates;
  form.status = row.status !== false;
  form.sortOrder = row.sortOrder ?? 0;
  editVisible.value = true;
}

function openFeatures(row: SubscriptionPlan) {
  featureForm.planUid = row.uid;
  featureForm.planName = `${row.code} · ${row.name}`;
  featureForm.featureKeys = Array.isArray(row.features)
    ? row.features.map(f => f.featureKey)
    : [];
  featuresVisible.value = true;
}

async function submitEdit() {
  const name = form.name.trim();
  if (!name) {
    message("请填写计划名称", { type: "warning" });
    return;
  }
  loading.value = true;
  try {
    if (isCreate.value) {
      const { code, msg } = await createSubscriptionPlanApi({
        code: form.code,
        name,
        description: form.description.trim() || undefined,
        receivesUpdates: form.receivesUpdates,
        status: form.status,
        sortOrder: form.sortOrder
      });
      if (code !== 200) {
        message(msg || "创建失败", { type: "error" });
        return;
      }
      message("计划已创建（内置码会按种子语义固定 receivesUpdates）", {
        type: "success"
      });
    } else if (editing.value) {
      const { code, msg } = await updateSubscriptionPlanApi(editing.value.uid, {
        name,
        description: form.description.trim() || undefined,
        receivesUpdates: form.receivesUpdates,
        status: form.status,
        sortOrder: form.sortOrder
      });
      if (code !== 200) {
        message(msg || "更新失败", { type: "error" });
        return;
      }
      message("计划已更新", { type: "success" });
    }
    editVisible.value = false;
    await loadData();
  } catch (error) {
    handleApiError(error, "保存计划失败");
  } finally {
    loading.value = false;
  }
}

async function submitFeatures() {
  if (!featureForm.planUid) return;
  loading.value = true;
  try {
    const { code, msg } = await replacePlanFeaturesApi(
      featureForm.planUid,
      featureForm.featureKeys
    );
    if (code !== 200) {
      message(msg || "绑定功能失败", { type: "error" });
      return;
    }
    message("计划功能已更新", { type: "success" });
    featuresVisible.value = false;
    await loadData();
  } catch (error) {
    handleApiError(error, "绑定功能失败");
  } finally {
    loading.value = false;
  }
}

async function handleDisable(row: SubscriptionPlan) {
  try {
    await ElMessageBox.confirm(
      `停用计划「${row.code}」后将无法新发兑换码；内置 FREE/PREMIUM/BUYOUT 仅软停用。确认？`,
      "停用订阅计划",
      { type: "warning", confirmButtonText: "停用", cancelButtonText: "取消" }
    );
  } catch {
    return;
  }
  loading.value = true;
  try {
    const { code, msg } = await disableSubscriptionPlanApi(row.uid);
    if (code !== 200) {
      message(msg || "停用失败", { type: "error" });
      return;
    }
    message("计划已停用", { type: "success" });
    await loadData();
  } catch (error) {
    handleApiError(error, "停用失败");
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
    <el-alert
      class="mb-3"
      type="info"
      :closable="false"
      title="订阅计划（公司能力上界）"
      description="此处管理 FREE / PREMIUM / BUYOUT 商业计划与功能绑定。免费计划 ≠ 免费账套导入；本页无购买入口，仅运营配置。"
    />
    <div class="bg-white p-4 rounded-md">
      <PureTableBar title="订阅计划" :columns="columns" @refresh="loadData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            :loading="loading"
            @click="openCreate"
          >
            新建/覆盖计划
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
            row-key="uid"
            align-whole="center"
            showOverflowTooltip
            :loading="loading"
            :size="size"
            :data="plans"
            :columns="dynamicColumns"
          >
            <template #receivesUpdates="{ row }">
              <el-tag
                :type="row.receivesUpdates ? 'success' : 'warning'"
                effect="plain"
              >
                {{ row.receivesUpdates ? "跟随更新" : "买断快照" }}
              </el-tag>
            </template>
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
                link
                type="primary"
                :size="size"
                @click="openFeatures(row)"
              >
                功能
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
      :title="isCreate ? '新建/覆盖订阅计划' : '编辑订阅计划'"
      width="520px"
      destroy-on-close
    >
      <el-form label-width="110px">
        <el-form-item label="计划代码" required>
          <el-select
            v-model="form.code"
            class="w-full"
            :disabled="!isCreate"
            placeholder="选择代码"
          >
            <el-option
              v-for="opt in PLAN_CODE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input
            v-model="form.name"
            placeholder="例如：高级版"
            maxlength="80"
          />
        </el-form-item>
        <el-form-item label="说明">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="面向运营的说明"
            maxlength="200"
          />
        </el-form-item>
        <el-form-item label="跟随更新">
          <el-switch
            v-model="form.receivesUpdates"
            active-text="是（FREE/PREMIUM）"
            inactive-text="否（BUYOUT 快照）"
          />
          <div class="text-xs text-gray-500 mt-1">
            内置码创建/更新时服务端会按种子强制 receivesUpdates，UI
            选择可能被覆盖。
          </div>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.status" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="submitEdit">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="featuresVisible"
      :title="`绑定功能 · ${featureForm.planName}`"
      width="560px"
      destroy-on-close
    >
      <el-select
        v-model="featureForm.featureKeys"
        multiple
        filterable
        collapse-tags
        collapse-tags-tooltip
        class="w-full"
        placeholder="选择功能 key"
      >
        <el-option
          v-for="opt in featureOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <div class="text-xs text-gray-500 mt-2">
        全量替换该计划的 PlanFeature 集合；BUYOUT 已授予公司仍使用授予时快照。
      </div>
      <template #footer>
        <el-button @click="featuresVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="submitFeatures">
          保存功能集
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

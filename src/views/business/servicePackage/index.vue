<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessageBox } from "element-plus";
import AddFill from "~icons/ri/add-circle-line";
import Refresh from "~icons/ep/refresh";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import {
  createServicePackageApi,
  deleteServicePackageApi,
  getServicePackageListApi,
  updateServicePackageApi,
  type ServicePackageItem
} from "@/api/business/service-package";
import { getTireListApi } from "@/api/business/tire";
import { message, handleApiError } from "@/utils";
import { fieldRules } from "@/utils/validation/fieldRules";
import { fenToYuanNumber, yuanToFen } from "@/utils/formatMoney";

defineOptions({ name: "ServicePackage" });

type LineDraft = {
  tireId: string;
  qty: number;
  optional: boolean;
  unitPriceYuan: number | undefined;
  remark: string;
};

const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingUid = ref<string | null>(null);
const list = ref<ServicePackageItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const formRef = ref<FormInstance>();
const tireOptions = ref<Array<{ uid: string; name: string }>>([]);

const searchForm = reactive({
  keyword: "",
  enabled: "" as "" | "true" | "false"
});

const form = reactive({
  name: "",
  enabled: true,
  remark: "",
  lines: [] as LineDraft[]
});

const rules: FormRules = {
  name: [fieldRules.name({ label: "套餐名称", required: true, max: 128 })]
};

const columns: TableColumnList = [
  { label: "名称", prop: "name", minWidth: 160 },
  {
    label: "启用",
    prop: "enabled",
    minWidth: 80,
    formatter: ({ enabled }: ServicePackageItem) => (enabled ? "是" : "否")
  },
  {
    label: "明细行数",
    minWidth: 100,
    formatter: (row: ServicePackageItem) => String(row.lines?.length ?? 0)
  },
  { label: "备注", prop: "remark", minWidth: 160 },
  { label: "创建时间", prop: "createAt", minWidth: 160 },
  {
    label: "操作",
    fixed: "right",
    width: 180,
    slot: "operation"
  }
];

const pagination = computed(() => ({
  total: total.value,
  pageSize,
  currentPage: page.value,
  background: true
}));

const dialogTitle = computed(() =>
  editingUid.value ? "编辑服务套餐" : "新建服务套餐"
);

async function loadTires() {
  try {
    const { code, data } = await getTireListApi(0);
    if (code === 200) {
      tireOptions.value = (data?.list || []).map(
        (t: { uid: string; name?: string | null }) => ({
          uid: t.uid,
          name: t.name || t.uid
        })
      );
    }
  } catch {
    /* optional cache miss is fine */
  }
}

async function loadList() {
  loading.value = true;
  try {
    const enabled =
      searchForm.enabled === "" ? undefined : searchForm.enabled === "true";
    const { code, data, msg } = await getServicePackageListApi(page.value, {
      keyword: searchForm.keyword || undefined,
      enabled
    });
    if (code !== 200) {
      message(msg || "加载服务套餐失败", { type: "error" });
      return;
    }
    list.value = data?.list || [];
    total.value = data?.total || 0;
  } catch (error) {
    handleApiError(error, "加载服务套餐失败");
  } finally {
    loading.value = false;
  }
}

function emptyLine(): LineDraft {
  return {
    tireId: "",
    qty: 1,
    optional: false,
    unitPriceYuan: undefined,
    remark: ""
  };
}

function resetForm() {
  form.name = "";
  form.enabled = true;
  form.remark = "";
  form.lines = [emptyLine()];
  editingUid.value = null;
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: ServicePackageItem) {
  editingUid.value = row.uid;
  form.name = row.name;
  form.enabled = row.enabled;
  form.remark = row.remark || "";
  form.lines = (row.lines || []).map(line => ({
    tireId: line.tireId,
    qty: line.qty,
    optional: !!line.optional,
    unitPriceYuan:
      line.unitPrice === null || line.unitPrice === undefined
        ? undefined
        : fenToYuanNumber(Number(line.unitPrice)),
    remark: line.remark || ""
  }));
  if (!form.lines.length) form.lines = [emptyLine()];
  dialogVisible.value = true;
}

function addLine() {
  form.lines.push(emptyLine());
}

function removeLine(index: number) {
  if (form.lines.length <= 1) {
    message("至少保留一行明细", { type: "warning" });
    return;
  }
  form.lines.splice(index, 1);
}

function toPayload() {
  return {
    name: form.name.trim(),
    enabled: form.enabled,
    remark: form.remark.trim() || null,
    lines: form.lines.map((line, index) => ({
      tireId: line.tireId,
      qty: line.qty,
      optional: line.optional,
      sortOrder: index,
      unitPrice:
        line.unitPriceYuan === undefined || line.unitPriceYuan === null
          ? null
          : yuanToFen(line.unitPriceYuan),
      remark: line.remark.trim() || null
    }))
  };
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (form.lines.some(l => !l.tireId || l.qty < 1)) {
    message("请完善套餐明细（商品与数量）", { type: "warning" });
    return;
  }
  saving.value = true;
  try {
    const payload = toPayload();
    if (editingUid.value) {
      const { code, msg } = await updateServicePackageApi(
        editingUid.value,
        payload
      );
      if (code !== 200) {
        message(msg || "更新失败", { type: "error" });
        return;
      }
      message("套餐已更新", { type: "success" });
    } else {
      const { code, msg } = await createServicePackageApi(payload);
      if (code !== 200) {
        message(msg || "创建失败", { type: "error" });
        return;
      }
      message("套餐已创建", { type: "success" });
    }
    dialogVisible.value = false;
    await loadList();
  } catch (error) {
    handleApiError(error, "保存服务套餐失败");
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: ServicePackageItem) {
  try {
    await ElMessageBox.confirm(`确认停用套餐「${row.name}」？`, "提示", {
      type: "warning"
    });
  } catch {
    return;
  }
  try {
    const { code, msg } = await deleteServicePackageApi(row.uid);
    if (code !== 200) {
      message(msg || "停用失败", { type: "error" });
      return;
    }
    message("套餐已停用", { type: "success" });
    await loadList();
  } catch (error) {
    handleApiError(error, "停用服务套餐失败");
  }
}

function handlePageChange(current: number) {
  page.value = current;
  void loadList();
}

function onSearch() {
  page.value = 1;
  void loadList();
}

onMounted(async () => {
  await Promise.all([loadTires(), loadList()]);
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      @search="onSearch"
      @reset="
        () => {
          searchForm.keyword = '';
          searchForm.enabled = '';
          onSearch();
        }
      "
    >
      <el-form-item label="关键词">
        <el-input
          v-model="searchForm.keyword"
          clearable
          placeholder="套餐名称"
        />
      </el-form-item>
      <el-form-item label="启用">
        <el-select
          v-model="searchForm.enabled"
          clearable
          placeholder="全部"
          class="w-[140px]"
        >
          <el-option label="启用" value="true" />
          <el-option label="停用" value="false" />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar title="服务套餐" @refresh="loadList">
        <template #buttons>
          <Auth value="post/service-package">
            <el-button
              type="primary"
              :icon="useRenderIcon(AddFill)"
              @click="openCreateDialog"
            >
              新建套餐
            </el-button>
          </Auth>
          <el-button :icon="useRenderIcon(Refresh)" @click="loadList">
            刷新
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="uid"
            adaptive
            border
            :size
            :columns="columns"
            :data="list"
            :loading="loading"
            :pagination="{ ...pagination, size }"
            @page-current-change="handlePageChange"
          >
            <template #operation="{ row }">
              <Auth value="patch/service-package">
                <el-button link type="primary" @click="openEditDialog(row)">
                  编辑
                </el-button>
              </Auth>
              <Auth value="delete/service-package">
                <el-button link type="danger" @click="handleDelete(row)">
                  停用
                </el-button>
              </Auth>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="780px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如：四季换胎套餐" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="明细">
          <div class="w-full space-y-2">
            <div
              v-for="(line, index) in form.lines"
              :key="index"
              class="flex flex-wrap items-center gap-2 border rounded p-2"
            >
              <el-select
                v-model="line.tireId"
                filterable
                placeholder="商品"
                class="w-[220px]"
              >
                <el-option
                  v-for="t in tireOptions"
                  :key="t.uid"
                  :label="t.name"
                  :value="t.uid"
                />
              </el-select>
              <el-input-number v-model="line.qty" :min="1" />
              <el-input-number
                v-model="line.unitPriceYuan"
                :min="0"
                :precision="2"
                :step="1"
                placeholder="单价(元)"
              />
              <el-checkbox v-model="line.optional">可选</el-checkbox>
              <el-input
                v-model="line.remark"
                placeholder="备注"
                class="w-[140px]"
              />
              <el-button link type="danger" @click="removeLine(index)">
                删除
              </el-button>
            </div>
            <el-button type="primary" link @click="addLine">添加行</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

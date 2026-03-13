<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import {
  createClaimDefectCategoryApi,
  getClaimDefectCategoryListApi,
  type ClaimDefectCategoryDto
} from "@/api";
import { message } from "@/utils";

type ClaimDefectCategoryRow = ClaimDefectCategoryDto & {
  id: number;
  createdAt?: string;
};

const loading = ref(false);
const saving = ref(false);
const rows = ref<ClaimDefectCategoryRow[]>([]);
const form = reactive<ClaimDefectCategoryDto>({
  name: "",
  code: "",
  remark: "",
  responsibilityType: "UNKNOWN",
  autoLinkProvider: false
});

async function loadRows() {
  loading.value = true;
  try {
    const { code, data, msg } = await getClaimDefectCategoryListApi();
    if (code !== 200) {
      message(msg || "加载缺陷类别失败", { type: "error" });
      return;
    }
    rows.value = Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "加载缺陷类别失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
}

async function createCategory() {
  if (!form.name.trim()) {
    message("请输入缺陷名称", { type: "warning" });
    return;
  }
  saving.value = true;
  try {
    const payload: ClaimDefectCategoryDto = {
      name: form.name.trim(),
      code: form.code?.trim() || undefined,
      remark: form.remark?.trim() || undefined,
      responsibilityType: form.responsibilityType,
      autoLinkProvider: Boolean(form.autoLinkProvider)
    };
    const { code, msg } = await createClaimDefectCategoryApi(payload);
    if (code !== 200) {
      message(msg || "新增缺陷类别失败", { type: "error" });
      return;
    }
    message("缺陷类别已新增", { type: "success" });
    form.name = "";
    form.code = "";
    form.remark = "";
    form.responsibilityType = "UNKNOWN";
    form.autoLinkProvider = false;
    await loadRows();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "新增缺陷类别失败";
    message(msg, { type: "error" });
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadRows();
});
</script>

<template>
  <div class="space-y-4">
    <el-card shadow="never">
      <template #header>
        <div class="font-medium">新增缺陷类别</div>
      </template>
      <el-form label-width="110px">
        <el-form-item label="缺陷名称" required>
          <el-input v-model="form.name" placeholder="请输入缺陷名称" />
        </el-form-item>
        <el-form-item label="编码">
          <el-input v-model="form.code" placeholder="可选" />
        </el-form-item>
        <el-form-item label="责任归属">
          <el-select v-model="form.responsibilityType" class="w-full">
            <el-option label="供应商" value="SUPPLIER" />
            <el-option label="厂家" value="MANUFACTURER" />
            <el-option label="物流" value="LOGISTICS" />
            <el-option label="仓储" value="STORAGE" />
            <el-option label="客户" value="CUSTOMER" />
            <el-option label="待判定" value="UNKNOWN" />
          </el-select>
        </el-form-item>
        <el-form-item label="自动关联供应商">
          <el-switch v-model="form.autoLinkProvider" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="可选" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="createCategory">
            保存
          </el-button>
          <el-button :loading="loading" @click="loadRows">刷新列表</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="font-medium">已配置缺陷类别</div>
      </template>
      <el-table v-loading="loading" :data="rows" border>
        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column prop="code" label="编码" min-width="120" />
        <el-table-column
          prop="responsibilityType"
          label="责任归属"
          min-width="120"
        />
        <el-table-column
          prop="autoLinkProvider"
          label="自动关联供应商"
          min-width="140"
        >
          <template #default="{ row }">
            {{ row.autoLinkProvider ? "是" : "否" }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { handleApiError, message } from "@/utils";
import {
  getCompanySettingGroupApi,
  patchCompanySettingGroupApi,
  type CompanySettingItem
} from "@/api/setting/company-setting";
import RepoSelect from "@/components/EntitySelect/RepoSelect.vue";
import { invalidateInventoryDefaultsCache } from "@/composables";

defineOptions({
  name: "CompanyInventoryDefaults"
});

const loading = ref(false);

type FormModel = {
  defaultWarehouseId?: string;
};

const form = reactive<FormModel>({
  defaultWarehouseId: undefined
});

function pickValue(
  list: CompanySettingItem[] | undefined,
  key: string
): string {
  const found = Array.isArray(list) ? list.find(i => i.key === key) : undefined;
  return String(found?.value ?? "").trim();
}

async function load() {
  loading.value = true;
  try {
    const res = await getCompanySettingGroupApi("inventory");
    if (res.code !== 200) {
      message(res.msg || "加载库存默认设置失败", { type: "error" });
      return;
    }
    form.defaultWarehouseId =
      pickValue(res.data, "defaultWarehouseId") || undefined;
  } catch (error) {
    handleApiError(error, "加载库存默认设置失败");
  } finally {
    loading.value = false;
  }
}

async function save() {
  loading.value = true;
  try {
    const settings: Record<string, unknown> = {
      defaultWarehouseId: form.defaultWarehouseId || ""
    };
    const res = await patchCompanySettingGroupApi("inventory", settings);
    if (res.code !== 200) {
      message(res.msg || "保存失败", { type: "error" });
      return;
    }
    invalidateInventoryDefaultsCache();
    message("保存成功", { type: "success" });
  } catch (error) {
    handleApiError(error, "保存失败");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
});
</script>

<template>
  <div class="main p-4">
    <div class="bg-white p-6 rounded-md">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-medium">库存默认值</h3>
        <el-button type="primary" :loading="loading" @click="save">
          保存设置
        </el-button>
      </div>

      <el-form :model="form" label-width="180px" label-position="left">
        <el-form-item label="默认仓库">
          <RepoSelect
            v-model="form.defaultWarehouseId"
            placeholder="不设置则新建单据不默认带出"
            clearable
          />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

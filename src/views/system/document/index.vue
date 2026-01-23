<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { getSettingGroupApi, updateSettingApi } from "@/api/setting";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Save from "~icons/ep/check";
import { message } from "@/utils/message";
import { PureTableBar } from "@/components/RePureTableBar";

defineOptions({
  name: "SystemDocument"
});

const loading = ref(false);
interface SettingItem {
  uid: string;
  group?: string;
  key?: string;
  desc?: string;
  value: string;
}
const settings = ref<SettingItem[]>([]);

async function loadSettings() {
  loading.value = true;
  try {
    const { data } = await getSettingGroupApi();
    // Filter for document related settings or use all
    settings.value = data || [];
    if (settings.value.length === 0) {
      // settings.value = [];
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function handleSave(row: SettingItem) {
  try {
    await updateSettingApi(row.uid, { value: row.value });
    message("保存成功", { type: "success" });
  } catch (e) {
    message(e instanceof Error ? e.message : "保存失败", { type: "error" });
  }
}

onMounted(() => {
  loadSettings();
});
</script>

<template>
  <div class="main p-4 bg-white">
    <PureTableBar title="单据设置" :columns="columns" @refresh="loadSettings">
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border
          align-whole="center"
          showOverflowTooltip
          :loading="loading"
          :size="size"
          :data="settings"
          :columns="dynamicColumns"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
        >
          <template #value="{ row }">
            <el-input v-model="row.value" placeholder="请输入配置值">
              <template #append>
                <el-button
                  :icon="useRenderIcon(Save)"
                  @click="handleSave(row)"
                />
              </template>
            </el-input>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

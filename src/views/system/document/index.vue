<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { getSettingGroupApi, updateSettingApi } from "@/api/setting";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Save from "~icons/ep/check";
import { message } from "@/utils/message";

defineOptions({
  name: "SystemDocument"
});

const loading = ref(false);
const settings = ref([]);

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

async function handleSave(row) {
  try {
    await updateSettingApi(row.uid, { value: row.value });
    message("保存成功", { type: "success" });
  } catch (e) {
    message(e.message || "保存失败", { type: "error" });
  }
}

onMounted(() => {
  loadSettings();
});
</script>

<template>
  <div class="main">
    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span>单据设置</span>
          <el-button
            type="primary"
            :icon="useRenderIcon(Save)"
            @click="loadSettings"
            >刷新</el-button
          >
        </div>
      </template>

      <el-table v-loading="loading" :data="settings" style="width: 100%">
        <el-table-column prop="group" label="分组" width="180" />
        <el-table-column prop="key" label="配置项键名" width="180" />
        <el-table-column prop="desc" label="描述" />
        <el-table-column label="配置值" width="300">
          <template #default="{ row }">
            <el-input v-model="row.value" placeholder="请输入配置值">
              <template #append>
                <el-button
                  :icon="useRenderIcon(Save)"
                  @click="handleSave(row)"
                />
              </template>
            </el-input>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

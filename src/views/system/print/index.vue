<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import type { TabsPaneContext } from "element-plus";
import { getPrintTemplateApi, savePrintTemplateApi } from "@/api/tools";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Save from "~icons/ep/check";
import { message } from "@/utils/message";

defineOptions({
  name: "SystemPrint"
});

type TemplateType = "order" | "sales" | "purchase";

const loading = ref(false);
const activeTab = ref<TemplateType>("order");

const templates = reactive<Record<TemplateType, string>>({
  order: "默认订单打印模板...",
  sales: "默认销售单打印模板...",
  purchase: "默认采购单打印模板..."
});

const templateTypes: Array<{ label: string; name: TemplateType }> = [
  { label: "订单打印", name: "order" },
  { label: "销售单打印", name: "sales" },
  { label: "采购单打印", name: "purchase" }
];

async function loadTemplate(type: TemplateType) {
  loading.value = true;
  try {
    const { data } = await getPrintTemplateApi(type);
    if (data && data.template) {
      templates[type] = data.template;
    }
  } catch (e) {
    // console.error(e);
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  loading.value = true;
  try {
    await savePrintTemplateApi({
      type: activeTab.value,
      template: templates[activeTab.value]
    });
    message("保存成功", { type: "success" });
  } catch (e) {
    message(e instanceof Error ? e.message : "保存失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

const handleTabChange = (tab: TabsPaneContext) => {
  const paneName = tab.paneName;
  if (paneName === "order" || paneName === "sales" || paneName === "purchase")
    loadTemplate(paneName);
};

onMounted(() => {
  loadTemplate(activeTab.value);
});
</script>

<template>
  <div class="main">
    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span>打印模板设置</span>
          <el-button
            type="primary"
            :icon="useRenderIcon(Save)"
            :loading="loading"
            @click="handleSave"
            >保存当前模板</el-button
          >
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-click="handleTabChange">
        <el-tab-pane
          v-for="item in templateTypes"
          :key="item.name"
          :label="item.label"
          :name="item.name"
        >
          <el-input
            v-model="templates[item.name]"
            type="textarea"
            :rows="20"
            placeholder="请输入HTML打印模板"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

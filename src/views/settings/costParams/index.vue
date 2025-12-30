<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ArrowUp from "~icons/ep/arrow-up";
import ArrowDown from "~icons/ep/arrow-down";
import { message } from "@/utils";
import { ElMessageBox } from "element-plus";
import { getSettingGroupApi, batchUpdateSettingsApi } from "@/api/setting";
import type { CostParams, AbnormalCostItem } from "./types";

defineOptions({
  name: "CostParams"
});

const loading = ref(false);
const formRef = ref();

const formData = ref<CostParams>({
  costMethod: "moving_average",
  costCalcType: "total_warehouse",
  abnormalCostOrder: [
    { id: "1", name: "最近采购价", order: 1 },
    { id: "2", name: "商品资料单价", order: 2 },
    { id: "3", name: "手工录入成本", order: 3 }
  ]
});

const costMethodOptions = [
  { label: "移动平均法", value: "moving_average" },
  { label: "先进先出法", value: "fifo" }
];

const costCalcTypeOptions = [
  { label: "总仓核算", value: "total_warehouse" },
  { label: "分仓核算", value: "sub_warehouse" }
];

const loadSettings = async () => {
  loading.value = true;
  try {
    const { code, data } = await getSettingGroupApi();
    if (code === 200 && data) {
      const settings = data as Record<string, unknown>[];
      const costSettings = settings.filter(
        (s: Record<string, unknown>) => s.group === "cost"
      );
      costSettings.forEach((s: Record<string, unknown>) => {
        const key = s.key as string;
        if (key === "costMethod" || key === "costCalcType") {
          (formData.value as Record<string, unknown>)[key] = s.value;
        } else if (key === "abnormalCostOrder") {
          try {
            formData.value.abnormalCostOrder = JSON.parse(s.value as string);
          } catch {
            // keep default
          }
        }
      });
    }
  } catch {
    message("加载设置失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  loading.value = true;
  try {
    const saveData = {
      costMethod: formData.value.costMethod,
      costCalcType: formData.value.costCalcType,
      abnormalCostOrder: JSON.stringify(formData.value.abnormalCostOrder)
    };
    const { code } = await batchUpdateSettingsApi("cost", saveData);
    if (code === 200) {
      message("保存成功", { type: "success" });
    } else {
      message("保存失败", { type: "error" });
    }
  } catch {
    message("保存失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleCostMethodChange = async (value: string) => {
  try {
    await ElMessageBox.confirm(
      "切换成本核算方法后，会对未结账的业务单据进行成本重算，是否确认切换？",
      "切换确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
  } catch {
    // 取消切换，恢复原值
    formData.value.costMethod =
      value === "moving_average" ? "fifo" : "moving_average";
  }
};

const handleCostCalcTypeChange = async (value: string) => {
  try {
    await ElMessageBox.confirm(
      "切换成本核算方式后，会对未结账的业务单据进行成本重算，是否确认切换？",
      "切换确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
  } catch {
    // 取消切换，恢复原值
    formData.value.costCalcType =
      value === "total_warehouse" ? "sub_warehouse" : "total_warehouse";
  }
};

const moveUp = (index: number) => {
  if (index === 0) return;
  const list = formData.value.abnormalCostOrder;
  [list[index - 1], list[index]] = [list[index], list[index - 1]];
  updateOrder();
};

const moveDown = (index: number) => {
  const list = formData.value.abnormalCostOrder;
  if (index === list.length - 1) return;
  [list[index], list[index + 1]] = [list[index + 1], list[index]];
  updateOrder();
};

const updateOrder = () => {
  formData.value.abnormalCostOrder.forEach((item, index) => {
    item.order = index + 1;
  });
};

onMounted(() => {
  loadSettings();
});
</script>

<template>
  <div class="main">
    <div class="bg-white p-6 rounded-md">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-medium">成本参数设置</h3>
        <el-button type="primary" :loading="loading" @click="handleSave">
          保存设置
        </el-button>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        label-width="140px"
        label-position="left"
        class="max-w-3xl"
      >
        <!-- 成本核算设置 -->
        <el-divider content-position="left">成本核算设置</el-divider>
        <el-alert
          title="切换成本核算方法或方式后，会对未结账的业务单据进行成本重算，请谨慎操作"
          type="warning"
          :closable="false"
          class="mb-4"
        />
        <el-form-item label="成本核算方法" prop="costMethod">
          <el-radio-group
            v-model="formData.costMethod"
            @change="handleCostMethodChange"
          >
            <el-radio
              v-for="item in costMethodOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="成本核算方式" prop="costCalcType">
          <el-radio-group
            v-model="formData.costCalcType"
            @change="handleCostCalcTypeChange"
          >
            <el-radio
              v-for="item in costCalcTypeOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 异常成本处理 -->
        <el-divider content-position="left">异常成本处理取值顺序</el-divider>
        <el-table :data="formData.abnormalCostOrder" border style="width: 100%">
          <el-table-column
            type="index"
            label="顺序"
            width="80"
            align="center"
          />
          <el-table-column prop="name" label="取值方式" min-width="200" />
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ $index }">
              <el-button
                link
                type="primary"
                :icon="useRenderIcon(ArrowUp)"
                :disabled="$index === 0"
                @click="moveUp($index)"
              >
                前移
              </el-button>
              <el-button
                link
                type="primary"
                :icon="useRenderIcon(ArrowDown)"
                :disabled="$index === formData.abnormalCostOrder.length - 1"
                @click="moveDown($index)"
              >
                后移
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 20px;
}

:deep(.el-divider__text) {
  font-weight: 600;
  color: #303133;
}
</style>

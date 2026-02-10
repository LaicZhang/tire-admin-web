<script setup lang="ts">
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ArrowUp from "~icons/ep/arrow-up";
import ArrowDown from "~icons/ep/arrow-down";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import { useSettingsForm } from "@/composables";
import type { SettingItem } from "@/api/setting";
import type { CostParams } from "./types";

defineOptions({
  name: "CostParams"
});

const { confirm } = useConfirmDialog();

const costMethodOptions = [
  { label: "移动平均法", value: "moving_average" },
  { label: "先进先出法", value: "fifo" }
];

const costCalcTypeOptions = [
  { label: "总仓核算", value: "total_warehouse" },
  { label: "分仓核算", value: "sub_warehouse" }
];

const { loading, formRef, formData, handleSave } = useSettingsForm<CostParams>({
  group: "cost",
  defaults: () => ({
    costMethod: "moving_average",
    costCalcType: "total_warehouse",
    abnormalCostOrder: [
      { id: "1", name: "最近采购价", order: 1 },
      { id: "2", name: "商品资料单价", order: 2 },
      { id: "3", name: "手工录入成本", order: 3 }
    ]
  }),
  transformLoad: (settings: SettingItem[], form: CostParams) => {
    settings.forEach((s: SettingItem) => {
      const key = s.key;
      if (key === "costMethod") {
        form.costMethod = s.value as CostParams["costMethod"];
      } else if (key === "costCalcType") {
        form.costCalcType = s.value as CostParams["costCalcType"];
      } else if (key === "abnormalCostOrder") {
        try {
          form.abnormalCostOrder = JSON.parse(s.value);
        } catch {
          // keep default
        }
      }
    });
  },
  transformSave: (form: CostParams) => ({
    costMethod: form.costMethod,
    costCalcType: form.costCalcType,
    abnormalCostOrder: JSON.stringify(form.abnormalCostOrder)
  })
});

const handleCostMethodChange = async (value: string) => {
  const ok = await confirm(
    "切换成本核算方法后，会对未结账的业务单据进行成本重算，是否确认切换？",
    "切换确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  );
  if (!ok) {
    formData.value.costMethod =
      value === "moving_average" ? "fifo" : "moving_average";
  }
};

const handleCostCalcTypeChange = async (value: string) => {
  const ok = await confirm(
    "切换成本核算方式后，会对未结账的业务单据进行成本重算，是否确认切换？",
    "切换确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  );
  if (!ok) {
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
            @change="(val: unknown) => handleCostMethodChange(val as string)"
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
            @change="(val: unknown) => handleCostCalcTypeChange(val as string)"
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
        <pure-table
          border
          align-whole="center"
          :data="formData.abnormalCostOrder"
          :columns="columns"
          style="width: 100%"
        >
          <template #operation="{ index }">
            <el-button
              link
              type="primary"
              :icon="useRenderIcon(ArrowUp)"
              :disabled="index === 0"
              @click="moveUp(index)"
            >
              前移
            </el-button>
            <el-button
              link
              type="primary"
              :icon="useRenderIcon(ArrowDown)"
              :disabled="index === formData.abnormalCostOrder.length - 1"
              @click="moveDown(index)"
            >
              后移
            </el-button>
          </template>
        </pure-table>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  @extend .page-container;
}

:deep(.el-divider__text) {
  font-weight: 600;
  color: #303133;
}
</style>

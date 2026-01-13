<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "@/utils";
import type { Unit } from "@/api/business/unit";

interface Props {
  formInline: {
    mainUnit: { uid: string; name: string } | null;
    availableUnits: Unit[];
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "add", data: { targetUnitId: string; ratio: number }): void;
}>();

const newConversion = ref({
  targetUnitId: "",
  ratio: 1
});

const validate = (): boolean => {
  if (!newConversion.value.targetUnitId) {
    message("请选择辅单位", { type: "warning" });
    return false;
  }
  if (!newConversion.value.ratio || newConversion.value.ratio <= 0) {
    message("换算比例必须大于0", { type: "warning" });
    return false;
  }
  return true;
};

const getData = () => ({
  targetUnitId: newConversion.value.targetUnitId,
  ratio: newConversion.value.ratio
});

defineExpose({ validate, getData });
</script>

<template>
  <el-form label-width="80px">
    <el-form-item label="换算关系">
      <div class="flex items-center">
        <span>1 {{ formInline.mainUnit?.name || "主单位" }}</span>
        <span class="mx-2">=</span>
        <el-input-number
          v-model="newConversion.ratio"
          :min="0.001"
          :precision="3"
          class="w-28"
        />
        <el-select
          v-model="newConversion.targetUnitId"
          placeholder="选择辅单位"
          class="ml-2 w-28"
        >
          <el-option
            v-for="unit in formInline.availableUnits"
            :key="unit.uid"
            :label="unit.name"
            :value="unit.uid"
          />
        </el-select>
      </div>
    </el-form-item>
  </el-form>
</template>

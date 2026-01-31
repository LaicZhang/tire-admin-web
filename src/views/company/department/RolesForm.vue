<script setup lang="ts">
import { ref } from "vue";
import { ElCheckboxGroup, ElCheckbox, ElEmpty } from "element-plus";
import type { CheckboxGroupValueType } from "element-plus";

const props = defineProps<{
  allRoles: { uid: string; name: string }[];
  selectedRoles: string[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: "update:selectedRoles", value: string[]): void;
}>();

const localSelected = ref<string[]>([...props.selectedRoles]);

const onSelectedRolesChange = (val: CheckboxGroupValueType) => {
  const next = (Array.isArray(val) ? val : []).map(v => String(v));
  localSelected.value = next;
  emit("update:selectedRoles", next);
};
</script>

<template>
  <div v-loading="loading" class="min-h-[200px]">
    <el-checkbox-group
      :model-value="localSelected"
      @update:model-value="onSelectedRolesChange"
    >
      <el-checkbox
        v-for="role in allRoles"
        :key="role.uid"
        :value="role.uid"
        :label="role.name"
        class="mb-2 w-full"
      />
    </el-checkbox-group>
    <el-empty v-if="allRoles.length === 0" description="暂无可分配角色" />
  </div>
</template>

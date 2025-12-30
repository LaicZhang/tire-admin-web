<script setup lang="ts">
import { ref, computed } from "vue";
import type { FormProps, TreeCategoryItem } from "./types";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    name: "",
    parentUid: null,
    sort: 0
  }),
  treeData: () => [],
  isEdit: false
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const treeSelectData = computed(() => {
  const formatTree = (items: TreeCategoryItem[]): TreeCategoryItem[] => {
    return items.map(item => ({
      ...item,
      children: item.children ? formatTree(item.children) : undefined
    }));
  };
  return [{ uid: "", name: "顶级类别", children: formatTree(props.treeData) }];
});

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form ref="ruleFormRef" :model="newFormInline" label-width="90px">
    <el-form-item
      label="类别名称"
      prop="name"
      :rules="[{ required: true, message: '请输入类别名称', trigger: 'blur' }]"
    >
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入类别名称"
        maxlength="50"
      />
    </el-form-item>
    <el-form-item label="上级类别" prop="parentUid">
      <el-tree-select
        v-model="newFormInline.parentUid"
        :data="treeSelectData"
        :props="{ label: 'name', value: 'uid', children: 'children' }"
        :render-after-expand="false"
        check-strictly
        clearable
        placeholder="请选择上级类别"
        class="w-full"
      />
    </el-form-item>
    <el-form-item label="排序" prop="sort">
      <el-input-number
        v-model="newFormInline.sort"
        :min="0"
        :max="9999"
        class="!w-full"
      />
    </el-form-item>
  </el-form>
</template>

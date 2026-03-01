<script setup lang="ts">
import { ref, computed } from "vue";
import type { FormRules } from "element-plus";
import type { FormProps, TreeCategoryItem } from "./types";
import { elementRules } from "@/utils/validation/elementRules";

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

const rules: FormRules = {
  name: [
    elementRules.requiredStringTrim("请输入类别名称"),
    elementRules.maxLen(50, "类别名称最多 50 个字符")
  ],
  parentUid: [elementRules.uuidV4("上级类别不合法")],
  sort: [
    {
      trigger: "blur",
      validator: (_rule, value, callback) => {
        if (value === null || value === undefined || value === "")
          return callback();
        const n = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(n) || n < 0 || n > 9999)
          return callback(new Error("排序需在 0~9999"));
        callback();
      }
    }
  ]
};

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
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="rules"
    label-width="90px"
  >
    <el-form-item label="类别名称" prop="name">
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
        node-key="uid"
        :props="{ label: 'name', children: 'children' }"
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

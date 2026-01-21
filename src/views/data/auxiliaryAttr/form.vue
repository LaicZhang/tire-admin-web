<script setup lang="ts">
import { ref } from "vue";
import type { FormProps } from "./types";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Plus from "~icons/ep/plus";
import Delete from "~icons/ep/delete";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    name: "",
    values: [],
    sort: 0,
    remark: ""
  }),
  isEdit: false
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);
const newValue = ref("");

function addValue() {
  const val = newValue.value.trim();
  if (!val) return;
  if (newFormInline.value.values.includes(val)) return;
  newFormInline.value.values.push(val);
  newValue.value = "";
}

function removeValue(index: number) {
  newFormInline.value.values.splice(index, 1);
}

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form ref="ruleFormRef" :model="newFormInline" label-width="90px">
    <el-form-item
      label="属性名称"
      prop="name"
      :rules="[{ required: true, message: '请输入属性名称', trigger: 'blur' }]"
    >
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入属性名称，如：颜色、尺码"
        maxlength="50"
      />
    </el-form-item>

    <el-form-item label="属性值">
      <div class="w-full">
        <div class="flex flex-wrap gap-2 mb-2">
          <el-tag
            v-for="(val, index) in newFormInline.values"
            :key="val"
            closable
            @close="removeValue(index)"
          >
            {{ val }}
          </el-tag>
        </div>
        <div class="flex gap-2">
          <el-input
            v-model="newValue"
            placeholder="输入属性值后按回车添加"
            class="w-[200px]!"
            @keyup.enter="addValue"
          />
          <el-button
            type="primary"
            :icon="useRenderIcon(Plus)"
            @click="addValue"
          >
            添加
          </el-button>
        </div>
        <p class="text-xs text-gray-400 mt-1">
          提示：如颜色属性可添加"红色"、"蓝色"、"绿色"等属性值
        </p>
      </div>
    </el-form-item>

    <el-form-item label="排序" prop="sort">
      <el-input-number
        v-model="newFormInline.sort"
        :min="0"
        :max="9999"
        class="!w-full"
      />
    </el-form-item>
    <el-form-item label="备注" prop="remark">
      <el-input
        v-model="newFormInline.remark"
        type="textarea"
        :rows="3"
        placeholder="请输入备注"
        maxlength="200"
      />
    </el-form-item>
  </el-form>
</template>

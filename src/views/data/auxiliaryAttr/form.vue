<script setup lang="ts">
import { ref } from "vue";
import type { FormRules } from "element-plus";
import type { FormProps } from "./types";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Plus from "~icons/ep/plus";
import Delete from "~icons/ep/delete";
import { message } from "@/utils";
import { elementRules } from "@/utils/validation/elementRules";

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

const rules: FormRules = {
  name: [
    elementRules.requiredStringTrim("请输入属性名称"),
    elementRules.maxLen(50, "属性名称最多 50 个字符")
  ],
  values: [
    {
      trigger: "change",
      validator: (_rule, value, callback) => {
        const arr = Array.isArray(value) ? value : [];
        if (arr.length === 0)
          return callback(new Error("请至少添加 1 个属性值"));
        const tooLong = arr.find(v => String(v || "").length > 50);
        if (tooLong) return callback(new Error("属性值最多 50 个字符"));
        callback();
      }
    }
  ],
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
  ],
  remark: [elementRules.maxLen(200, "备注最多 200 个字符")]
};

function addValue() {
  const val = newValue.value.trim();
  if (!val) return;
  if (val.length > 50) {
    message("属性值最多 50 个字符", { type: "warning" });
    return;
  }
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
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="rules"
    label-width="90px"
  >
    <el-form-item label="属性名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入属性名称，如：颜色、尺码"
        maxlength="50"
      />
    </el-form-item>

    <el-form-item label="属性值" prop="values">
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
            maxlength="50"
            show-word-limit
            clearable
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

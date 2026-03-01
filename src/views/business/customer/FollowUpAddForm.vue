<script setup lang="ts">
import { ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { message } from "@/utils";
import dayjs from "dayjs";
import { elementRules } from "@/utils/validation/elementRules";

const props = defineProps<{
  customerUid: string;
  createApi: (
    uid: string,
    data: {
      content: string;
      type: string;
      nextFollowUpDate?: string;
    }
  ) => Promise<{ code: number }>;
  onSuccess: () => void;
  onClose: () => void;
}>();

const loading = ref(false);
const formData = ref({
  content: "",
  type: "phone",
  nextFollowUpDate: ""
});
const formRef = ref<FormInstance>();

const rules: FormRules = {
  type: [
    elementRules.requiredSelect("请选择跟进方式", "change"),
    {
      trigger: "change",
      validator: (_rule, value, callback) => {
        const allowed = new Set(["phone", "wechat", "visit", "email", "other"]);
        if (!allowed.has(String(value)))
          return callback(new Error("跟进方式不合法"));
        callback();
      }
    }
  ],
  content: [
    elementRules.requiredStringTrim("请输入跟进内容"),
    elementRules.maxLen(500, "跟进内容最多 500 个字符")
  ],
  nextFollowUpDate: [
    {
      trigger: "change",
      validator: (_rule, value, callback) => {
        if (!value) return callback();
        const s = typeof value === "string" ? value : String(value);
        const d = dayjs(s);
        if (!d.isValid()) return callback(new Error("下次跟进日期不合法"));
        callback();
      }
    }
  ]
};

const followUpTypes = [
  { label: "电话", value: "phone" },
  { label: "微信", value: "wechat" },
  { label: "拜访", value: "visit" },
  { label: "邮件", value: "email" },
  { label: "其他", value: "other" }
];

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    await props.createApi(props.customerUid, {
      content: formData.value.content.trim(),
      type: formData.value.type,
      nextFollowUpDate: formData.value.nextFollowUpDate || undefined
    });
    message("跟进记录添加成功", { type: "success" });
    props.onSuccess();
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="跟进方式" prop="type">
        <el-select v-model="formData.type" style="width: 100%">
          <el-option
            v-for="t in followUpTypes"
            :key="t.value"
            :label="t.label"
            :value="t.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="跟进内容" prop="content">
        <el-input
          v-model="formData.content"
          type="textarea"
          :rows="4"
          placeholder="请输入跟进内容"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="下次跟进日期" prop="nextFollowUpDate">
        <el-date-picker
          v-model="formData.nextFollowUpDate"
          type="datetime"
          placeholder="选择日期时间"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <div class="flex justify-end gap-2 mt-4">
      <el-button @click="onClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定
      </el-button>
    </div>
  </div>
</template>

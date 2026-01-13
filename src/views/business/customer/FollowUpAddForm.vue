<script setup lang="ts">
import { ref } from "vue";
import { message } from "@/utils";
import dayjs from "dayjs";

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

const followUpTypes = [
  { label: "电话", value: "phone" },
  { label: "微信", value: "wechat" },
  { label: "拜访", value: "visit" },
  { label: "邮件", value: "email" },
  { label: "其他", value: "other" }
];

async function handleSubmit() {
  if (!formData.value.content.trim()) {
    message("请输入跟进内容", { type: "warning" });
    return;
  }

  loading.value = true;
  try {
    await props.createApi(props.customerUid, {
      content: formData.value.content,
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
    <el-form :model="formData" label-width="100px">
      <el-form-item label="跟进方式" required>
        <el-select v-model="formData.type" style="width: 100%">
          <el-option
            v-for="t in followUpTypes"
            :key="t.value"
            :label="t.label"
            :value="t.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="跟进内容" required>
        <el-input
          v-model="formData.content"
          type="textarea"
          :rows="4"
          placeholder="请输入跟进内容"
        />
      </el-form-item>
      <el-form-item label="下次跟进日期">
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

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { createDeliveryReceiptApi } from "@/api";
import {
  formatToken,
  getFileMd5,
  getImageWH,
  getToken,
  message,
  StaticImageTypeEnum,
  BaseStaticUploadPath
} from "@/utils";

defineOptions({
  name: "DeliveryReceiptCard"
});

const props = defineProps<{
  logisticUid: string;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
}>();

const formRef = ref();
const loading = ref(false);
const Authorization = ref("");

const formData = ref({
  receiverName: "",
  signedAt: "",
  images: [] as string[],
  remark: ""
});

const formRules = {
  receiverName: [{ required: true, message: "请输入签收人", trigger: "blur" }],
  signedAt: [{ required: true, message: "请选择签收时间", trigger: "change" }]
};

const fileList = ref([]);
const uploadData = ref({});

function getAuthorization() {
  Authorization.value = formatToken(getToken().accessToken);
}

async function handleBeforeUpload(file: File) {
  const { name, size, type, lastModified } = file;
  const hash = getFileMd5(lastModified, size);
  const [filename, ext] = name.split(".");
  const { width, height } = await getImageWH(file);
  uploadData.value = {
    hash,
    ext,
    filename,
    size,
    mimetype: type,
    width,
    height,
    lastModified,
    type: StaticImageTypeEnum.COVER
  };
  return true;
}

function handleUploadSuccess(response: any) {
  const { code, msg, data } = response;
  if (code !== 200) {
    message(msg, { type: "error" });
    return;
  }
  if (data?.id) {
    formData.value.images.push(data.hash + "." + data.ext);
  }
}

function handleRemove(file: any) {
  const index = fileList.value.findIndex((f: any) => f.uid === file.uid);
  if (index > -1) {
    formData.value.images.splice(index, 1);
  }
}

async function handleSubmit() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;

    loading.value = true;
    try {
      const { code, msg } = await createDeliveryReceiptApi({
        logisticUid: props.logisticUid,
        receiverName: formData.value.receiverName,
        signedAt: formData.value.signedAt,
        remark: formData.value.remark || undefined
      });
      if (code === 200) {
        message("签收回执提交成功", { type: "success" });
        resetForm();
        emit("refresh");
      } else {
        message(msg || "提交失败", { type: "error" });
      }
    } catch {
      message("提交签收回执失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  });
}

function resetForm() {
  formData.value = {
    receiverName: "",
    signedAt: "",
    images: [],
    remark: ""
  };
  fileList.value = [];
  formRef.value?.clearValidate();
}

onMounted(() => {
  getAuthorization();
});
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span>签收回执</span>
      </div>
    </template>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="签收人" prop="receiverName">
        <el-input
          v-model="formData.receiverName"
          placeholder="请输入签收人姓名"
          clearable
        />
      </el-form-item>

      <el-form-item label="签收时间" prop="signedAt">
        <el-date-picker
          v-model="formData.signedAt"
          type="datetime"
          placeholder="请选择签收时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="签收图片">
        <el-upload
          v-model:file-list="fileList"
          :action="BaseStaticUploadPath"
          :headers="{ Authorization }"
          :data="uploadData"
          :before-upload="handleBeforeUpload"
          :on-success="handleUploadSuccess"
          :on-remove="handleRemove"
          list-type="picture-card"
          accept="image/*"
          :limit="5"
        >
          <el-icon><component :is="'ep-plus'" /></el-icon>
        </el-upload>
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="formData.remark"
          type="textarea"
          placeholder="请输入备注"
          :rows="2"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          提交签收
        </el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.card-header {
  font-weight: 600;
}
</style>

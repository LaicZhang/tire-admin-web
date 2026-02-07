<script setup lang="ts">
import { ref } from "vue";
import { getVerifyCodeApi } from "@/api/verify";
import { message } from "@/utils/message";
import { ReImageVerify } from "@/components/ReImageVerify";
import { ReQrcode } from "@/components/ReQrcode";
import { DEFAULT_QR_CONTENT } from "@/config/externalLinks";

defineOptions({
  name: "VerifyTool"
});

const activeName = ref("image");
const imgCode = ref("");

const phoneForm = ref({
  phone: "",
  code: ""
});

const qrContent = ref(DEFAULT_QR_CONTENT);

async function sendSms() {
  if (!phoneForm.value.phone) {
    message("请输入手机号", { type: "warning" });
    return;
  }
  const { code, msg } = await getVerifyCodeApi({
    phone: phoneForm.value.phone,
    code: "mock",
    type: 1
  });
  if (code === 200) {
    message("验证码已发送", { type: "success" });
  } else {
    message(msg, { type: "error" });
  }
}
</script>

<template>
  <el-card>
    <el-tabs v-model="activeName">
      <el-tab-pane label="图形验证码" name="image">
        <div class="flex items-center gap-4 p-4">
          <span>当前验证码: {{ imgCode }}</span>
          <ReImageVerify v-model:code="imgCode" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="短信验证码" name="sms">
        <div class="w-1/2 p-4">
          <el-form label-width="100px">
            <el-form-item label="手机号">
              <el-input v-model="phoneForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="操作">
              <el-button type="primary" @click="sendSms">发送验证码</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="二维码服务" name="qr">
        <div class="p-4">
          <el-input
            v-model="qrContent"
            placeholder="输入内容生成二维码"
            class="mb-4 w-96"
          />
          <ReQrcode :text="qrContent" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

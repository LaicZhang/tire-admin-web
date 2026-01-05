<script setup lang="ts">
import { onMounted, ref } from "vue";
import { message } from "@/utils";
import { getPushConfigApi, updatePushConfigApi } from "@/api/push";
import { testPushDeerApi, testEmailApi, testSmsApi } from "@/api/push";

defineOptions({
  name: "PushSettings"
});

const loading = ref(false);
const formRef = ref();
const activeTab = ref("pushDeer");

const formData = ref({
  // PushDeer 配置
  pushDeerEnabled: false,
  pushDeerKey: "",

  // 邮件配置
  emailEnabled: false,
  emailHost: "smtp.qq.com",
  emailPort: 465,
  emailAuthUser: "",
  emailAuthPass: "",

  // 短信配置
  smsEnabled: false,
  smsAppId: "",
  smsSignName: "",
  smsTemplateId: ""
});

const testFormData = ref({
  pushDeer: {
    text: "测试消息",
    desp: "这是一条测试推送消息",
    type: "text" as "text" | "markdown" | "image"
  },
  email: {
    email: "",
    title: "测试邮件",
    text: "这是一封测试邮件",
    type: "text" as "text" | "html"
  },
  sms: {
    phone: "",
    code: "123456"
  }
});

const testing = ref({
  pushDeer: false,
  email: false,
  sms: false
});

const loadConfig = async () => {
  loading.value = true;
  try {
    const { code, data } = await getPushConfigApi();
    if (code === 200 && data) {
      Object.assign(formData.value, data);
    }
  } catch {
    message("加载推送配置失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  loading.value = true;
  try {
    const { code } = await updatePushConfigApi(formData.value);
    if (code === 200) {
      message("保存成功", { type: "success" });
    } else {
      message("保存失败", { type: "error" });
    }
  } catch {
    message("保存失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleTestPushDeer = async () => {
  if (!formData.value.pushDeerKey) {
    message("请先配置 PushDeer Key", { type: "warning" });
    return;
  }

  testing.value.pushDeer = true;
  try {
    const { code } = await testPushDeerApi(
      testFormData.value.pushDeer.text,
      testFormData.value.pushDeer.desp,
      testFormData.value.pushDeer.type
    );
    if (code === 200) {
      message("测试推送成功，请检查您的设备", { type: "success" });
    } else {
      message("测试推送失败", { type: "error" });
    }
  } catch {
    message("测试推送失败", { type: "error" });
  } finally {
    testing.value.pushDeer = false;
  }
};

const handleTestEmail = async () => {
  if (!formData.value.emailAuthUser || !formData.value.emailAuthPass) {
    message("请先配置邮箱账号和密码", { type: "warning" });
    return;
  }

  if (!testFormData.value.email.email) {
    message("请输入测试邮箱地址", { type: "warning" });
    return;
  }

  testing.value.email = true;
  try {
    const { code } = await testEmailApi(
      testFormData.value.email.email,
      testFormData.value.email.title,
      testFormData.value.email.text,
      testFormData.value.email.type
    );
    if (code === 200) {
      message("测试邮件发送成功，请检查邮箱", { type: "success" });
    } else {
      message("测试邮件发送失败", { type: "error" });
    }
  } catch {
    message("测试邮件发送失败", { type: "error" });
  } finally {
    testing.value.email = false;
  }
};

const handleTestSms = async () => {
  if (
    !formData.value.smsAppId ||
    !formData.value.smsSignName ||
    !formData.value.smsTemplateId
  ) {
    message("请先配置短信服务参数", { type: "warning" });
    return;
  }

  if (!testFormData.value.sms.phone) {
    message("请输入测试手机号", { type: "warning" });
    return;
  }

  testing.value.sms = true;
  try {
    const { code } = await testSmsApi(
      testFormData.value.sms.phone,
      testFormData.value.sms.code
    );
    if (code === 200) {
      message("测试短信发送成功，请检查手机", { type: "success" });
    } else {
      message("测试短信发送失败", { type: "error" });
    }
  } catch {
    message("测试短信发送失败", { type: "error" });
  } finally {
    testing.value.sms = false;
  }
};

onMounted(() => {
  loadConfig();
});
</script>

<template>
  <div class="main">
    <div class="bg-white p-6 rounded-md">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-medium">推送设置</h3>
        <el-button type="primary" :loading="loading" @click="handleSave">
          保存设置
        </el-button>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        label-width="120px"
        label-position="left"
        class="max-w-3xl"
      >
        <el-tabs v-model="activeTab" type="border-card">
          <!-- PushDeer 配置 -->
          <el-tab-pane label="PushDeer" name="pushDeer">
            <el-form-item label="启用 PushDeer">
              <el-switch v-model="formData.pushDeerEnabled" />
              <span class="ml-4 text-gray-500 text-sm">
                启用后可通过 PushDeer 推送消息到您的设备
              </span>
            </el-form-item>

            <el-form-item label="PushDeer Key" prop="pushDeerKey">
              <el-input
                v-model="formData.pushDeerKey"
                type="password"
                show-password
                placeholder="请输入 PushDeer Key"
                :disabled="!formData.pushDeerEnabled"
              />
              <div class="mt-2 text-gray-500 text-sm">
                <a
                  href="https://www.pushdeer.com"
                  target="_blank"
                  class="text-blue-500 hover:underline"
                >
                  前往 PushDeer 官网获取 Key
                </a>
              </div>
            </el-form-item>

            <el-divider content-position="left">测试推送</el-divider>
            <el-form-item label="消息内容">
              <el-input
                v-model="testFormData.pushDeer.text"
                placeholder="请输入消息标题"
                :disabled="!formData.pushDeerEnabled"
              />
            </el-form-item>
            <el-form-item label="消息详情">
              <el-input
                v-model="testFormData.pushDeer.desp"
                type="textarea"
                :rows="3"
                placeholder="请输入消息详情"
                :disabled="!formData.pushDeerEnabled"
              />
            </el-form-item>
            <el-form-item label="消息类型">
              <el-select
                v-model="testFormData.pushDeer.type"
                placeholder="请选择消息类型"
                :disabled="!formData.pushDeerEnabled"
              >
                <el-option label="文本" value="text" />
                <el-option label="Markdown" value="markdown" />
                <el-option label="图片" value="image" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="testing.pushDeer"
                :disabled="!formData.pushDeerEnabled"
                @click="handleTestPushDeer"
              >
                发送测试消息
              </el-button>
            </el-form-item>
          </el-tab-pane>

          <!-- 邮件配置 -->
          <el-tab-pane label="邮件" name="email">
            <el-form-item label="启用邮件">
              <el-switch v-model="formData.emailEnabled" />
              <span class="ml-4 text-gray-500 text-sm">
                启用后可通过邮件发送通知
              </span>
            </el-form-item>

            <el-form-item label="SMTP 服务器" prop="emailHost">
              <el-input
                v-model="formData.emailHost"
                placeholder="请输入 SMTP 服务器地址"
                :disabled="!formData.emailEnabled"
              />
            </el-form-item>
            <el-form-item label="SMTP 端口" prop="emailPort">
              <el-input-number
                v-model="formData.emailPort"
                :min="1"
                :max="65535"
                :disabled="!formData.emailEnabled"
              />
            </el-form-item>
            <el-form-item label="邮箱账号" prop="emailAuthUser">
              <el-input
                v-model="formData.emailAuthUser"
                placeholder="请输入邮箱账号"
                :disabled="!formData.emailEnabled"
              />
            </el-form-item>
            <el-form-item label="邮箱密码" prop="emailAuthPass">
              <el-input
                v-model="formData.emailAuthPass"
                type="password"
                show-password
                placeholder="请输入邮箱密码或授权码"
                :disabled="!formData.emailEnabled"
              />
              <div class="mt-2 text-gray-500 text-sm">
                对于 QQ 邮箱，请使用授权码而非登录密码
              </div>
            </el-form-item>

            <el-divider content-position="left">测试邮件</el-divider>
            <el-form-item label="测试邮箱">
              <el-input
                v-model="testFormData.email.email"
                placeholder="请输入接收测试邮件的邮箱地址"
                :disabled="!formData.emailEnabled"
              />
            </el-form-item>
            <el-form-item label="邮件标题">
              <el-input
                v-model="testFormData.email.title"
                placeholder="请输入邮件标题"
                :disabled="!formData.emailEnabled"
              />
            </el-form-item>
            <el-form-item label="邮件内容">
              <el-input
                v-model="testFormData.email.text"
                type="textarea"
                :rows="3"
                placeholder="请输入邮件内容"
                :disabled="!formData.emailEnabled"
              />
            </el-form-item>
            <el-form-item label="邮件类型">
              <el-select
                v-model="testFormData.email.type"
                placeholder="请选择邮件类型"
                :disabled="!formData.emailEnabled"
              >
                <el-option label="纯文本" value="text" />
                <el-option label="HTML" value="html" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="testing.email"
                :disabled="!formData.emailEnabled"
                @click="handleTestEmail"
              >
                发送测试邮件
              </el-button>
            </el-form-item>
          </el-tab-pane>

          <!-- 短信配置 -->
          <el-tab-pane label="短信" name="sms">
            <el-form-item label="启用短信">
              <el-switch v-model="formData.smsEnabled" />
              <span class="ml-4 text-gray-500 text-sm">
                启用后可通过短信发送验证码和通知
              </span>
            </el-form-item>

            <el-form-item label="短信应用 ID" prop="smsAppId">
              <el-input
                v-model="formData.smsAppId"
                placeholder="请输入腾讯云短信应用 ID"
                :disabled="!formData.smsEnabled"
              />
            </el-form-item>
            <el-form-item label="短信签名" prop="smsSignName">
              <el-input
                v-model="formData.smsSignName"
                placeholder="请输入短信签名"
                :disabled="!formData.smsEnabled"
              />
            </el-form-item>
            <el-form-item label="短信模板 ID" prop="smsTemplateId">
              <el-input
                v-model="formData.smsTemplateId"
                placeholder="请输入短信模板 ID"
                :disabled="!formData.smsEnabled"
              />
            </el-form-item>

            <el-divider content-position="left">测试短信</el-divider>
            <el-form-item label="测试手机号">
              <el-input
                v-model="testFormData.sms.phone"
                placeholder="请输入接收测试短信的手机号"
                :disabled="!formData.smsEnabled"
              />
            </el-form-item>
            <el-form-item label="验证码">
              <el-input
                v-model="testFormData.sms.code"
                placeholder="请输入验证码（6位数字）"
                maxlength="6"
                :disabled="!formData.smsEnabled"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="testing.sms"
                :disabled="!formData.smsEnabled"
                @click="handleTestSms"
              >
                发送测试短信
              </el-button>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 20px;
}

:deep(.el-divider__text) {
  font-weight: 600;
  color: #303133;
}

:deep(.el-tabs--border-card) {
  border: 1px solid #dcdfe6;
  box-shadow: none;
}
</style>

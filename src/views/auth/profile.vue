<template>
  <div>
    <el-card class="m-1">
      <el-descriptions
        class="margin-top"
        title="个人基础信息"
        :column="2"
        :size="size"
        border
      >
        <template #extra>
          <div class="flex gap-2">
            <el-button @click="openResetPasswordDialog">修改密码</el-button>
            <el-button type="primary" @click="openEditDialog">更新</el-button>
          </div>
        </template>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">用户名</div>
          </template>
          {{ userInfo.username }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">昵称</div>
          </template>
          {{ userInfo.info?.nickname }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">手机号</div>
          </template>
          {{ maskPhoneDisplay(userInfo.phone) }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">邮箱</div>
          </template>
          {{ maskEmailDisplay(userInfo.email) }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">性别</div>
          </template>
          <el-tag size="small">{{
            userInfo.info.gender === 1 ? "男" : "女"
          }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">实名状态</div>
          </template>
          <el-tag size="small">{{
            userInfo.info.isRealName === true ? "已实名" : "未实名"
          }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">生日</div>
          </template>
          {{ formattedBirthday }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 微信绑定卡片 -->
    <el-card class="m-1 mt-4">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">微信账号绑定</span>
          <el-button
            v-if="!wxBindStatus.isBound"
            type="primary"
            size="small"
            :loading="wxLoading"
            @click="handleBindWx"
          >
            绑定微信
          </el-button>
          <el-button
            v-else
            type="danger"
            size="small"
            :loading="wxLoading"
            @click="handleUnbindWx"
          >
            解除绑定
          </el-button>
        </div>
      </template>

      <div v-if="wxBindStatus.isBound" class="flex items-center gap-4">
        <el-avatar :size="48" :src="wxBindStatus.avatar">
          <el-icon><User /></el-icon>
        </el-avatar>
        <div>
          <div class="font-medium">
            {{ wxBindStatus.nickname || "微信用户" }}
          </div>
          <div class="text-sm text-gray-400">
            绑定时间: {{ wxBindStatus.bindTime || "未知" }}
          </div>
        </div>
        <el-tag type="success" size="small">已绑定</el-tag>
      </div>

      <div v-else class="text-center py-6">
        <el-icon class="text-4xl text-gray-300 mb-2"><Connection /></el-icon>
        <p class="text-gray-400">暂未绑定微信账号</p>
        <p class="text-xs text-gray-300 mt-1">绑定后可使用微信扫码登录</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { getUserInfoApi } from "@/api";
import {
  getWxBindStatusApi,
  getWxQrLoginUrlApi,
  wxQrBindApi,
  wxUnbindApi
} from "@/api/auth";
import { message } from "@/utils/message";
import { maskEmailDisplay, maskPhoneDisplay } from "@/utils/presentationMask";
import type { ComponentSize } from "element-plus";
import { userInfoTemplate, type UserInfoType } from "./info";
import { User, Connection } from "@element-plus/icons-vue";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import { addDialog, closeAllDialog } from "@/composables/useDialogService";
import WxBindForm from "./WxBindForm.vue";
import ProfileEditForm from "./ProfileEditForm.vue";
import ResetPasswordForm from "./ResetPasswordForm.vue";

defineOptions({
  name: "profile"
});

const size = ref<ComponentSize>("default");
const userInfo = ref<UserInfoType>(userInfoTemplate);
const wxLoading = ref(false);
const { confirm } = useConfirmDialog();

const wxBindStatus = ref({
  isBound: false,
  nickname: "",
  avatar: "",
  bindTime: ""
});

const formattedBirthday = computed(() => {
  const birthday = userInfo.value.info?.birthday;
  if (!birthday) return "";
  try {
    const date = new Date(birthday as string | Date);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().substring(0, 10);
  } catch {
    return "";
  }
});

const getUserInfo = async () => {
  const { data, code, msg } = await getUserInfoApi();
  if (code === 200 && data) {
    userInfo.value = data as UserInfoType;
  } else {
    message(msg, { type: "error" });
  }
};

const getWxBindStatus = async () => {
  try {
    const { data, code } = await getWxBindStatusApi();
    if (code === 200 && data) {
      const bindData = data as {
        isBound?: boolean;
        nickname?: string;
        avatar?: string;
        bindTime?: string;
      };
      wxBindStatus.value = {
        isBound: bindData.isBound || false,
        nickname: bindData.nickname || "",
        avatar: bindData.avatar || "",
        bindTime: bindData.bindTime || ""
      };
    }
  } catch {
    // 获取微信绑定状态失败不影响页面
  }
};

const checkBindStatus = async () => {
  await getWxBindStatus();
  if (wxBindStatus.value.isBound) {
    message("绑定成功", { type: "success" });
    closeAllDialog();
  } else {
    message("未检测到绑定，请确认已完成扫码", { type: "warning" });
  }
};

const promptCurrentPassword = async (title: string, messageText: string) => {
  try {
    type PromptResult = { value: string } | string;
    const result = (await ElMessageBox.prompt(messageText, title, {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      inputType: "password",
      inputPlaceholder: "请输入当前密码",
      inputValidator: value =>
        typeof value === "string" && value.trim().length >= 6
          ? true
          : "请输入至少 6 位当前密码",
      closeOnClickModal: false
    })) as PromptResult;
    const value = typeof result === "string" ? result : result.value;
    return value.trim();
  } catch {
    return null;
  }
};

/**
 * PPE-003: PC 绑定不能走登录 QR 后直接声称绑定成功。
 * 流程：当前密码 → getWxQrLoginUrlApi（签发 WX_QR_LOGIN_STATE + authUrl）
 * → 展示授权二维码 → 可选粘贴 OAuth code 调用 wxQrBindApi({code,state,currentPassword})。
 * 小程序 jsCode 绑定应使用 issueWxBindStateApi + wxBindApi（本页 PC 不走该路径）。
 */
const handleBindWx = async () => {
  const currentPassword = await promptCurrentPassword(
    "绑定微信",
    "绑定微信账号需要验证当前密码"
  );
  if (!currentPassword) return;

  wxLoading.value = true;
  try {
    const { data, code, msg } = await getWxQrLoginUrlApi();
    const qrData = data as {
      authUrl?: string;
      state?: string;
      url?: string;
      expiresIn?: number;
    };
    const authUrl = qrData.authUrl || qrData.url || "";
    const state = qrData.state || "";

    if (code === 200 && authUrl && state) {
      addDialog({
        title: "绑定微信",
        width: "420px",
        draggable: true,
        closeOnClickModal: false,
        hideFooter: true,
        contentRenderer: () =>
          h(WxBindForm, {
            authUrl,
            state,
            currentPassword,
            onCheck: checkBindStatus,
            onClose: () => closeAllDialog(),
            onComplete: async payload => {
              try {
                const res = await wxQrBindApi(payload);
                if (res.code === 200) {
                  message("绑定成功", { type: "success" });
                  closeAllDialog();
                  await getWxBindStatus();
                } else {
                  message(res.msg || "绑定失败", { type: "error" });
                }
              } catch {
                message("绑定失败", { type: "error" });
              }
            }
          })
      });
    } else {
      message(msg || "获取二维码失败", { type: "error" });
    }
  } catch {
    message("获取二维码失败", { type: "error" });
  } finally {
    wxLoading.value = false;
  }
};

const handleUnbindWx = async () => {
  try {
    const ok = await confirm(
      "确定要解除微信绑定吗？解绑后将无法使用微信扫码登录。",
      "确认解绑",
      {
        confirmButtonText: "确认解绑",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    if (!ok) return;

    const currentPassword = await promptCurrentPassword(
      "验证身份",
      "解除微信绑定需要输入当前密码"
    );
    if (!currentPassword) return;

    wxLoading.value = true;
    const { code, msg } = await wxUnbindApi({ currentPassword });
    if (code === 200) {
      message("解绑成功", { type: "success" });
      wxBindStatus.value = {
        isBound: false,
        nickname: "",
        avatar: "",
        bindTime: ""
      };
    } else {
      message(msg || "解绑失败", { type: "error" });
    }
  } catch {
    // 用户取消或解绑失败
  } finally {
    wxLoading.value = false;
  }
};

const openEditDialog = () => {
  addDialog({
    title: "编辑个人信息",
    width: "500px",
    draggable: true,
    closeOnClickModal: false,
    hideFooter: true,
    contentRenderer: () =>
      h(ProfileEditForm, {
        initialData: {
          nickname: userInfo.value.info?.nickname || "",
          phone: userInfo.value.phone || "",
          email: userInfo.value.email || "",
          gender: userInfo.value.info?.gender ?? 1,
          birthday: formattedBirthday.value || ""
        },
        onSuccess: async () => {
          closeAllDialog();
          await getUserInfo();
        },
        onClose: () => closeAllDialog()
      })
  });
};

const openResetPasswordDialog = () => {
  addDialog({
    title: "修改密码",
    width: "460px",
    draggable: true,
    closeOnClickModal: false,
    hideFooter: true,
    contentRenderer: () =>
      h(ResetPasswordForm, {
        onSuccess: () => closeAllDialog(),
        onClose: () => closeAllDialog()
      })
  });
};

onMounted(async () => {
  await Promise.all([getUserInfo(), getWxBindStatus()]);
});
</script>

<style scoped>
.el-descriptions {
  margin-top: 20px;
}

.cell-item {
  display: flex;
  align-items: center;
}

.margin-top {
  margin-top: 20px;
}
</style>

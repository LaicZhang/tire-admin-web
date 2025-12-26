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
          <el-button type="primary" @click="openEditDialog">更新</el-button>
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
          {{ userInfo.phone }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">邮箱</div>
          </template>
          {{ userInfo.email }}
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

    <!-- 微信绑定对话框 -->
    <el-dialog v-model="wxBindDialogVisible" title="绑定微信" width="400px">
      <div class="text-center">
        <p class="mb-4">请使用微信扫描二维码完成绑定</p>
        <div v-if="wxQrUrl" class="flex justify-center">
          <img
            :src="wxQrUrl"
            alt="微信二维码"
            class="w-48 h-48 border rounded"
          />
        </div>
        <div
          v-else
          class="w-48 h-48 mx-auto flex items-center justify-center bg-gray-100 rounded"
        >
          <el-icon class="text-4xl text-gray-300 is-loading"
            ><Loading
          /></el-icon>
        </div>
        <p class="text-xs text-gray-400 mt-4">二维码有效期 5 分钟</p>
      </div>
      <template #footer>
        <el-button @click="wxBindDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="checkBindStatus">已扫码</el-button>
      </template>
    </el-dialog>

    <!-- 编辑个人信息对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑个人信息" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input
            v-model="editForm.nickname"
            placeholder="请输入昵称"
            maxlength="50"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="editForm.phone"
            placeholder="请输入手机号"
            maxlength="20"
          />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input
            v-model="editForm.email"
            placeholder="请输入邮箱"
            type="email"
          />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="editForm.gender">
            <el-radio :value="1">男</el-radio>
            <el-radio :value="0">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="生日">
          <el-date-picker
            v-model="editForm.birthday"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="editLoading"
          @click="handleUpdateUserInfo"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getUserInfoApi } from "@/api";
import {
  getWxBindStatusApi,
  wxUnbindApi,
  getWxQrLoginUrlApi,
  updateUserInfoApi
} from "@/api/auth";
import { message } from "@/utils/message";
import type { ComponentSize } from "element-plus";
import { userInfoTemplate } from "./info";
import { User, Connection, Loading } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";

defineOptions({
  name: "profile"
});

const size = ref<ComponentSize>("default");
const userInfo = ref(userInfoTemplate);
const wxLoading = ref(false);
const wxBindDialogVisible = ref(false);
const wxQrUrl = ref("");

const wxBindStatus = ref({
  isBound: false,
  nickname: "",
  avatar: "",
  bindTime: ""
});

// 编辑对话框相关
const editDialogVisible = ref(false);
const editLoading = ref(false);
const editForm = ref({
  nickname: "",
  phone: "",
  email: "",
  gender: 1,
  birthday: ""
});

const openEditDialog = () => {
  editForm.value = {
    nickname: userInfo.value.info?.nickname || "",
    phone: userInfo.value.phone || "",
    email: userInfo.value.email || "",
    gender: userInfo.value.info?.gender ?? 1,
    birthday: formattedBirthday.value || ""
  };
  editDialogVisible.value = true;
};

const handleUpdateUserInfo = async () => {
  editLoading.value = true;
  try {
    const payload: {
      nickname?: string;
      phone?: string;
      email?: string;
      gender?: number;
      birthday?: string;
    } = {};
    if (editForm.value.nickname !== undefined) {
      payload.nickname = editForm.value.nickname;
    }
    if (editForm.value.phone !== undefined) {
      payload.phone = editForm.value.phone;
    }
    if (editForm.value.email !== undefined) {
      payload.email = editForm.value.email;
    }
    if (editForm.value.gender !== undefined) {
      payload.gender = editForm.value.gender;
    }
    if (editForm.value.birthday) {
      payload.birthday = editForm.value.birthday;
    }
    const { code, msg } = await updateUserInfoApi(payload);
    if (code === 200) {
      message("更新成功", { type: "success" });
      editDialogVisible.value = false;
      await getUserInfo();
    } else {
      message(msg || "更新失败", { type: "error" });
    }
  } catch {
    message("更新失败", { type: "error" });
  } finally {
    editLoading.value = false;
  }
};

const formattedBirthday = computed(() => {
  const birthday = userInfo.value.info?.birthday;
  if (!birthday) return "";
  try {
    // Handle both Date objects and date strings
    const date = new Date(birthday as string | Date);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().substring(0, 10);
  } catch {
    return "";
  }
});

const getUserInfo = async () => {
  const { data, code, msg } = await getUserInfoApi();
  if (code === 200) {
    userInfo.value = data;
  } else {
    message(msg, { type: "error" });
  }
};

const getWxBindStatus = async () => {
  try {
    const { data, code } = await getWxBindStatusApi();
    if (code === 200 && data) {
      wxBindStatus.value = {
        isBound: data.isBound || false,
        nickname: data.nickname || "",
        avatar: data.avatar || "",
        bindTime: data.bindTime || ""
      };
    }
  } catch {
    // 获取微信绑定状态失败不影响页面
  }
};

const handleBindWx = async () => {
  wxLoading.value = true;
  try {
    const { data, code, msg } = await getWxQrLoginUrlApi();
    if (code === 200 && data?.url) {
      wxQrUrl.value = data.url;
      wxBindDialogVisible.value = true;
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
    await ElMessageBox.confirm(
      "确定要解除微信绑定吗？解绑后将无法使用微信扫码登录。",
      "确认解绑",
      {
        confirmButtonText: "确认解绑",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    wxLoading.value = true;
    const { code, msg } = await wxUnbindApi();
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

const checkBindStatus = async () => {
  await getWxBindStatus();
  if (wxBindStatus.value.isBound) {
    message("绑定成功", { type: "success" });
    wxBindDialogVisible.value = false;
  } else {
    message("未检测到绑定，请确认已完成扫码", { type: "warning" });
  }
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

<template>
  <el-card class="m-2">
    <el-descriptions
      class="margin-top"
      title="个人基础信息"
      :column="2"
      :size="size"
      border
    >
      <template #extra>
        <el-button type="primary">更新</el-button>
      </template>
      <el-descriptions-item>
        <template #label>
          <div class="cell-item">
            <!-- <el-icon>
              <user />
            </el-icon> -->
            头像
          </div>
        </template>
        {{ userInfo.avatarId }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <div class="cell-item">
            <!-- <el-icon :style="iconStyle">
              <iphone />
            </el-icon> -->
            ID
          </div>
        </template>
        {{ userInfo.userId }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <div class="cell-item">
            <!-- <el-icon :style="iconStyle">
              <location />
            </el-icon> -->
            用户名
          </div>
        </template>
        {{ exUserInfo.username }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <div class="cell-item">
            <!-- <el-icon :style="iconStyle">
              <location />
            </el-icon> -->
            昵称
          </div>
        </template>
        {{ userInfo.nickname }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <div class="cell-item">
            <!-- <el-icon :style="iconStyle">
              <tickets />
            </el-icon> -->
            手机号
          </div>
        </template>
        {{ exUserInfo.phone }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <div class="cell-item">
            <!-- <el-icon :style="iconStyle">
              <tickets />
            </el-icon> -->
            邮箱
          </div>
        </template>
        {{ exUserInfo.email }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <div class="cell-item">
            <!-- <el-icon :style="iconStyle">
              <tickets />
            </el-icon> -->
            性别
          </div>
        </template>
        <el-tag size="small">{{ userInfo.gender === 1 ? "男" : "女" }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <div class="cell-item">
            <!-- <el-icon :style="iconStyle">
              <tickets />
            </el-icon> -->
            实名状态
          </div>
        </template>
        <el-tag size="small">{{
          userInfo.isRealName === true ? "已实名" : "未实名"
        }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <div class="cell-item">
            <!-- <el-icon :style="iconStyle">
              <office-building />
            </el-icon> -->
            生日
          </div>
        </template>
        {{ userInfo.birthday.substring(0, 10) }}
      </el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
// import {
//   Iphone,
//   Location,
//   OfficeBuilding,
//   Tickets,
//   User
// } from "@element-plus/icons-vue";
import { getUserInfoApi } from "@/api";
// import User from "@iconify-icons/ri/user-3-fill";
import { message } from "@/utils/message";
import type { ComponentSize } from "element-plus";

defineOptions({
  name: "profile"
});
const size = ref<ComponentSize>("default");
// const iconStyle = computed(() => {
//   const marginMap = {
//     large: "8px",
//     default: "6px",
//     small: "4px"
//   };
//   return {
//     marginRight: marginMap[size.value] || marginMap.default
//   };
// });
// const blockMargin = computed(() => {
//   const marginMap = {
//     large: "32px",
//     default: "28px",
//     small: "24px"
//   };
//   return {
//     marginTop: marginMap[size.value] || marginMap.default
//   };
// });

const userInfo = ref({
  id: 0,
  userId: "",
  avatarId: "",
  nickname: "",
  isRealName: false,
  birthday: "",
  gender: 1,
  isCN: true,
  updateAt: ""
});
const exUserInfo = ref({
  phone: "",
  email: "",
  username: ""
});
const getUserInfo = async () => {
  const res = await getUserInfoApi();
  const { data, code } = res;
  const { info, phone, email, username } = data;
  if (code === 200) {
    userInfo.value = info;
    exUserInfo.value = { phone, email, username };
  } else {
    message(res.message, { type: "error" });
  }
};
onMounted(() => {
  getUserInfo();
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

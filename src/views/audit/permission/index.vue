<script setup lang="ts">
import { computed, ref } from "vue";
import { Auth } from "@/components/ReAuth";
import { filterNoPermissionTree } from "@/router/utils/filter";
import { useUserStoreHook } from "@/store/modules/user";

defineOptions({
  name: "AuditPermissionPreview"
});

const refreshTick = ref(0);
const exportPerms: string[] = ["audit:export"];
const deletePerms: string[] = ["audit:delete"];
const sampleRoutes = [
  {
    path: "/audit/admin-only",
    meta: {
      title: "管理员菜单",
      roles: ["admin"]
    }
  },
  {
    path: "/audit/auditor-only",
    meta: {
      title: "审计员菜单",
      roles: ["auditor"]
    }
  },
  {
    path: "/audit/shared",
    meta: {
      title: "共享菜单",
      roles: ["admin", "auditor"]
    }
  }
];

const storeRolesText = computed(() => {
  refreshTick.value;
  return (useUserStoreHook().roles ?? []).join(",") || "(empty)";
});

const localStorageRolesText = computed(() => {
  refreshTick.value;
  try {
    const raw = localStorage.getItem("user-info");
    if (!raw) return "(empty)";
    const parsed = JSON.parse(raw) as { roles?: string[] };
    return Array.isArray(parsed.roles) ? parsed.roles.join(",") : "(empty)";
  } catch {
    return "(invalid)";
  }
});

const menuPreviewTitles = computed(() => {
  refreshTick.value;
  return filterNoPermissionTree(sampleRoutes)
    .map(route => String(route.meta?.title || route.path))
    .join(" | ");
});

const refreshPreview = () => {
  refreshTick.value += 1;
};
</script>

<template>
  <div class="main p-4">
    <el-card class="mb-4">
      <template #header>按钮权限预览</template>
      <div class="flex gap-3">
        <el-button
          v-auth="exportPerms"
          type="primary"
          data-testid="auth-export-button"
        >
          允许导出
        </el-button>
        <Auth :value="deletePerms">
          <el-button type="danger" data-testid="auth-delete-button">
            允许删除
          </el-button>
        </Auth>
      </div>
    </el-card>

    <el-card>
      <template #header>菜单过滤预览</template>
      <el-descriptions :column="1" border class="mb-4">
        <el-descriptions-item label="Store Roles">
          <span data-testid="store-roles">{{ storeRolesText }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="LocalStorage Roles">
          <span data-testid="local-storage-roles">{{
            localStorageRolesText
          }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="菜单结果">
          <span data-testid="menu-preview">{{ menuPreviewTitles }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <el-button
        data-testid="refresh-permission-preview"
        @click="refreshPreview"
      >
        刷新预览
      </el-button>
    </el-card>
  </div>
</template>

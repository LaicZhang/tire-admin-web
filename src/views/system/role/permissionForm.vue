<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import { ElMessageBox, ElTree } from "element-plus";
import {
  getRolePermissionTreeApi,
  getRolePermissionsApi,
  setRolePermissionsApi,
  type RolePermissionTreeNode
} from "@/api/system/role";
import { handleApiError, message } from "@/utils";

const props = defineProps<{
  uid: string;
}>();

const loading = ref(false);
const treeRef = ref<InstanceType<typeof ElTree>>();
const permissionTree = ref<RolePermissionTreeNode[]>([]);

async function loadPermissionTree() {
  const { code, data, msg } = await getRolePermissionTreeApi();
  if (code !== 200) {
    message(msg || "获取权限树失败", { type: "error" });
    return [];
  }
  return Array.isArray(data) ? data : [];
}

async function loadCheckedKeys() {
  const { code, data, msg } = await getRolePermissionsApi(props.uid);
  if (code !== 200) {
    message(msg || "获取角色权限失败", { type: "error" });
    return [];
  }
  return Array.isArray(data) ? data : [];
}

async function promptSensitiveReason(): Promise<string | null> {
  try {
    const result = await ElMessageBox.prompt(
      "赋权为敏感操作，请填写操作原因（至少 5 个字符）",
      "确认赋权",
      {
        confirmButtonText: "确认保存",
        cancelButtonText: "取消",
        inputPlaceholder: "例如：按岗位调整销售权限",
        inputValidator: (value: string) => {
          const reason = (value ?? "").trim();
          if (reason.length < 5) return "操作原因至少需要 5 个字符";
          return true;
        }
      }
    );
    const reason =
      typeof result === "string" ? result : String(result?.value ?? "");
    return reason.trim();
  } catch {
    return null;
  }
}

async function submit() {
  try {
    const reason = await promptSensitiveReason();
    if (!reason) return false;

    const permissionUids = (treeRef.value?.getCheckedKeys(true) ??
      []) as string[];
    const { code, msg } = await setRolePermissionsApi(
      props.uid,
      permissionUids,
      {
        confirm: true,
        reason
      }
    );
    if (code !== 200) {
      message(msg || "保存失败", { type: "error" });
      return false;
    }
    message("保存成功", { type: "success" });
    return true;
  } catch (error) {
    handleApiError(error, "保存角色权限失败");
    return false;
  }
}

defineExpose({ submit });

onMounted(async () => {
  loading.value = true;
  try {
    const [treeData, checkedKeys] = await Promise.all([
      loadPermissionTree(),
      loadCheckedKeys()
    ]);
    permissionTree.value = treeData;
    await nextTick();
    treeRef.value?.setCheckedKeys(checkedKeys, false);
  } catch (error) {
    handleApiError(error, "加载角色权限失败");
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div v-loading="loading" class="min-h-[360px]">
    <el-empty
      v-if="!loading && permissionTree.length === 0"
      description="暂无可分配权限"
    />
    <el-tree
      v-else
      ref="treeRef"
      node-key="key"
      show-checkbox
      default-expand-all
      :data="permissionTree"
      :props="{ label: 'label', children: 'children' }"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElTree } from "element-plus";
import { message } from "@/utils/message";
import { handleTree } from "@/utils/tree";
import { getMenuListApi } from "@/api/system/menu";
import {
  getPositionMenuUidsApi,
  setPositionMenusApi
} from "@/api/company/position";

type MenuItem = {
  uid: string;
  parentId: string | null;
  name: string;
  title?: string | null;
  children?: MenuItem[];
  label?: string;
};

const props = defineProps<{
  uid: string;
}>();

const loading = ref(false);
const treeRef = ref<InstanceType<typeof ElTree>>();
const menuTree = ref<MenuItem[]>([]);

async function loadMenus() {
  const { code, data, msg } = await getMenuListApi();
  if (code !== 200) {
    message(msg || "获取菜单列表失败", { type: "error" });
    return;
  }
  const list = (data as MenuItem[]).map(m => ({
    ...m,
    label: m.title || m.name
  }));
  menuTree.value = handleTree(
    list,
    "uid",
    "parentId",
    "children"
  ) as MenuItem[];
}

async function loadCheckedKeys() {
  const { code, data, msg } = await getPositionMenuUidsApi(props.uid);
  if (code !== 200) {
    message(msg || "获取岗位菜单失败", { type: "error" });
    return;
  }
  treeRef.value?.setCheckedKeys(data as string[], false);
}

async function submit() {
  const checked = (treeRef.value?.getCheckedKeys(false) ?? []) as string[];
  const halfChecked = (treeRef.value?.getHalfCheckedKeys() ?? []) as string[];
  const menuUids = Array.from(new Set([...checked, ...halfChecked]));
  const { code, msg } = await setPositionMenusApi(props.uid, menuUids);
  if (code === 200) {
    message("保存成功", { type: "success" });
    return true;
  }
  message(msg || "保存失败", { type: "error" });
  return false;
}

defineExpose({ submit });

onMounted(async () => {
  loading.value = true;
  try {
    await loadMenus();
    await loadCheckedKeys();
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div v-loading="loading" class="min-h-[320px]">
    <el-tree
      ref="treeRef"
      node-key="uid"
      show-checkbox
      :data="menuTree"
      :props="{ label: 'label', children: 'children' }"
      default-expand-all
    />
  </div>
</template>

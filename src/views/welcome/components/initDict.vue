<script setup lang="ts">
import { onMounted } from "vue";
import { getSysDictApi } from "@/api";
import { message } from "@/utils/message";
import { localForage, SYS } from "@/utils";

defineOptions({
  name: "initDict"
});

type DictItem = {
  name?: string;
  [key: string]: any;
};

const groupByName = (items: DictItem[]) => {
  const result: Record<string, DictItem[]> = {};
  for (const item of items) {
    const key = item?.name;
    if (!key) continue;
    (result[key] ||= []).push(item);
  }
  return result;
};

const initDict = async () => {
  // const sysDict = await localForage().getItem(SYS.dict);
  // if (sysDict) return;
  try {
    const { code, data, msg } = await getSysDictApi();
    if (code === 200) {
      await localForage().setItem(
        SYS.dict,
        groupByName(Array.isArray(data) ? data : [])
      );
    } else {
      message(msg, { type: "error" });
    }
  } catch (error: any) {
    console.error("初始化字典失败:", error);
  }
};
onMounted(() => {
  initDict();
});
</script>

<template>
  <div />
</template>

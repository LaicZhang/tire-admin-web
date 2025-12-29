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

const SYS_DICT_UPDATED_AT_KEY = `${SYS.dict}_updated_at`;
const SYS_DICT_REFRESH_INTERVAL = 12 * 60 * 60 * 1000; // 12h

const groupByName = (items: DictItem[]) => {
  const result: Record<string, DictItem[]> = {};
  for (const item of items) {
    const key = item?.name;
    if (!key) continue;
    (result[key] ||= []).push(item);
  }
  return result;
};

const refreshDict = async (silent = false) => {
  try {
    const { code, data, msg } = await getSysDictApi();
    if (code === 200) {
      await localForage().setItem(
        SYS.dict,
        groupByName(Array.isArray(data) ? (data as DictItem[]) : [])
      );
      await localForage().setItem(SYS_DICT_UPDATED_AT_KEY, Date.now());
    } else {
      if (!silent) message(msg, { type: "error" });
    }
  } catch (error: any) {
    if (!silent) console.error("初始化字典失败:", error);
  }
};

const shouldRefresh = async () => {
  const lastUpdated = await localForage().getItem<number>(
    SYS_DICT_UPDATED_AT_KEY
  );
  return !lastUpdated || Date.now() - lastUpdated > SYS_DICT_REFRESH_INTERVAL;
};

onMounted(() => {
  (async () => {
    const cached = await localForage().getItem<Record<string, DictItem[]>>(
      SYS.dict
    );
    if (!cached) {
      await refreshDict();
      return;
    }

    // 已有缓存则后台刷新，避免每次进入首页都打接口
    if (await shouldRefresh()) refreshDict(true);
  })();
});
</script>

<template>
  <div />
</template>

<script setup lang="ts">
import { ref, markRaw, onMounted } from "vue";
import { getSysDictApi } from "@/api";
import { message } from "@/utils/message";
import { localForage, SYS } from "@/utils";

defineOptions({
  name: "initDict"
});
const initDict = async () => {
  // const sysDict = await localForage().getItem(SYS.dict);
  // if (sysDict) return;
  const { code, data, msg } = await getSysDictApi();
  if (code === 200) {
    await localForage().setItem(
      SYS.dict,
      Object.groupBy(data, ({ name }) => name)
    );
  } else message(msg, { type: "error" });
};
onMounted(() => {
  initDict();
});
</script>

<template>
  <div />
</template>

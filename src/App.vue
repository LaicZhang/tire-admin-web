<template>
  <!-- <el-config-provider :locale="currentLocale"> -->
  <el-config-provider>
    <router-view />
    <ReDialog />
  </el-config-provider>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElConfigProvider } from "element-plus";
// import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import { ReDialog } from "@/components/ReDialog";
export default defineComponent({
  name: "app",
  components: {
    ElConfigProvider,
    ReDialog
  }
  // computed: {
  //   currentLocale() {
  //     return zhCn;
  //   }
  // }
});
</script>

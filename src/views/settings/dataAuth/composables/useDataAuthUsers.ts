import { ref } from "vue";
import { message } from "@/utils";
import { getDataAuthUsersApi } from "@/api/setting";
import type { DataAuthUser } from "../types";

export function useDataAuthUsers() {
  const loading = ref(false);
  const userList = ref<DataAuthUser[]>([]);

  const loadData = async () => {
    loading.value = true;
    try {
      const { code, data, msg } = await getDataAuthUsersApi();
      if (code !== 200) {
        message(msg || "加载数据授权用户列表失败", { type: "error" });
        return;
      }
      userList.value = Array.isArray(data)
        ? (data as DataAuthUser[])
        : ((data as { list?: DataAuthUser[] })?.list ?? []);
    } catch {
      message("加载数据授权用户列表失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    userList,
    loadData
  };
}

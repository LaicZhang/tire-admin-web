import { ref, watch } from "vue";
import { message } from "@/utils";
import { getUserDataAuthApi, syncCustomerAuthApi } from "@/api/setting";
import { normalizeAuthItems } from "../utils";
import type { AuthItem, DataAuthUser } from "../types";

export function useUserDataAuthDetail() {
  const detailLoading = ref(false);
  const customerList = ref<AuthItem[]>([]);
  const supplierList = ref<AuthItem[]>([]);
  const warehouseList = ref<AuthItem[]>([]);
  const customerAuthMode = ref<"all" | "partial">("partial");
  const supplierAuthMode = ref<"all" | "partial">("partial");
  const warehouseAuthMode = ref<"all" | "partial">("partial");

  const loadUserAuthDetail = async (
    userId: string,
    currentUser: DataAuthUser | null
  ) => {
    detailLoading.value = true;
    try {
      const { code, data, msg } = await getUserDataAuthApi(userId);
      if (code !== 200) {
        message(msg || "加载用户授权数据失败", { type: "error" });
        return;
      }

      const detail = data as {
        customers?: unknown;
        customerList?: unknown;
        suppliers?: unknown;
        supplierList?: unknown;
        warehouses?: unknown;
        warehouseList?: unknown;
        customerAuth?: "all" | "partial";
        supplierAuth?: "all" | "partial";
        warehouseAuth?: "all" | "partial";
      };
      customerList.value = normalizeAuthItems(
        detail?.customers ?? detail?.customerList
      );
      supplierList.value = normalizeAuthItems(
        detail?.suppliers ?? detail?.supplierList
      );
      warehouseList.value = normalizeAuthItems(
        detail?.warehouses ?? detail?.warehouseList
      );

      customerAuthMode.value =
        detail?.customerAuth ??
        detail?.customerAuthMode ??
        currentUser?.customerAuth ??
        "partial";
      supplierAuthMode.value =
        detail?.supplierAuth ??
        detail?.supplierAuthMode ??
        currentUser?.supplierAuth ??
        "partial";
      warehouseAuthMode.value =
        detail?.warehouseAuth ??
        detail?.warehouseAuthMode ??
        currentUser?.warehouseAuth ??
        "partial";
    } catch {
      message("加载用户授权数据失败", { type: "error" });
    } finally {
      detailLoading.value = false;
    }
  };

  const syncCustomers = async (userId: string) => {
    try {
      const { ElMessageBox } = await import("element-plus");
      await ElMessageBox.confirm(
        "将同步该用户自己创建的客户到授权列表，是否继续？",
        "同步客户",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "info"
        }
      );
      detailLoading.value = true;
      const { code, msg } = await syncCustomerAuthApi(userId);
      if (code === 200) {
        message("同步成功", { type: "success" });
        await loadUserAuthDetail(userId, null);
      } else {
        message(msg || "同步失败", { type: "error" });
      }
    } catch {
      // cancelled
    } finally {
      detailLoading.value = false;
    }
  };

  const reset = () => {
    customerList.value = [];
    supplierList.value = [];
    warehouseList.value = [];
    customerAuthMode.value = "partial";
    supplierAuthMode.value = "partial";
    warehouseAuthMode.value = "partial";
  };

  // 监听授权模式变化，切换到全部时清空列表
  watch(customerAuthMode, mode => {
    if (mode === "all") customerList.value = [];
  });
  watch(supplierAuthMode, mode => {
    if (mode === "all") supplierList.value = [];
  });
  watch(warehouseAuthMode, mode => {
    if (mode === "all") warehouseList.value = [];
  });

  return {
    detailLoading,
    customerList,
    supplierList,
    warehouseList,
    customerAuthMode,
    supplierAuthMode,
    warehouseAuthMode,
    loadUserAuthDetail,
    syncCustomers,
    reset
  };
}

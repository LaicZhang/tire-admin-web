import { ref } from "vue";
import { getProviderListApi } from "@/api/business/provider";
import { getCustomerListApi } from "@/api/business/customer";
import { getPaymentListApi } from "@/api/payment";
import { logger } from "@/utils/logger";

export interface SelectOption {
  uid: string;
  name: string;
  balance?: number;
}

/**
 * Fund 模块通用数据加载 composable
 * 用于加载供应商、客户、账户等下拉选项
 */
export function useFundForm() {
  const providerList = ref<SelectOption[]>([]);
  const customerList = ref<SelectOption[]>([]);
  const paymentList = ref<SelectOption[]>([]);

  const loadingProviders = ref(false);
  const loadingCustomers = ref(false);
  const loadingPayments = ref(false);

  async function loadProviders() {
    if (loadingProviders.value) return;
    loadingProviders.value = true;
    try {
      const res = await getProviderListApi(1, { keyword: "" });
      providerList.value = res.data?.list || [];
    } catch (e) {
      logger.error("加载供应商列表失败", e);
    } finally {
      loadingProviders.value = false;
    }
  }

  async function loadCustomers() {
    if (loadingCustomers.value) return;
    loadingCustomers.value = true;
    try {
      const res = await getCustomerListApi(1, { keyword: "" });
      customerList.value = res.data?.list || [];
    } catch (e) {
      logger.error("加载客户列表失败", e);
    } finally {
      loadingCustomers.value = false;
    }
  }

  async function loadPayments() {
    if (loadingPayments.value) return;
    loadingPayments.value = true;
    try {
      const res = await getPaymentListApi();
      paymentList.value = (res.data as SelectOption[]) || [];
    } catch (e) {
      logger.error("加载账户列表失败", e);
    } finally {
      loadingPayments.value = false;
    }
  }

  return {
    // 数据
    providerList,
    customerList,
    paymentList,
    // 加载状态
    loadingProviders,
    loadingCustomers,
    loadingPayments,
    // 方法
    loadProviders,
    loadCustomers,
    loadPayments
  };
}

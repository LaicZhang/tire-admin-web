/**
 * Fund 表单通用数据加载 composable
 * 抽取供应商、客户、账户列表的加载逻辑
 */
import { ref } from "vue";
import { getProviderListApi } from "@/api/business/provider";
import { getCustomerListApi } from "@/api/business/customer";
import { getPaymentListApi } from "@/api/payment";
import { logger } from "@/utils/logger";

/** 基础选项类型 */
export interface SelectOption {
  uid: string;
  name: string;
}

/** 账户选项类型（含余额） */
export interface PaymentOption extends SelectOption {
  balance?: number;
}

/**
 * 加载供应商列表
 */
export function useProviderList() {
  const providerList = ref<SelectOption[]>([]);
  const loading = ref(false);

  async function loadProviders() {
    loading.value = true;
    try {
      const res = await getProviderListApi(1, { keyword: "" });
      providerList.value = res.data?.list || [];
    } catch (e) {
      logger.error("加载供应商列表失败", e);
      providerList.value = [];
    } finally {
      loading.value = false;
    }
  }

  return { providerList, loading, loadProviders };
}

/**
 * 加载客户列表
 */
export function useCustomerList() {
  const customerList = ref<SelectOption[]>([]);
  const loading = ref(false);

  async function loadCustomers() {
    loading.value = true;
    try {
      const res = await getCustomerListApi(1, { keyword: "" });
      customerList.value = res.data?.list || [];
    } catch (e) {
      logger.error("加载客户列表失败", e);
      customerList.value = [];
    } finally {
      loading.value = false;
    }
  }

  return { customerList, loading, loadCustomers };
}

/**
 * 加载账户列表
 */
export function usePaymentList() {
  const paymentList = ref<PaymentOption[]>([]);
  const loading = ref(false);

  async function loadPayments() {
    loading.value = true;
    try {
      const res = await getPaymentListApi();
      paymentList.value = (res.data as PaymentOption[]) || [];
    } catch (e) {
      logger.error("加载账户列表失败", e);
      paymentList.value = [];
    } finally {
      loading.value = false;
    }
  }

  return { paymentList, loading, loadPayments };
}

/**
 * 组合加载（供应商 + 账户）
 * 用于付款单、其他支出等表单
 */
export function useProviderAndPaymentList() {
  const { providerList, loadProviders } = useProviderList();
  const { paymentList, loadPayments } = usePaymentList();

  async function loadAll() {
    await Promise.all([loadProviders(), loadPayments()]);
  }

  return { providerList, paymentList, loadProviders, loadPayments, loadAll };
}

/**
 * 组合加载（客户 + 供应商）
 * 用于核销单等表单
 */
export function useCustomerAndProviderList() {
  const { customerList, loadCustomers } = useCustomerList();
  const { providerList, loadProviders } = useProviderList();

  async function loadAll() {
    await Promise.all([loadCustomers(), loadProviders()]);
  }

  return {
    customerList,
    providerList,
    loadCustomers,
    loadProviders,
    loadAll
  };
}

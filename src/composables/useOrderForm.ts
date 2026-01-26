/**
 * 订单表单 Composable
 * 封装采购/销售订单表单的通用逻辑
 */

import { ref, computed } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ALL_LIST, localForage, message } from "@/utils";
import { getPaymentListApi, getCompanyId } from "@/api";

export interface OrderDetailBase {
  tireId?: string;
  count?: number;
  unitPrice?: number;
  total?: number;
  repoId?: string;
  [key: string]: unknown;
}

/** 折扣相关字段 */
export interface OrderDetailDiscount {
  discountRate?: number;
  discountAmount?: number;
}

/** 物流相关字段 */
export interface OrderDetailShipping {
  isArrival?: boolean;
  isShipped?: boolean;
  isDelivered?: boolean;
}

/** 订单表单数据结构 */
export interface OrderFormData<T extends OrderDetailBase> {
  count?: number;
  total?: number;
  showTotal?: number;
  details: T[];
  [key: string]: unknown;
}

export interface OrderFormOptions<T extends OrderDetailBase> {
  /** 表单数据 */
  formData: T;
  /** 表单标题（用于判断只读状态） */
  formTitle: string;
  /** 主数据源类型：provider=供应商, customer=客户 */
  mainDataType: "provider" | "customer";
  /** 验证规则 */
  rules?: FormRules;
  /** 是否显示折扣 */
  showDiscount?: boolean;
  /** 是否显示到货/发货开关 */
  showArrivalOrShipped?: boolean;
}

export function useOrderForm<T extends OrderDetailBase>(
  options: OrderFormOptions<T>
) {
  const {
    formData,
    formTitle,
    mainDataType,
    rules,
    showDiscount,
    showArrivalOrShipped
  } = options;

  const ruleFormRef = ref<FormInstance>();
  const loading = ref(false);

  interface SelectItem {
    uid: string;
    name: string;
    balance?: number;
  }

  const mainList = ref<SelectItem[]>([]);
  const allTireList = ref<SelectItem[]>([]);
  const allRepoList = ref<SelectItem[]>([]);
  const managerList = ref<SelectItem[]>([]);
  const allPaymentList = ref<SelectItem[]>([]);

  const isReadOnly = computed(() => ["查看", "审核"].includes(formTitle));
  const isEditable = computed(() => ["新增", "修改"].includes(formTitle));

  const _amountFields = computed(() => ({
    count: "count" as const,
    total: "total" as const,
    showTotal: "showTotal" as const,
    paidAmount: "paidAmount" as const
  }));

  async function loadBaseData() {
    loading.value = true;
    try {
      const mainKey =
        mainDataType === "provider" ? ALL_LIST.provider : ALL_LIST.customer;
      const [mainData, tireData, repoData, managerData] = await Promise.all([
        localForage().getItem(mainKey),
        localForage().getItem(ALL_LIST.tire),
        localForage().getItem(ALL_LIST.repo),
        localForage().getItem(ALL_LIST.manager)
      ]);

      mainList.value = (mainData as SelectItem[]) || [];
      allTireList.value = (tireData as SelectItem[]) || [];
      allRepoList.value = (repoData as SelectItem[]) || [];
      managerList.value = (managerData as SelectItem[]) || [];

      const cid = await getCompanyId();
      const { data: paymentData } = await getPaymentListApi(cid);
      const paymentList = paymentData as SelectItem[] | { list?: SelectItem[] };
      allPaymentList.value = Array.isArray(paymentList)
        ? paymentList
        : paymentList?.list || [];
    } catch {
      message("加载基础数据失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  function onAddDetail(defaultFields?: Partial<T>) {
    const baseDetail: OrderDetailBase = {
      tireId: "",
      count: 1,
      unitPrice: 0,
      total: 0,
      repoId: ""
    };

    const discountFields: OrderDetailDiscount = showDiscount
      ? { discountRate: 0, discountAmount: 0 }
      : {};

    const shippingFields: OrderDetailShipping = showArrivalOrShipped
      ? mainDataType === "provider"
        ? { isArrival: false }
        : { isShipped: false, isDelivered: false }
      : {};

    const newDetail = {
      ...baseDetail,
      ...discountFields,
      ...shippingFields,
      ...defaultFields
    } as T;

    (formData as unknown as OrderFormData<T>).details.push(newDetail);
    return newDetail;
  }

  function onDeleteDetail(index: number) {
    const details = (formData as unknown as OrderFormData<T>).details;
    const _detail = details[index];
    recalcOrderTotal();
    details.splice(index, 1);
  }

  function calcDetailTotal(row: T & OrderDetailDiscount) {
    const count = row.count || 0;
    const unitPrice = row.unitPrice || 0;

    if (showDiscount) {
      const discountRate = row.discountRate || 0;
      const baseTotal = count * unitPrice;
      row.discountAmount = baseTotal * (discountRate / 100);
      row.total = baseTotal - (row.discountAmount || 0);
    } else {
      row.total = count * unitPrice;
    }

    recalcOrderTotal();
  }

  function recalcOrderTotal() {
    const orderData = formData as unknown as OrderFormData<T>;
    const details = orderData.details;
    let totalCount = 0;
    let totalAmount = 0;

    details.forEach(d => {
      totalCount += d.count || 0;
      totalAmount += d.total || 0;
    });

    orderData.count = totalCount;
    orderData.total = totalAmount;
    orderData.showTotal = totalAmount;
  }

  function getRef() {
    return ruleFormRef.value;
  }

  return {
    ruleFormRef,
    formData,
    mainList,
    allTireList,
    allRepoList,
    managerList,
    allPaymentList,
    isReadOnly,
    isEditable,
    loading,
    rules,
    loadBaseData,
    onAddDetail,
    onDeleteDetail,
    calcDetailTotal,
    recalcOrderTotal,
    getRef
  };
}

import { ref } from "vue";
import {
  getOrderListApi,
  getPurchasePlanListApi,
  getPurchaseInquiryListApi,
  getSaleQuotationListApi
} from "@/api";
import { CUR_ORDER_TYPE, localForage, message, ORDER_TYPE } from "@/utils";
import {
  purchaseOrderColumns,
  saleOrderColumns,
  claimOrderColumns,
  returnOrderColumns,
  wasteOrderColumns,
  transferOrderColumns,
  assemblyOrderColumns,
  purchasePlanColumns,
  purchaseInquiryColumns,
  saleQuotationColumns
} from "../props";

/**
 * 订单列表 composable
 * 提取列表数据、分页、搜索等逻辑
 */
export function useOrderList() {
  const dataList = ref<any[]>([]);
  const loading = ref(false);
  const orderType = ref("");
  const columns = ref<any[]>([]);

  const form = ref({
    operatorId: undefined as string | undefined,
    auditorId: undefined as string | undefined,
    desc: undefined as string | undefined
  });

  const pagination = ref({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columnMapping: Record<string, any[]> = {
    [ORDER_TYPE.purchase]: purchaseOrderColumns,
    [ORDER_TYPE.sale]: saleOrderColumns,
    [ORDER_TYPE.claim]: claimOrderColumns,
    [ORDER_TYPE.return]: returnOrderColumns,
    [ORDER_TYPE.waste]: wasteOrderColumns,
    [ORDER_TYPE.transfer]: transferOrderColumns,
    [ORDER_TYPE.assembly]: assemblyOrderColumns,
    [ORDER_TYPE.purchasePlan]: purchasePlanColumns,
    [ORDER_TYPE.purchaseInquiry]: purchaseInquiryColumns,
    [ORDER_TYPE.saleQuotation]: saleQuotationColumns
  };

  const getOrderListInfo = async () => {
    if (orderType.value === "") return;
    let res;
    const params = {
      page: pagination.value.currentPage,
      limit: pagination.value.pageSize,
      ...form.value
    };

    if (orderType.value === ORDER_TYPE.purchasePlan) {
      res = await getPurchasePlanListApi(params);
    } else if (orderType.value === ORDER_TYPE.purchaseInquiry) {
      res = await getPurchaseInquiryListApi(params);
    } else if (orderType.value === ORDER_TYPE.saleQuotation) {
      res = await getSaleQuotationListApi(params);
    } else {
      res = await getOrderListApi(
        orderType.value,
        pagination.value.currentPage,
        form.value
      );
    }

    const { data, code, msg } = res;
    if (code === 200) {
      dataList.value = data.list;
      pagination.value.total = data.count;
    } else {
      message(msg, { type: "error" });
    }
  };

  const onSearch = async () => {
    loading.value = true;
    const { data, code, msg } = await getOrderListApi(
      orderType.value,
      pagination.value.currentPage,
      form.value
    );

    if (code === 200) {
      dataList.value = data.list;
      pagination.value.total = data.count;
    } else {
      message(msg, { type: "error" });
    }
    loading.value = false;
  };

  const setOrderType = async () => {
    try {
      const type = orderType.value;
      await localForage().setItem(CUR_ORDER_TYPE, type);
      columns.value = columnMapping[orderType.value] || columns.value;
      await onSearch();
    } catch (e: any) {
      throw new Error("fail to set order type for " + e.message);
    }
  };

  const getOrderType = async () => {
    const curOrderType: string | null =
      await localForage().getItem(CUR_ORDER_TYPE);
    if (curOrderType) {
      orderType.value = curOrderType;
      await setOrderType();
    }
  };

  const handleCurrentChange = async (val: number) => {
    pagination.value.currentPage = val;
    await getOrderListInfo();
  };

  const resetForm = (formEl: any) => {
    loading.value = true;
    if (!formEl) return;
    formEl.resetFields();
    loading.value = false;
  };

  return {
    dataList,
    loading,
    orderType,
    columns,
    form,
    pagination,
    getOrderListInfo,
    onSearch,
    setOrderType,
    getOrderType,
    handleCurrentChange,
    resetForm
  };
}

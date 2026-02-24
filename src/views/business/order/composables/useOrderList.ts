import { ref } from "vue";
import type { FormInstance } from "element-plus";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import {
  getOrderListApi,
  getPurchasePlanListApi,
  getPurchaseInquiryListApi,
  getSaleQuotationListApi
} from "@/api";
import {
  CUR_ORDER_TYPE,
  localForage,
  message,
  ORDER_TYPE,
  handleApiError
} from "@/utils";
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
import type { OrderRow } from "./useOrderActions";

/** 表格列配置类型 */
export interface TableColumn {
  label: string;
  prop?: string;
  slot?: string;
  fixed?: string | boolean;
  width?: number;
  minWidth?: number;
  formatter?: (
    row: OrderRow,
    column: TableColumn,
    cellValue: unknown
  ) => string;
  cellRenderer?: (data: { row: OrderRow }) => JSX.Element;
}

/**
 * 订单列表 composable
 * 提取列表数据、分页、搜索等逻辑
 */
export function useOrderList() {
  const dataList = ref<OrderRow[]>([]);
  const loading = ref(false);
  const orderType = ref("");
  const columns = ref<TableColumn[]>([]);

  const form = ref({
    operatorId: undefined as string | undefined,
    auditorId: undefined as string | undefined,
    desc: undefined as string | undefined,
    keyword: undefined as string | undefined
  });

  const pagination = ref({
    total: 0,
    pageSize: PAGE_SIZE_SMALL,
    currentPage: 1,
    background: true
  });

  const columnMapping: Record<string, TableColumn[]> = {
    [ORDER_TYPE.purchase]: purchaseOrderColumns as TableColumn[],
    [ORDER_TYPE.sale]: saleOrderColumns as TableColumn[],
    [ORDER_TYPE.claim]: claimOrderColumns as TableColumn[],
    [ORDER_TYPE.return]: returnOrderColumns as TableColumn[],
    [ORDER_TYPE.waste]: wasteOrderColumns as TableColumn[],
    [ORDER_TYPE.transfer]: transferOrderColumns as TableColumn[],
    [ORDER_TYPE.assembly]: assemblyOrderColumns as TableColumn[],
    [ORDER_TYPE.purchasePlan]: purchasePlanColumns as TableColumn[],
    [ORDER_TYPE.purchaseInquiry]: purchaseInquiryColumns as TableColumn[],
    [ORDER_TYPE.saleQuotation]: saleQuotationColumns as TableColumn[]
  };

  const getOrderListInfo = async () => {
    if (orderType.value === "") return;

    try {
      loading.value = true;
      let res: CommonResult<PaginatedResponseDto<OrderRow>>;
      const params = {
        page: pagination.value.currentPage,
        limit: pagination.value.pageSize,
        ...form.value
      };

      if (orderType.value === ORDER_TYPE.purchasePlan) {
        res = (await getPurchasePlanListApi(params)) as CommonResult<
          PaginatedResponseDto<OrderRow>
        >;
      } else if (orderType.value === ORDER_TYPE.purchaseInquiry) {
        res = (await getPurchaseInquiryListApi(params)) as CommonResult<
          PaginatedResponseDto<OrderRow>
        >;
      } else if (orderType.value === ORDER_TYPE.saleQuotation) {
        res = (await getSaleQuotationListApi(params)) as CommonResult<
          PaginatedResponseDto<OrderRow>
        >;
      } else {
        res = (await getOrderListApi(
          orderType.value,
          pagination.value.currentPage,
          form.value
        )) as CommonResult<PaginatedResponseDto<OrderRow>>;
      }

      const { data, code, msg } = res;
      if (code === 200) {
        dataList.value = data.list;
        pagination.value.total = data.count;
      } else {
        message(msg, { type: "error" });
      }
    } catch (error) {
      handleApiError(error, "获取订单列表失败");
    } finally {
      loading.value = false;
    }
  };

  const onSearch = async () => {
    pagination.value.currentPage = 1;
    await getOrderListInfo();
  };

  const setOrderType = async () => {
    try {
      const type = orderType.value;
      await localForage().setItem(CUR_ORDER_TYPE, type);
      columns.value = columnMapping[orderType.value] || columns.value;
      await onSearch();
    } catch (error) {
      handleApiError(error, "设置订单类型失败");
    }
  };

  const getOrderType = async () => {
    try {
      const curOrderType: string | null =
        await localForage().getItem(CUR_ORDER_TYPE);
      if (curOrderType) {
        orderType.value = curOrderType;
        await setOrderType();
      }
    } catch (error) {
      handleApiError(error, "获取订单类型失败");
    }
  };

  const handleCurrentChange = async (val: number) => {
    pagination.value.currentPage = val;
    await getOrderListInfo();
  };

  const resetForm = (formEl: FormInstance | undefined) => {
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

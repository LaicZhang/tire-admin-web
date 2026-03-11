import { logisticStatusTextMap } from "./types";

export const orderTypeOptions = [
  { label: "采购订单", value: "purchase-order" },
  { label: "销售订单", value: "sale-order" },
  { label: "退货订单", value: "return-order" },
  { label: "调拨订单", value: "transfer-order" }
] as const;

const formatDateTime = (value: unknown) => {
  return value ? new Date(String(value)).toLocaleString() : "-";
};

export const columns: TableColumnList = [
  {
    label: "订单UID",
    prop: "uid"
  },
  {
    label: "订单类型",
    prop: "type",
    formatter: (_row, _column, cellValue) => {
      const option = orderTypeOptions.find(item => item.value === cellValue);
      return option?.label ?? cellValue;
    }
  },
  {
    label: "物流状态",
    prop: "logisticsStatus",
    formatter: (_row, _column, cellValue) => {
      return logisticStatusTextMap[String(cellValue)] || "未知";
    }
  },
  {
    label: "是否已到达",
    prop: "isArrival",
    formatter: (_row, _column, cellValue) => {
      return cellValue ? "是" : "否";
    }
  },
  {
    label: "发货时间",
    prop: "departureAt",
    formatter: (_row, _column, cellValue) => formatDateTime(cellValue)
  },
  {
    label: "到达时间",
    prop: "arrivalAt",
    formatter: (_row, _column, cellValue) => formatDateTime(cellValue)
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 240
  }
];

import { formatDate } from "@/utils";
import { formatMoneyFromFen } from "@/utils/formatMoney";

export const columns: TableColumnList = [
  {
    label: "ID",
    prop: "id"
  },
  {
    label: "名称",
    prop: "name"
  },
  {
    label: "应付余额",
    prop: "payableBalance",
    formatter: (_row, _column, cellValue) => {
      const value =
        typeof cellValue === "number" ? cellValue : Number(cellValue ?? 0);
      return `¥${formatMoneyFromFen(value)}`;
    }
  },
  {
    label: "联系人",
    prop: "contactName"
  },
  {
    label: "状态",
    prop: "status",
    formatter: (row, column, cellValue) => {
      return cellValue === true ? "正常" : "异常";
    }
  },
  {
    label: "是否个人",
    prop: "isIndividual",
    formatter: (row, column, cellValue) => {
      return cellValue === true ? "个人" : "公司";
    }
  },
  {
    label: "是否公开",
    prop: "isPublic",
    formatter: (row, column, cellValue) => {
      return cellValue === true ? "公开" : "不公开";
    }
  },
  {
    label: "最后联络时间",
    prop: "lastContactAt",
    formatter: (row, column, cellValue) => {
      return formatDate(cellValue);
    }
  },
  {
    label: "备注",
    prop: "desc"
  },
  {
    label: "删除时间",
    prop: "deleteAt",
    formatter: (row, column, cellValue) => {
      return formatDate(cellValue);
    }
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 120
  }
];

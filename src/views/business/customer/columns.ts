import { formatDate } from "@/utils";
import { formatMoneyFromFen } from "@/utils/formatMoney";

import { hideOnMobile } from "@/utils/viewport";

export const columns: TableColumnList = [
  {
    label: "ID",
    hide: hideOnMobile,
    prop: "id"
  },
  {
    label: "名称",
    prop: "name"
  },
  {
    label: "应收余额",
    prop: "receivableBalance",
    formatter: (_row, _column, cellValue) => {
      const value =
        typeof cellValue === "number" ? cellValue : Number(cellValue ?? 0);
      return `¥${formatMoneyFromFen(value)}`;
    }
  },
  {
    label: "等级",
    hide: hideOnMobile,
    prop: "level"
  },
  {
    label: "总消费",
    hide: hideOnMobile,
    prop: "totalTransactionAmount"
  },
  {
    label: "限制",
    hide: hideOnMobile,
    prop: "limit"
  },
  {
    label: "客户来源",
    hide: hideOnMobile,
    prop: "from"
  },
  {
    label: "是否公开",
    prop: "isPublic",
    formatter: (row, column, cellValue) => {
      return cellValue === true ? "公开" : "不公开";
    }
  },
  {
    label: "备注",
    hide: hideOnMobile,
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

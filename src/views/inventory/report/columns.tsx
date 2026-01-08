import dayjs from "dayjs";
import { fenToYuan } from "@/utils/formatMoney";

export const balanceColumns: TableColumnList = [
  {
    label: "商品名称",
    prop: "tireName",
    minWidth: 150,
    fixed: "left"
  },
  {
    label: "商品编码",
    prop: "tireBarcode",
    width: 140
  },
  {
    label: "仓库",
    prop: "repoName",
    width: 120
  },
  {
    label: "库存数量",
    prop: "quantity",
    width: 100,
    cellRenderer: ({ row }) => {
      const color = row.quantity < 0 ? "text-red-600" : "";
      return <span class={color}>{row.quantity}</span>;
    }
  },
  {
    label: "单位成本",
    prop: "unitCost",
    width: 100,
    formatter: row => (row.unitCost ? `¥${fenToYuan(row.unitCost)}` : "-")
  },
  {
    label: "库存金额",
    prop: "totalCost",
    width: 120,
    formatter: row => (row.totalCost ? `¥${fenToYuan(row.totalCost)}` : "-")
  },
  {
    label: "最近入库",
    prop: "lastInboundDate",
    width: 120,
    formatter: row =>
      row.lastInboundDate
        ? dayjs(row.lastInboundDate).format("YYYY-MM-DD")
        : "-"
  },
  {
    label: "最近出库",
    prop: "lastOutboundDate",
    width: 120,
    formatter: row =>
      row.lastOutboundDate
        ? dayjs(row.lastOutboundDate).format("YYYY-MM-DD")
        : "-"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 100
  }
];

export const detailColumns: TableColumnList = [
  {
    label: "单据编号",
    prop: "orderNumber",
    width: 180
  },
  {
    label: "单据类型",
    prop: "orderType",
    width: 100
  },
  {
    label: "商品名称",
    prop: "tireName",
    minWidth: 150
  },
  {
    label: "仓库",
    prop: "repoName",
    width: 120
  },
  {
    label: "方向",
    prop: "direction",
    width: 80,
    cellRenderer: ({ row }) => (
      <el-tag type={row.direction === "in" ? "success" : "danger"} size="small">
        {row.direction === "in" ? "入库" : "出库"}
      </el-tag>
    )
  },
  {
    label: "数量",
    prop: "quantity",
    width: 80
  },
  {
    label: "单位成本",
    prop: "unitCost",
    width: 100,
    formatter: row => (row.unitCost ? `¥${fenToYuan(row.unitCost)}` : "-")
  },
  {
    label: "金额",
    prop: "totalCost",
    width: 100,
    formatter: row => (row.totalCost ? `¥${fenToYuan(row.totalCost)}` : "-")
  },
  {
    label: "操作人",
    prop: "operatorName",
    width: 100
  },
  {
    label: "日期",
    prop: "orderDate",
    width: 120,
    formatter: row =>
      row.orderDate ? dayjs(row.orderDate).format("YYYY-MM-DD") : "-"
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 100
  }
];

export const summaryColumns: TableColumnList = [
  {
    label: "商品名称",
    prop: "tireName",
    minWidth: 150,
    fixed: "left"
  },
  {
    label: "商品编码",
    prop: "tireBarcode",
    width: 140
  },
  {
    label: "仓库",
    prop: "repoName",
    width: 120
  },
  {
    label: "期初数量",
    prop: "openingQuantity",
    width: 100
  },
  {
    label: "期初金额",
    prop: "openingCost",
    width: 100,
    formatter: row => (row.openingCost ? `¥${fenToYuan(row.openingCost)}` : "-")
  },
  {
    label: "入库数量",
    prop: "inboundQuantity",
    width: 100
  },
  {
    label: "入库金额",
    prop: "inboundCost",
    width: 100,
    formatter: row => (row.inboundCost ? `¥${fenToYuan(row.inboundCost)}` : "-")
  },
  {
    label: "出库数量",
    prop: "outboundQuantity",
    width: 100
  },
  {
    label: "出库金额",
    prop: "outboundCost",
    width: 100,
    formatter: row =>
      row.outboundCost ? `¥${fenToYuan(row.outboundCost)}` : "-"
  },
  {
    label: "期末数量",
    prop: "closingQuantity",
    width: 100
  },
  {
    label: "期末金额",
    prop: "closingCost",
    width: 100,
    formatter: row => (row.closingCost ? `¥${fenToYuan(row.closingCost)}` : "-")
  }
];

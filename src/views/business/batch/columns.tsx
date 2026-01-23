import { ElTag } from "element-plus";
import type { TableColumnRenderer } from "@pureadmin/table";

export const columns: TableColumnList = [
  {
    label: "批次号",
    prop: "batchNo",
    minWidth: 120
  },
  {
    label: "商品名称",
    prop: "tireName",
    minWidth: 150
  },
  {
    label: "所在仓库",
    prop: "repoName",
    minWidth: 120
  },
  {
    label: "当前数量",
    prop: "quantity",
    width: 100
  },
  {
    label: "生产日期",
    prop: "productionDate",
    width: 120
  },
  {
    label: "过期日期",
    prop: "expiryDate",
    width: 120
  },
  {
    label: "操作",
    fixed: "right",
    width: 120,
    slot: "operation"
  }
];

export const transactionColumns: TableColumnList = [
  {
    label: "时间",
    prop: "createdAt",
    width: 160
  },
  {
    label: "类型",
    prop: "type",
    width: 80,
    cellRenderer: (data: TableColumnRenderer) => (
      <ElTag type={data.row?.type === "IN" ? "success" : "danger"}>
        {data.row?.type === "IN" ? "入库" : "出库"}
      </ElTag>
    )
  },
  {
    label: "数量",
    prop: "quantity",
    width: 100
  },
  {
    label: "来源类型",
    prop: "sourceType"
  },
  {
    label: "单号",
    prop: "sourceId"
  }
];

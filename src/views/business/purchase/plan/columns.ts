import dayjs from "dayjs";

export const columns: TableColumnList = [
  {
    label: "计划ID",
    prop: "id",
    width: 90
  },
  {
    label: "商品名称",
    prop: "tire.name"
  },
  {
    label: "规格",
    prop: "tire.size"
  },
  {
    label: "仓库",
    prop: "repo.name"
  },
  {
    label: "计划数量",
    prop: "count",
    width: 100
  },
  {
    label: "来源",
    prop: "source",
    formatter: ({ source }) =>
      ({
        auto: "自动生成",
        manual: "手动创建"
      })[String(source)] || "-"
  },
  {
    label: "状态",
    prop: "status",
    formatter: ({ status }) =>
      ({
        pending: "待处理",
        ordered: "已下单",
        cancelled: "已取消"
      })[String(status)] || "-"
  },
  {
    label: "关联采购单",
    prop: "purchaseOrder.docNo",
    formatter: ({ purchaseOrder }) => purchaseOrder?.docNo || "-"
  },
  {
    label: "备注",
    prop: "note"
  },
  {
    label: "创建时间",
    prop: "createdAt",
    formatter: ({ createdAt }) =>
      createdAt ? dayjs(createdAt).format("YYYY-MM-DD HH:mm:ss") : "-"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 180
  }
];

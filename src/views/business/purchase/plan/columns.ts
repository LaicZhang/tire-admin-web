import type { TableColumnRenderer } from "@pureadmin/table";

export const columns: TableColumnList = [
  {
    label: "计划单号",
    prop: "planNo"
  },
  {
    label: "商品",
    prop: "items",
    cellRenderer: (data: TableColumnRenderer) => {
      return (
        data.row?.items
          ?.map(
            (i: { tireName?: string; quantity?: number }) =>
              `${i.tireName} x ${i.quantity}`
          )
          .join(", ") || "-"
      );
    }
  },
  {
    label: "状态",
    prop: "status",
    cellRenderer: (data: TableColumnRenderer) => {
      const map: Record<string, string> = {
        DRAFT: "草稿",
        SUBMITTED: "已提交",
        APPROVED: "已审核"
      };
      return map[data.row?.status] || data.row?.status || "-";
    }
  },
  {
    label: "备注",
    prop: "desc"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 200
  }
];

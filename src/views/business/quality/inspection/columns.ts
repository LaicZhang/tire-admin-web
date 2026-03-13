import dayjs from "dayjs";

function formatInspectionResult(result?: string) {
  const map: Record<string, string> = {
    PASS: "合格",
    PARTIAL: "部分合格",
    FAIL: "不合格"
  };
  return result ? map[result] || result : "-";
}

export const columns: TableColumnList = [
  {
    label: "记录ID",
    prop: "id",
    width: 90
  },
  {
    label: "采购单号",
    prop: "purchaseOrder.docNo",
    formatter: ({ purchaseOrder }) =>
      purchaseOrder?.docNo || purchaseOrder?.number || "-"
  },
  {
    label: "检验结果",
    prop: "result",
    formatter: ({ result }) => formatInspectionResult(result)
  },
  {
    label: "检验数量",
    prop: "inspectedQty"
  },
  {
    label: "合格数量",
    prop: "qualifiedQty"
  },
  {
    label: "不合格数量",
    prop: "unqualifiedQty"
  },
  {
    label: "质检员",
    prop: "inspectedBy.name",
    formatter: ({ inspectedBy }) => inspectedBy?.name || "-"
  },
  {
    label: "检验时间",
    prop: "inspectedAt",
    formatter: ({ inspectedAt }) =>
      inspectedAt ? dayjs(inspectedAt).format("YYYY-MM-DD HH:mm:ss") : "-"
  },
  {
    label: "备注",
    prop: "remark"
  }
];

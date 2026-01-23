import StatusTag from "@/components/StatusTag/index.vue";
import type { TableColumnRenderer } from "@pureadmin/table";

export const columns: TableColumnList = [
  {
    type: "selection",
    width: 55,
    align: "center"
  },
  {
    label: "模板名称",
    prop: "name",
    minWidth: 180
  },
  {
    label: "纸张大小",
    prop: "paperSize",
    minWidth: 100
  },
  {
    label: "纸张方向",
    prop: "paperOrientation",
    minWidth: 100,
    cellRenderer: (data: TableColumnRenderer) => (
      <span>{data.row?.paperOrientation === "portrait" ? "纵向" : "横向"}</span>
    )
  },
  {
    label: "是否默认",
    prop: "isDefault",
    minWidth: 100,
    cellRenderer: (data: TableColumnRenderer) => (
      <StatusTag
        status={data.row?.isDefault}
        statusMap={{
          true: { label: "默认", type: "success" },
          false: { label: "非默认", type: "info" }
        }}
      />
    )
  },
  {
    label: "更新时间",
    prop: "updateTime",
    minWidth: 160
  },
  {
    label: "操作",
    width: 280,
    fixed: "right",
    slot: "operation"
  }
];

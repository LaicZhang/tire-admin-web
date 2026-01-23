import { h } from "vue";
import type { TableColumnRenderer } from "@pureadmin/table";

export const columns: TableColumnList = [
  {
    label: "单位组名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "基本单位",
    prop: "baseUnitName",
    minWidth: 100
  },
  {
    label: "换算关系",
    prop: "conversions",
    minWidth: 250,
    cellRenderer: (data: TableColumnRenderer) => {
      if (!data.row?.conversions?.length) return h("span", "-");
      const texts = data.row.conversions.map(
        (c: { unitName: string; ratio: number }) =>
          `1${c.unitName}=${c.ratio}${data.row?.baseUnitName}`
      );
      return h("span", texts.join("; "));
    }
  },
  {
    label: "排序",
    prop: "sort",
    minWidth: 80
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 150
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 150
  }
];

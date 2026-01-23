import { h } from "vue";

interface AttrValue {
  uid: string;
  name: string;
}

interface AttrRow {
  name: string;
  values: AttrValue[];
  sort: number;
  remark: string;
}

export const columns: TableColumnList = [
  {
    label: "属性名称",
    prop: "name",
    minWidth: 120
  },
  {
    label: "属性值",
    prop: "values",
    minWidth: 300,
    cellRenderer: ({ row }: { row: AttrRow }) => {
      if (!row.values?.length) return h("span", "-");
      return h(
        "div",
        { class: "flex flex-wrap gap-1" },
        row.values.map((v: { uid: string; name: string }) =>
          h("el-tag", { key: v.uid, size: "small" }, v.name)
        )
      );
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
    width: 200
  }
];

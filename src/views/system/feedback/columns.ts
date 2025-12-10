import { h } from "vue";

export const columns: TableColumnList = [
  {
    label: "UID",
    prop: "uid",
    width: 240,
    fixed: "left"
  },
  {
    label: "内容",
    prop: "content",
    minWidth: 200
  },
  {
    label: "评分",
    prop: "rating",
    width: 100
  },
  {
    label: "状态",
    prop: "status",
    width: 120,
    cellRenderer: ({ row }) => {
      const statusMap = {
        0: { text: "待处理", type: "warning" },
        1: { text: "处理中", type: "info" },
        2: { text: "已处理", type: "success" }
      };
      const status = statusMap[row.status] || { text: "未知", type: "info" };
      return h(
        "el-tag",
        {
          type: status.type
        },
        () => status.text
      );
    }
  },
  {
    label: "类型",
    prop: "type",
    width: 120,
    cellRenderer: ({ row }) => {
      const typeMap = {
        0: "建议",
        1: "问题",
        2: "其他"
      };
      return typeMap[row.type] || "未知";
    }
  },
  {
    label: "创建时间",
    prop: "createAt",
    width: 180
  },
  {
    label: "操作",
    fixed: "right",
    width: 150,
    slot: "operation"
  }
];

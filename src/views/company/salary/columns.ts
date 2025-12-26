import { formatDate } from "@/utils";

export const columns: TableColumnList = [
  // {
  //   label: "ID",
  //   prop: "id"
  // },
  {
    label: "名称",
    prop: "name"
  },
  {
    label: "基本工资",
    prop: "base"
  },
  {
    label: "绩效",
    prop: "performance"
  },
  {
    label: "全勤奖",
    prop: "fulltimeAttendanceAward"
  },
  {
    label: "补贴",
    prop: "subsidy"
  },
  {
    label: "更新时间",
    prop: "updateAt",
    formatter: (row, column, cellValue) => {
      return formatDate(cellValue);
    }
  },
  {
    label: "创建时间",
    prop: "createAt",
    formatter: (row, column, cellValue) => {
      return formatDate(cellValue);
    }
  },
  {
    label: "备注",
    prop: "desc"
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation"
  }
];

import { formatDate } from "@/utils";

export const columns = [
  {
    label: "ID",
    prop: "id"
  },
  {
    label: "公司名称",
    prop: "name"
  },
  {
    label: "状态",
    prop: "status"
  },
  {
    label: "备注",
    prop: "desc"
  },
  {
    label: "负责人",
    prop: "principalName"
  },
  {
    label: "负责人电话",
    prop: "principalPhone"
  },
  {
    label: "所在省",
    prop: "province"
  },
  {
    label: "所在市",
    prop: "city"
  },

  {
    label: "创建时间",
    prop: "createAt",
    formatter: (row, column, cellValue) => {
      return formatDate(cellValue);
    }
  },
  {
    label: "更新时间",
    prop: "updateAt",
    formatter: (row, column, cellValue) => {
      return formatDate(cellValue);
    }
  }
];

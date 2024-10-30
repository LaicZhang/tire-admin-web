import { ref } from "vue";
import { formatDateTime } from "@/utils";

export function useColumns() {
  const columns = ref([
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
      prop: "status",
      cellRenderer: ({ value }) => {
        return <el-tag size="small">{value === true ? "正常" : "异常"}</el-tag>;
      }
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
      cellRenderer: ({ value }) => {
        return formatDateTime(value);
      }
    },
    {
      label: "更新时间",
      prop: "updateAt",
      cellRenderer: ({ value }) => {
        return formatDateTime(value);
      }
    }
  ]);
  return {
    columns
  };
}

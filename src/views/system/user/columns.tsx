import type { FormItemProps } from "./utils/types";
import { maskEmailDisplay, maskPhoneDisplay } from "@/utils/presentationMask";

export const columns: TableColumnList = [
  {
    label: "uid",
    prop: "uid",
    minWidth: 120
  },
  {
    label: "用户名",
    prop: "username",
    minWidth: 120
  },
  {
    label: "电话",
    prop: "phone",
    minWidth: 120,
    cellRenderer: ({ row }) => maskPhoneDisplay((row as FormItemProps).phone)
  },
  {
    label: "邮箱",
    prop: "email",
    minWidth: 150,
    cellRenderer: ({ row }) => maskEmailDisplay((row as FormItemProps).email)
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 100,
    cellRenderer: ({ row, props }) => (
      <el-tag
        size={props?.size}
        type={
          (row as FormItemProps).status === true ||
          (row as FormItemProps).status === 1 ||
          (row as FormItemProps).status === "1"
            ? "success"
            : "danger"
        }
        effect="plain"
      >
        {(row as FormItemProps).status === true ||
        (row as FormItemProps).status === 1 ||
        (row as FormItemProps).status === "1"
          ? "启用"
          : "禁用"}
      </el-tag>
    )
  },
  {
    label: "删除时间",
    prop: "deleteAt",
    minWidth: 160
  },
  {
    label: "操作",
    width: 200,
    fixed: "right",
    slot: "operation"
  }
];

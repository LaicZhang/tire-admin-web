interface ImportFreeRow {
  accountName: string;
  companyName: string;
  ownerName: string;
  ownerPhone: string;
  userCount: number;
  role: string;
  createTime: string;
}

export const columns: TableColumnList = [
  {
    type: "selection",
    width: 55,
    align: "center"
  },
  {
    label: "账套名称",
    prop: "accountName",
    minWidth: 150
  },
  {
    label: "公司名称",
    prop: "companyName",
    minWidth: 150
  },
  {
    label: "所有者",
    prop: "ownerName",
    minWidth: 100
  },
  {
    label: "手机号",
    prop: "ownerPhone",
    minWidth: 120
  },
  {
    label: "用户数",
    prop: "userCount",
    minWidth: 80,
    align: "center"
  },
  {
    label: "权限角色",
    prop: "role",
    minWidth: 100,
    cellRenderer: ({ row }: { row: ImportFreeRow }) => (
      <el-tag
        type={
          row.role === "admin"
            ? "danger"
            : row.role === "manager"
              ? "warning"
              : "info"
        }
        effect="plain"
      >
        {row.role === "admin"
          ? "超级管理员"
          : row.role === "manager"
            ? "管理员"
            : "普通用户"}
      </el-tag>
    )
  },
  {
    label: "创建时间",
    prop: "createTime",
    minWidth: 160
  },
  {
    label: "操作",
    width: 200,
    fixed: "right",
    slot: "operation"
  }
];

import StatusTag from "@/components/StatusTag/index.vue";

interface UserRow {
  username: string;
  phone: string;
  roleName: string;
  status: number;
  lastLoginTime: string;
}

export const userColumns: TableColumnList = [
  {
    label: "用户名",
    prop: "username",
    minWidth: 120
  },
  {
    label: "手机号",
    prop: "phone",
    minWidth: 120
  },
  {
    label: "角色",
    prop: "roleName",
    minWidth: 100
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 80,
    cellRenderer: ({ row }: { row: UserRow }) => {
      const enableStatusMap = {
        1: { label: "启用", type: "success" },
        0: { label: "禁用", type: "danger" }
      } as const;
      return (
        <StatusTag
          status={row.status}
          statusMap={enableStatusMap}
          size="default"
          effect="plain"
        />
      );
    }
  },
  {
    label: "最后登录",
    prop: "lastLoginTime",
    minWidth: 160
  },
  {
    label: "操作",
    width: 200,
    fixed: "right",
    slot: "operation"
  }
];

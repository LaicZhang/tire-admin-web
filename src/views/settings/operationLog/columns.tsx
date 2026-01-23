interface OperationRow {
  username: string;
  createTime: string;
  moduleName: string;
  operationType: string;
  operationTypeName: string;
  detail: string;
  ip: string;
}

export const columns: TableColumnList = [
  {
    label: "操作人",
    prop: "username",
    minWidth: 100
  },
  {
    label: "操作时间",
    prop: "createTime",
    minWidth: 160
  },
  {
    label: "访问页面",
    prop: "moduleName",
    minWidth: 120
  },
  {
    label: "操作类型",
    prop: "operationTypeName",
    minWidth: 100,
    cellRenderer: ({ row }: { row: OperationRow }) => {
      const typeMap: Record<string, { type: string; label: string }> = {
        create: { type: "success", label: "新增" },
        update: { type: "primary", label: "修改" },
        delete: { type: "danger", label: "删除" },
        query: { type: "info", label: "查询" },
        import: { type: "warning", label: "导入" },
        export: { type: "warning", label: "导出" },
        audit: { type: "success", label: "审核" },
        unaudit: { type: "warning", label: "反审核" },
        login: { type: "success", label: "登录" },
        logout: { type: "info", label: "登出" }
      };
      const item = typeMap[row.operationType] || {
        type: "info",
        label: row.operationType
      };
      return (
        <el-tag type={item.type} effect="plain">
          {item.label}
        </el-tag>
      );
    }
  },
  {
    label: "操作详情",
    prop: "detail",
    minWidth: 250
  },
  {
    label: "IP地址",
    prop: "ip",
    minWidth: 130
  }
];

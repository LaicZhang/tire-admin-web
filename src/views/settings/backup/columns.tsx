import StatusTag from "@/components/StatusTag/index.vue";

export const backupTaskStatusMap: Record<
  string,
  { label: string; type: string }
> = {
  PENDING: { label: "等待中", type: "info" },
  RUNNING: { label: "进行中", type: "warning" },
  SUCCESS: { label: "成功", type: "success" },
  FAILED: { label: "失败", type: "danger" }
};

export const columns: TableColumnList = [
  {
    label: "备份文件",
    prop: "fileName",
    minWidth: 200
  },
  {
    label: "文件大小",
    prop: "fileSizeText",
    minWidth: 100
  },
  {
    label: "备份类型",
    prop: "backupTypeName",
    minWidth: 100,
    cellRenderer: ({
      row
    }: {
      row: { backupType: string; backupTypeName: string };
    }) => (
      <el-tag
        type={row.backupType === "auto" ? "info" : "primary"}
        effect="plain"
      >
        {row.backupTypeName}
      </el-tag>
    )
  },
  {
    label: "状态",
    prop: "statusName",
    minWidth: 100,
    cellRenderer: ({ row }: { row: { status: string } }) => (
      <StatusTag
        status={row.status}
        statusMap={backupTaskStatusMap}
        size="default"
        effect="plain"
      />
    )
  },
  {
    label: "备份时间",
    prop: "createTime",
    minWidth: 160
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 150
  },
  {
    label: "操作",
    width: 200,
    fixed: "right",
    slot: "operation"
  }
];

import { h } from "vue";
import { ElTag } from "element-plus";

export const quickStockColumns: TableColumnList = [
  {
    label: "商品名称",
    prop: "tireName",
    minWidth: 150,
    cellRenderer: ({ row }) => row.tire?.name || row.tireName
  },
  {
    label: "规格",
    prop: "tireSpec",
    width: 120,
    cellRenderer: ({ row }) => row.tire?.spec || row.tireSpec
  },
  {
    label: "账面数量",
    prop: "count",
    width: 100,
    align: "center"
  },
  {
    label: "实盘数量",
    width: 150,
    align: "center",
    slot: "actualCount"
  },
  {
    label: "盘盈/盘亏",
    width: 100,
    align: "center",
    slot: "difference"
  },
  {
    label: "备注",
    minWidth: 150,
    slot: "description"
  }
];

export const taskDetailColumns: TableColumnList = [
  {
    label: "商品名称",
    prop: "tireName",
    minWidth: 150
  },
  {
    label: "账面数量",
    prop: "bookCount",
    width: 100,
    align: "center"
  },
  {
    label: "实盘数量",
    width: 150,
    align: "center",
    slot: "actualCount"
  },
  {
    label: "盘盈/盘亏",
    width: 100,
    align: "center",
    slot: "difference"
  },
  {
    label: "备注",
    minWidth: 150,
    slot: "remark"
  }
];

export const taskListColumns: TableColumnList = [
  {
    label: "任务名称",
    prop: "name",
    minWidth: 200
  },
  {
    label: "仓库",
    width: 150,
    cellRenderer: ({ row }) => row.repo?.name
  },
  {
    label: "状态",
    width: 100,
    align: "center",
    cellRenderer: ({ row }) => {
      const getStatusType = (status: string) => {
        switch (status) {
          case "IN_PROGRESS":
            return "warning";
          case "COMPLETED":
            return "success";
          case "CANCELLED":
            return "info";
          default:
            return "info";
        }
      };
      const getStatusText = (status: string) => {
        switch (status) {
          case "IN_PROGRESS":
            return "进行中";
          case "COMPLETED":
            return "已完成";
          case "CANCELLED":
            return "已取消";
          default:
            return status;
        }
      };
      return h(ElTag, { type: getStatusType(row.status), size: "small" }, () =>
        getStatusText(row.status)
      );
    }
  },
  {
    label: "明细数量",
    width: 100,
    align: "center",
    cellRenderer: ({ row }) => row.details?.length || 0
  },
  {
    label: "创建时间",
    width: 180,
    cellRenderer: ({ row }) => new Date(row.createdAt).toLocaleString()
  },
  {
    label: "操作",
    width: 120,
    fixed: "right",
    slot: "operation"
  }
];

import dayjs from "dayjs";
import { fenToYuan } from "@/utils/formatMoney";

export const columns: TableColumnList = [
  {
    label: "单据编号",
    prop: "number",
    width: 180,
    fixed: "left",
    cellRenderer: ({ row }) => (
      <span class="text-primary font-medium">#{row.number}</span>
    )
  },
  {
    label: "状态",
    prop: "isApproved",
    width: 100,
    cellRenderer: ({ row }) => {
      if (row.isApproved) {
        return (
          <el-tag type="success" size="small">
            已审核
          </el-tag>
        );
      }
      if (row.isLocked) {
        return (
          <el-tag type="danger" size="small">
            已拒绝
          </el-tag>
        );
      }
      return (
        <el-tag type="warning" size="small">
          待审核
        </el-tag>
      );
    }
  },
  {
    label: "调整金额",
    prop: "totalAdjustAmount",
    width: 120,
    cellRenderer: ({ row }) => {
      const amount = Number(row.totalAdjustAmount);
      const color = amount >= 0 ? "text-green-600" : "text-red-600";
      return <span class={color}>{fenToYuan(amount * 100)}</span>;
    }
  },
  {
    label: "调整原因",
    prop: "reason",
    minWidth: 150,
    showOverflowTooltip: true
  },
  {
    label: "操作人",
    prop: "operator.name",
    width: 100,
    formatter: row => row.operator?.name || "-"
  },
  {
    label: "审核人",
    prop: "auditor.name",
    width: 100,
    formatter: row => row.auditor?.name || "-"
  },
  {
    label: "创建时间",
    prop: "createAt",
    width: 160,
    formatter: row =>
      row.createAt ? dayjs(row.createAt).format("YYYY-MM-DD HH:mm") : "-"
  },
  {
    label: "审核时间",
    prop: "auditAt",
    width: 160,
    formatter: row =>
      row.auditAt ? dayjs(row.auditAt).format("YYYY-MM-DD HH:mm") : "-"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 180
  }
];

export const detailColumns: TableColumnList = [
  {
    label: "商品名称",
    prop: "tire.name",
    minWidth: 150,
    formatter: row => row.tire?.name || "-"
  },
  {
    label: "商品编码",
    prop: "tire.barcode",
    width: 140,
    formatter: row => row.tire?.barcode || "-"
  },
  {
    label: "仓库",
    prop: "repo.name",
    width: 120,
    formatter: row => row.repo?.name || "-"
  },
  {
    label: "数量",
    prop: "count",
    width: 80
  },
  {
    label: "原成本",
    prop: "originalCost",
    width: 100,
    formatter: row =>
      row.originalCost ? `¥${fenToYuan(row.originalCost)}` : "-"
  },
  {
    label: "调整后成本",
    prop: "adjustedCost",
    width: 100,
    formatter: row =>
      row.adjustedCost ? `¥${fenToYuan(row.adjustedCost)}` : "-"
  },
  {
    label: "调整金额",
    prop: "adjustAmount",
    width: 100,
    cellRenderer: ({ row }) => {
      const adjust = (row.adjustedCost - row.originalCost) * row.count;
      const color = adjust >= 0 ? "text-green-600" : "text-red-600";
      return <span class={color}>{fenToYuan(adjust)}</span>;
    }
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 100
  }
];

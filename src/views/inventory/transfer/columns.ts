import { h } from "vue";
import { ElTag } from "element-plus";
import dayjs from "dayjs";
import type { TransferOrder } from "./types";
import {
  getAuditStatus,
  getAuditStatusInfo,
  getLogisticsStatus,
  getLogisticsStatusInfo
} from "./types";

export const columns: TableColumnList = [
  {
    label: "单据编号",
    prop: "docNo",
    minWidth: 160,
    fixed: "left",
    formatter: (row: TransferOrder) => row.docNo || row.number || row.uid
  },
  {
    label: "审核状态",
    prop: "isApproved",
    width: 110,
    cellRenderer: ({ row }: { row?: TransferOrder }) => {
      if (!row) return "-";
      const info = getAuditStatusInfo(getAuditStatus(row));
      return h(ElTag, { type: info.type, size: "small" }, () => info.label);
    }
  },
  {
    label: "物流状态",
    prop: "details",
    width: 110,
    cellRenderer: ({ row }: { row?: TransferOrder }) => {
      if (!row) return "-";
      const info = getLogisticsStatusInfo(getLogisticsStatus(row));
      return h(ElTag, { type: info.type, size: "small" }, () => info.label);
    }
  },
  {
    label: "调出仓库",
    prop: "fromRepository.name",
    minWidth: 120,
    formatter: (row: TransferOrder) => row.fromRepository?.name || "-"
  },
  {
    label: "调入仓库",
    prop: "toRepository.name",
    minWidth: 120,
    formatter: (row: TransferOrder) => row.toRepository?.name || "-"
  },
  {
    label: "商品数量",
    prop: "details",
    width: 100,
    formatter: (row: TransferOrder) =>
      String((row.details || []).reduce((sum, d) => sum + (d.count || 0), 0))
  },
  {
    label: "操作人",
    prop: "operator.name",
    width: 100,
    formatter: (row: TransferOrder) => row.operator?.name || "-"
  },
  {
    label: "审核人",
    prop: "auditor.name",
    width: 100,
    formatter: (row: TransferOrder) => row.auditor?.name || "-"
  },
  {
    label: "创建时间",
    prop: "createAt",
    width: 160,
    formatter: (row: TransferOrder) =>
      row.createAt ? dayjs(row.createAt).format("YYYY-MM-DD HH:mm") : "-"
  },
  {
    label: "备注",
    prop: "desc",
    minWidth: 150,
    showOverflowTooltip: true
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 260
  }
];

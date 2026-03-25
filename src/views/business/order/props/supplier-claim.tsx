import { formatDate } from "@/utils";
import { reactive } from "vue";
import type { FormRules } from "element-plus";
import { fieldRules } from "@/utils/validation/fieldRules";
import { getSupplierClaimOrderStatusLabel } from "./claim";

export interface SupplierClaimFormItemProps {
  id: number;
  uid: string;
  docNo?: string;
  providerId?: string;
  desc?: string;
  operatorId?: string;
  auditorId?: string;
  count: number;
  total: number;
  showTotal: number;
  isApproved: boolean;
  isLocked: boolean;
  isReversed?: boolean;
  rejectReason?: string;
  sourceClaimOrderId?: string;
  sourceMode?: string;
  fee?: number;
  details: Array<{
    uid?: string;
    tireId?: string;
    repositoryId?: string;
    repository?: { name?: string | null } | null;
    serialNo?: string | null;
    responsibilityRatio?: number | null;
    claimAmount?: number | string | null;
    settledAmount?: number | string | null;
    remark?: string | null;
    sourceClaimOrderDetail?: {
      uid?: string;
      serialNo?: string | null;
      number?: string | null;
    } | null;
    defectCategory?: {
      name?: string | null;
    } | null;
  }>;
}

export const supplierClaimOrderFormRules: FormRules = reactive({
  auditorId: fieldRules.uidSelect({ label: "审核人" }),
  fee: fieldRules.moneyYuan({
    label: "结算金额",
    min: 0,
    minExclusive: true,
    required: true
  })
});

function toAmount(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

export function getSupplierClaimTotal(
  details?: SupplierClaimFormItemProps["details"]
) {
  return (details ?? []).reduce(
    (sum, detail) => sum + toAmount(detail.claimAmount),
    0
  );
}

export function getSupplierClaimSettledTotal(
  details?: SupplierClaimFormItemProps["details"]
) {
  return (details ?? []).reduce(
    (sum, detail) => sum + toAmount(detail.settledAmount),
    0
  );
}

export const supplierClaimOrderDetailsColumns: TableColumnList = [
  {
    label: "胎号",
    prop: "serialNo",
    minWidth: 160
  },
  {
    label: "轮胎",
    prop: "tireId",
    minWidth: 160
  },
  {
    label: "仓库",
    prop: "repository.name",
    minWidth: 140,
    cellRenderer: ({ row }) => row.repository?.name || row.repositoryId || "-"
  },
  {
    label: "责任比例(%)",
    prop: "responsibilityRatio",
    width: 120,
    cellRenderer: ({ row }) => row.responsibilityRatio ?? "-"
  },
  {
    label: "索赔金额",
    prop: "claimAmount",
    minWidth: 120,
    cellRenderer: ({ row }) => toAmount(row.claimAmount)
  },
  {
    label: "已结算",
    prop: "settledAmount",
    minWidth: 120,
    cellRenderer: ({ row }) => toAmount(row.settledAmount)
  },
  {
    label: "缺陷类别",
    prop: "defectCategory.name",
    minWidth: 140,
    cellRenderer: ({ row }) => row.defectCategory?.name || "-"
  },
  {
    label: "来源理赔明细",
    prop: "sourceClaimOrderDetail.number",
    minWidth: 180,
    cellRenderer: ({ row }) =>
      row.sourceClaimOrderDetail?.number ||
      row.sourceClaimOrderDetail?.serialNo ||
      row.sourceClaimOrderDetail?.uid ||
      "-"
  }
];

export const supplierClaimOrderColumns: TableColumnList = [
  {
    label: "单号",
    prop: "docNo",
    minWidth: 140
  },
  {
    label: "供应商",
    prop: "provider.name",
    minWidth: 140
  },
  {
    label: "来源理赔单",
    prop: "sourceClaimOrder.docNo",
    minWidth: 160,
    cellRenderer: ({ row }) =>
      row.sourceClaimOrder?.docNo || row.sourceClaimOrderId || "-"
  },
  {
    label: "索赔金额",
    prop: "details",
    minWidth: 120,
    cellRenderer: ({ row }) => getSupplierClaimTotal(row.details)
  },
  {
    label: "已结算",
    prop: "settledTotal",
    minWidth: 120,
    cellRenderer: ({ row }) => getSupplierClaimSettledTotal(row.details)
  },
  {
    label: "审核状态",
    prop: "isApproved",
    minWidth: 120,
    cellRenderer: ({ row }) =>
      getSupplierClaimOrderStatusLabel({
        isApproved: Boolean(row.isApproved),
        isReversed: Boolean(row.isReversed)
      })
  },
  {
    label: "创建时间",
    prop: "createAt",
    minWidth: 160,
    formatter: (_row, _column, cellValue) => formatDate(cellValue)
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 220
  }
];

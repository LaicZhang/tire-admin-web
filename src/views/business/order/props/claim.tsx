import { reactive } from "vue";
import type { FormRules } from "element-plus";
import { fieldRules } from "@/utils/validation/fieldRules";

export interface ClaimFormItemProps {
  id: number;
  uid: string;
  customerId?: string;
  providerId?: string;
  desc?: string;
  attachments?: string[];
  operatorId: string;
  auditorId: string;
  count: number;
  total: number;
  showTotal: number;
  isApproved: boolean;
  isLocked: boolean;
  rejectReason?: string;
  paymentId?: string;
  fee?: number;
  isReceive?: boolean;
  details: Array<{
    uid?: string;
    tireId?: string;
    repoId?: string;
    count?: number;
    serialNo?: string;
    number?: string;
    name?: string;
    cause?: string;
    causeDesc?: string;
    claimFee?: number;
    wearFee?: number;
    claimTirePrice?: number;
    percent?: number;
    remainingPattern?: number;
    isProviderClaim?: boolean;
    claimType?: number;
    identificationResult?: string;
    serialTrace?: {
      serialNo?: string;
      status?: string;
      repoId?: string;
      sourceType?: string;
      sourceOrderId?: string;
      targetType?: string;
      targetOrderId?: string;
      latestReturnInspection?: {
        result?: string;
        remark?: string;
        createdAt?: string;
        defectCategory?: {
          name?: string;
        };
      };
    };
  }>;
}

export interface ClaimFormProps {
  formInline: ClaimFormItemProps;
}

export const claimOrderFormRules: FormRules = reactive({
  customerId: fieldRules.uidSelect({ label: "客户", required: false }),
  providerId: fieldRules.uidSelect({ label: "供应商", required: false }),
  auditorId: fieldRules.uidSelect({ label: "审核人" }),
  count: fieldRules.positiveInt({ label: "数量", min: 1, required: true }),
  total: fieldRules.moneyYuan({ label: "总额", min: 0, required: true }),
  fee: fieldRules.moneyYuan({
    label: "理赔金额",
    min: 0,
    minExclusive: true,
    required: true
  }),
  paymentId: fieldRules.uidSelect({ label: "支付账户" })
});

export const claimOrderDetailsColumns: TableColumnList = [
  {
    label: "轮胎",
    prop: "tireId",
    slot: "tireIdSelect",
    minWidth: 160
  },
  {
    label: "数量",
    prop: "count",
    slot: "countInput",
    width: 90
  },
  {
    label: "胎号",
    prop: "serialNo",
    minWidth: 180,
    cellRenderer: ({ row }) => (
      <el-input
        v-model={row.serialNo}
        placeholder="退胎扣库且启用序列号时必填"
      />
    )
  },
  {
    label: "理赔编号",
    prop: "number",
    cellRenderer: ({ row }) => (
      <el-input v-model={row.number} placeholder="自动生成" />
    )
  },
  {
    label: "项目名称",
    prop: "name",
    cellRenderer: ({ row }) => (
      <el-input v-model={row.name} placeholder="如：胎侧鼓包" />
    )
  },
  {
    label: "理赔原因",
    prop: "cause",
    cellRenderer: ({ row }) => (
      <el-input v-model={row.cause} placeholder="请输入原因" />
    )
  },
  {
    label: "补充说明",
    prop: "causeDesc",
    cellRenderer: ({ row }) => (
      <el-input v-model={row.causeDesc} placeholder="可选" />
    )
  },
  {
    label: "剩余花纹(mm)",
    prop: "remainingPattern",
    cellRenderer: ({ row }) => (
      <el-input-number v-model={row.remainingPattern} min={0} precision={1} />
    )
  },
  {
    label: "责任比例(%)",
    prop: "percent",
    cellRenderer: ({ row }) => (
      <el-input-number v-model={row.percent} min={0} max={100} />
    )
  },
  {
    label: "理赔方式",
    prop: "claimType",
    cellRenderer: ({ row }) => (
      <el-select v-model={row.claimType} placeholder="请选择">
        <el-option label="不处理" value={0} />
        <el-option label="现金理赔" value={1} />
        <el-option label="退胎扣库" value={2} />
      </el-select>
    )
  },
  {
    label: "理赔金",
    prop: "claimFee",
    cellRenderer: ({ row }) => (
      <el-input-number v-model={row.claimFee} min={0} precision={2} />
    )
  },
  {
    label: "磨损费",
    prop: "wearFee",
    cellRenderer: ({ row }) => (
      <el-input-number v-model={row.wearFee} min={0} precision={2} />
    )
  },
  {
    label: "赔付轮胎价",
    prop: "claimTirePrice",
    cellRenderer: ({ row }) => (
      <el-input-number v-model={row.claimTirePrice} min={0} precision={2} />
    )
  },
  {
    label: "退胎仓库",
    prop: "repoId",
    slot: "repoIdSelect",
    minWidth: 140
  },
  {
    label: "向供应商索赔",
    prop: "isProviderClaim",
    cellRenderer: ({ row }) => <el-switch v-model={row.isProviderClaim} />
  },
  {
    label: "鉴定结果",
    prop: "identificationResult",
    cellRenderer: ({ row }) => (
      <el-input v-model={row.identificationResult} placeholder="可选" />
    )
  },
  {
    label: "追溯摘要",
    prop: "serialTrace",
    minWidth: 260,
    cellRenderer: ({ row }) => {
      const trace = row.serialTrace as
        | ClaimFormItemProps["details"][number]["serialTrace"]
        | undefined;
      if (!trace?.serialNo) return <span class="text-gray-400">-</span>;
      const parts = [
        trace.status ? `状态：${trace.status}` : "",
        trace.repoId ? `仓库：${trace.repoId}` : "",
        trace.sourceType || trace.sourceOrderId
          ? `来源：${trace.sourceType || "-"} ${trace.sourceOrderId || ""}`.trim()
          : "",
        trace.targetType || trace.targetOrderId
          ? `去向：${trace.targetType || "-"} ${trace.targetOrderId || ""}`.trim()
          : "",
        trace.latestReturnInspection?.result
          ? `最近退货质检：${trace.latestReturnInspection.result}${trace.latestReturnInspection.defectCategory?.name ? ` · ${trace.latestReturnInspection.defectCategory.name}` : ""}`
          : "",
        trace.latestReturnInspection?.remark
          ? `质检备注：${trace.latestReturnInspection.remark}`
          : ""
      ].filter(Boolean);
      return (
        <div class="text-xs leading-5 text-gray-600">
          {parts.map((part, index) => (
            <div key={`${trace.serialNo}-${index}`}>{part}</div>
          ))}
        </div>
      );
    }
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    width: 90
  }
];

export const claimOrderColumns: TableColumnList = [
  {
    label: "流水号",
    prop: "number",
    minWidth: 140
  },
  {
    label: "客户",
    prop: "customer.name",
    minWidth: 140
  },
  {
    label: "供应商",
    prop: "provider.name",
    minWidth: 140
  },
  {
    label: "理赔数量",
    prop: "count",
    width: 100
  },
  {
    label: "理赔总额",
    prop: "total",
    minWidth: 120
  },
  {
    label: "审核状态",
    prop: "isApproved",
    formatter: (_row, _column, cellValue) =>
      cellValue === true ? "已批准" : "未批准"
  },
  {
    label: "锁单",
    prop: "isLocked",
    formatter: (_row, _column, cellValue) =>
      cellValue === true ? "已锁单" : "未锁单"
  },
  {
    label: "备注",
    prop: "desc",
    minWidth: 180
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 260
  }
];

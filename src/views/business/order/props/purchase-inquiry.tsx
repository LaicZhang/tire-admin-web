// import { Action, FormItemProps } from "./index";
import dayjs from "dayjs";

// 采购询价单
export const purchaseInquiryColumns: TableColumnList = [
  {
    label: "询价单号",
    prop: "id"
  },
  {
    label: "供应商",
    prop: "provider.name"
  },
  {
    label: "截止日期",
    prop: "deadline",
    formatter: ({ deadline }) => dayjs(deadline).format("YYYY-MM-DD")
  },
  {
    label: "状态",
    prop: "status",
    formatter: ({ status }) => {
      const map = {
        draft: "草稿",
        sent: "已发送",
        responded: "已报价",
        ordered: "已下单"
      };
      return map[status] || status;
    }
  },
  {
    label: "创建人",
    prop: "operator.name"
  },
  {
    label: "操作",
    fixed: "right",
    width: 210,
    slot: "operation"
  }
];

export const purchaseInquiryFormRules = {
  providerId: [{ required: true, message: "请选择供应商", trigger: "change" }],
  deadline: [{ required: true, message: "请选择截止日期", trigger: "change" }]
};

export const purchaseInquiryDetailsColumns: TableColumnList = [
  {
    label: "商品",
    prop: "tireId",
    slot: "tireIdSelect"
  },
  {
    label: "期望数量",
    prop: "quantity",
    slot: "countInput"
  },
  {
    label: "备注",
    prop: "desc",
    cellRenderer: ({ row }) => <el-input v-model={row.desc} />
  }
];

// 采购报价单 (通常由询价单生成或供应商录入)
export const purchaseQuotationColumns: TableColumnList = [
  {
    label: "报价单号",
    prop: "id"
  },
  {
    label: "关联询价单",
    prop: "inquiryId"
  },
  {
    label: "供应商",
    prop: "provider.name"
  },
  {
    label: "总价",
    prop: "totalPrice"
  },
  {
    label: "有效期至",
    prop: "validUntil",
    formatter: ({ validUntil }) => dayjs(validUntil).format("YYYY-MM-DD")
  },
  {
    label: "操作",
    fixed: "right",
    width: 210,
    slot: "operation"
  }
];

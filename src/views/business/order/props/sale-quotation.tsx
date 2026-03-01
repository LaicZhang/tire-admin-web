// import { Action, FormItemProps } from "./index";
import dayjs from "dayjs";
import type { FormRules } from "element-plus";
import { fieldRules } from "@/utils/validation/fieldRules";

export const saleQuotationColumns: TableColumnList = [
  {
    label: "报价单号",
    prop: "id"
  },
  {
    label: "客户",
    prop: "customer.name"
  },
  {
    label: "总价",
    prop: "totalPrice"
  },
  {
    label: "状态",
    prop: "status",
    formatter: ({ status }) => {
      const map: Record<string, string> = {
        draft: "草稿",
        sent: "已发送",
        accepted: "已接受",
        rejected: "已拒绝",
        ordered: "已转订单"
      };
      return map[status] || status;
    }
  },
  {
    label: "有效期至",
    prop: "validUntil",
    formatter: ({ validUntil }) => dayjs(validUntil).format("YYYY-MM-DD")
  },
  {
    label: "销售员",
    prop: "operator.name"
  },
  {
    label: "操作",
    fixed: "right",
    width: 210,
    slot: "operation"
  }
];

export const saleQuotationFormRules: FormRules = {
  customerId: fieldRules.uidSelect({ label: "客户" }),
  validUntil: fieldRules.date({ required: true, label: "有效期" })
};

export const saleQuotationDetailsColumns: TableColumnList = [
  {
    label: "商品",
    prop: "tireId",
    slot: "tireIdSelect"
  },
  {
    label: "数量",
    prop: "quantity",
    slot: "countInput"
  },
  {
    label: "报价单价",
    prop: "price",
    cellRenderer: ({ row }) => <el-input-number v-model={row.price} />
  },
  {
    label: "备注",
    prop: "desc",
    cellRenderer: ({ row }) => <el-input v-model={row.desc} />
  }
];

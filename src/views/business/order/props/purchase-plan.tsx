// import { Action, FormItemProps } from "./index";
import dayjs from "dayjs";
import type { FormRules } from "element-plus";
import { fieldRules } from "@/utils/validation/fieldRules";

export const purchasePlanColumns: TableColumnList = [
  {
    label: "计划单号",
    prop: "id"
  },
  {
    label: "商品名称",
    prop: "tire.name"
  },
  {
    label: "规格",
    prop: "tire.size"
  },
  {
    label: "仓库",
    prop: "repo.name"
  },
  {
    label: "计划数量",
    prop: "count"
  },
  {
    label: "来源",
    prop: "source",
    formatter: ({ source }) => {
      const map: Record<string, string> = {
        auto: "自动生成",
        manual: "手动创建"
      };
      return map[source] || source;
    }
  },
  {
    label: "状态",
    prop: "status",
    formatter: ({ status }) => {
      const map: Record<string, string> = {
        pending: "待处理",
        ordered: "已下单",
        cancelled: "已取消"
      };
      return map[status] || status;
    }
  },
  {
    label: "创建时间",
    prop: "createdAt",
    formatter: ({ createdAt }) => dayjs(createdAt).format("YYYY-MM-DD HH:mm:ss")
  },
  {
    label: "操作",
    fixed: "right",
    width: 210,
    slot: "operation"
  }
];

export const purchasePlanFormRules: FormRules = {
  tireId: fieldRules.uidSelect({ label: "商品" }),
  count: fieldRules.positiveInt({ label: "数量", min: 1, required: true }),
  repoId: fieldRules.uidSelect({ label: "仓库" })
};

export const purchasePlanDetailsColumns: TableColumnList = [
  {
    label: "商品",
    prop: "tireId",
    slot: "tireIdSelect"
  },
  {
    label: "数量",
    prop: "count",
    slot: "countInput"
  }
];

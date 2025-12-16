// import { Action, FormItemProps } from "./index";
import dayjs from "dayjs";

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
      const map = { auto: "自动生成", manual: "手动创建" };
      return map[source] || source;
    }
  },
  {
    label: "状态",
    prop: "status",
    formatter: ({ status }) => {
      const map = { pending: "待处理", ordered: "已下单", cancelled: "已取消" };
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

export const purchasePlanFormRules = {
  tireId: [{ required: true, message: "请选择商品", trigger: "change" }],
  count: [{ required: true, message: "请输入数量", trigger: "blur" }],
  repoId: [{ required: true, message: "请选择仓库", trigger: "change" }]
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

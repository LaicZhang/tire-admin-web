import type { TargetField } from "./types";

/** 导入类型选项 */
export const importTypeOptions = [
  { value: "customer", label: "客户导入" },
  { value: "provider", label: "供应商导入" },
  { value: "tire", label: "商品导入" },
  { value: "user", label: "员工导入" },
  { value: "order", label: "订单导入" }
];

/** 各类型对应的目标字段 */
export const targetFieldsMap: Record<string, TargetField[]> = {
  customer: [
    { key: "name", label: "客户名称", required: true, type: "string" },
    { key: "code", label: "客户编码", required: false, type: "string" },
    { key: "contact", label: "联系人", required: false, type: "string" },
    { key: "phone", label: "联系电话", required: false, type: "string" },
    { key: "address", label: "地址", required: false, type: "string" },
    { key: "remark", label: "备注", required: false, type: "string" }
  ],
  provider: [
    { key: "name", label: "供应商名称", required: true, type: "string" },
    { key: "code", label: "供应商编码", required: false, type: "string" },
    { key: "contact", label: "联系人", required: false, type: "string" },
    { key: "phone", label: "联系电话", required: false, type: "string" },
    { key: "address", label: "地址", required: false, type: "string" },
    { key: "remark", label: "备注", required: false, type: "string" }
  ],
  tire: [
    { key: "name", label: "商品名称", required: true, type: "string" },
    { key: "code", label: "商品编码", required: false, type: "string" },
    { key: "spec", label: "规格型号", required: false, type: "string" },
    { key: "unit", label: "单位", required: false, type: "string" },
    { key: "price", label: "售价", required: false, type: "number" },
    { key: "cost", label: "成本价", required: false, type: "number" },
    { key: "category", label: "分类", required: false, type: "string" },
    { key: "remark", label: "备注", required: false, type: "string" }
  ],
  user: [
    { key: "name", label: "姓名", required: true, type: "string" },
    { key: "phone", label: "手机号", required: true, type: "string" },
    { key: "department", label: "部门", required: false, type: "string" },
    { key: "position", label: "职位", required: false, type: "string" },
    { key: "email", label: "邮箱", required: false, type: "string" },
    { key: "remark", label: "备注", required: false, type: "string" }
  ],
  order: [
    { key: "orderNo", label: "订单号", required: false, type: "string" },
    { key: "customerName", label: "客户名称", required: true, type: "string" },
    { key: "productName", label: "商品名称", required: true, type: "string" },
    { key: "quantity", label: "数量", required: true, type: "number" },
    { key: "price", label: "单价", required: false, type: "number" },
    { key: "orderDate", label: "订单日期", required: false, type: "date" },
    { key: "remark", label: "备注", required: false, type: "string" }
  ]
};

/** 智能匹配规则映射 */
export const mappingRules: Record<string, string[]> = {
  name: ["名称", "姓名", "客户名", "供应商名", "商品名"],
  code: ["编码", "编号", "代码"],
  contact: ["联系人", "联络人"],
  phone: ["电话", "手机", "联系方式"],
  address: ["地址", "详细地址"],
  remark: ["备注", "说明", "描述"],
  spec: ["规格", "型号", "规格型号"],
  unit: ["单位", "计量单位"],
  price: ["价格", "单价", "售价"],
  cost: ["成本", "成本价", "进价"],
  category: ["分类", "类别", "类型"],
  email: ["邮箱", "电子邮件", "email"],
  department: ["部门", "所属部门"],
  position: ["职位", "岗位"],
  quantity: ["数量", "数目"],
  orderNo: ["订单号", "单号"],
  orderDate: ["日期", "订单日期", "下单日期"],
  customerName: ["客户", "客户名称"],
  productName: ["商品", "商品名称", "产品名称"]
};

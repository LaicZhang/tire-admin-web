export const BaseImagePath =
  import.meta.env.VITE_IMAGE_PATH || "https://s4-tire.zyha.cn/cover/";
export const BaseStaticUploadPath =
  import.meta.env.VITE_UPLOAD_PATH || "/api/static";

export const CUR_ORDER_TYPE = "curOrderType";
export const CUR_FORM_TITLE = "curFormTitle";

export enum SYS {
  dict = "sys_dict",
  setting = "sys_setting"
}

export enum ALL_LIST {
  repo = "all_repos",
  provider = "all_providers",
  customer = "all_customers",
  tire = "all_tires",
  manager = "all_managers",
  employee = "all_employees",
  position = "all_positions"
}

export enum StaticImageTypeEnum {
  AVATAR = 1,
  COVER = 2,
  LOGO = 3,
  DRIVER = 4
}

export enum ORDER_TYPE {
  purchase = "purchase-order",
  purchasePlan = "purchase-plan",
  purchaseInquiry = "purchase-inquiry",
  sale = "sale-order",
  saleQuotation = "sale-quotation",
  claim = "claim-order",
  return = "return-order",
  waste = "waste-order",
  transfer = "transfer-order",
  assembly = "assembly-order",
  surplus = "surplus-order",
  default = ""
}

export const ORDER_TYPE_LIST = [
  {
    value: ORDER_TYPE.purchase,
    label: "采购订单"
  },
  {
    value: ORDER_TYPE.purchasePlan,
    label: "采购计划"
  },
  {
    value: ORDER_TYPE.purchaseInquiry,
    label: "采购询价"
  },
  {
    value: ORDER_TYPE.sale,
    label: "销售订单"
  },
  {
    value: ORDER_TYPE.saleQuotation,
    label: "销售报价"
  },
  {
    value: ORDER_TYPE.claim,
    label: "理赔订单"
  },
  {
    value: ORDER_TYPE.return,
    label: "退货订单"
  },
  {
    value: ORDER_TYPE.waste,
    label: "报废订单"
  },
  {
    value: ORDER_TYPE.transfer,
    label: "调拨订单"
  },
  {
    value: ORDER_TYPE.assembly,
    label: "装配订单"
  }
];

/** 订单类型项定义 */
export interface OrderTypeItem {
  value: ORDER_TYPE;
  label: string;
}

/** 订单类型映射表 - 用于按角色过滤时快速查找 */
const ORDER_TYPE_MAP: Record<ORDER_TYPE, string> = {
  [ORDER_TYPE.purchase]: "采购订单",
  [ORDER_TYPE.purchasePlan]: "采购计划",
  [ORDER_TYPE.purchaseInquiry]: "采购询价",
  [ORDER_TYPE.sale]: "销售订单",
  [ORDER_TYPE.saleQuotation]: "销售报价",
  [ORDER_TYPE.claim]: "理赔订单",
  [ORDER_TYPE.return]: "退货订单",
  [ORDER_TYPE.waste]: "报废订单",
  [ORDER_TYPE.transfer]: "调拨订单",
  [ORDER_TYPE.assembly]: "装配订单",
  [ORDER_TYPE.surplus]: "盘盈订单",
  [ORDER_TYPE.default]: ""
};

export const getOrderTypeList = (userRoles: string[]): OrderTypeItem[] => {
  const allowedRoles = [
    "admin",
    "boss",
    "warehouseEmployee",
    "warehouseEmployeeManager",
    "worker",
    "workerManager"
  ];
  if (userRoles.some(role => allowedRoles.includes(role))) {
    return ORDER_TYPE_LIST;
  }

  // 使用 Map 按 ORDER_TYPE 去重，避免 Set 无法正确去重对象引用的问题
  const orderTypeMap = new Map<ORDER_TYPE, string>();

  userRoles.forEach(role => {
    if (role === "seller" || role === "sellerManager") {
      orderTypeMap.set(
        ORDER_TYPE.purchase,
        ORDER_TYPE_MAP[ORDER_TYPE.purchase]
      );
    } else if (role === "purchaser" || role === "purchaserManager") {
      orderTypeMap.set(ORDER_TYPE.sale, ORDER_TYPE_MAP[ORDER_TYPE.sale]);
    } else if (role === "finance" || role === "financeManager") {
      orderTypeMap.set(
        ORDER_TYPE.purchase,
        ORDER_TYPE_MAP[ORDER_TYPE.purchase]
      );
      orderTypeMap.set(ORDER_TYPE.sale, ORDER_TYPE_MAP[ORDER_TYPE.sale]);
      orderTypeMap.set(ORDER_TYPE.claim, ORDER_TYPE_MAP[ORDER_TYPE.claim]);
    }
  });

  return Array.from(orderTypeMap.entries()).map(([value, label]) => ({
    value,
    label
  }));
};

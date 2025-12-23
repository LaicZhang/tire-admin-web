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

export const getOrderTypeList = (userRoles: string[]) => {
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
  const orderTypeList = new Set([]);
  userRoles.forEach(role => {
    if (role === "seller" || role === "sellerManager") {
      orderTypeList.add({
        value: ORDER_TYPE.purchase,
        label: "采购订单"
      });
    } else if (role === "purchaser" || role === "purchaserManager") {
      orderTypeList.add({
        value: ORDER_TYPE.sale,
        label: "销售订单"
      });
    } else if (role === "finance" || role === "financeManager") {
      orderTypeList.add({
        value: ORDER_TYPE.purchase,
        label: "采购订单"
      });
      orderTypeList.add({
        value: ORDER_TYPE.sale,
        label: "销售订单"
      });
      orderTypeList.add({
        value: ORDER_TYPE.claim,
        label: "理赔订单"
      });
    }
  });
  return [...orderTypeList];
};

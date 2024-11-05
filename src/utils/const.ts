export const BaseImagePath = "https://s4-tire.zyha.cn/cover/";
export const BaseStaticUploadPath = "http://127.0.0.1:3000/api/static";

export const CUR_ORDER_TYPE = "curOrderType";

export enum SYS {
  dict = "sys_dict",
  setting = "sys_setting"
}

export enum ALL_LIST {
  repo = "all_repo",
  provider = "all_provider",
  customer = "all_customer",
  tire = "all_tire",
  manager = "all_manager",
  employee = "all_employee",
  position = "all_position"
}

export enum StaticImageTypeEnum {
  AVATAR = 1,
  COVER = 2,
  LOGO = 3,
  DRIVER = 4
}

export enum ORDER_TYPE {
  purchase = "purchase-order",
  sale = "sale-order",
  claim = "claim-order",
  return = "return-order",
  waste = "waste-order",
  transfer = "transfer-order",
  assembly = "assembly-order"
}

export const ORDER_TYPE_LIST = [
  {
    value: ORDER_TYPE.purchase,
    label: "采购订单"
  },
  {
    value: ORDER_TYPE.sale,
    label: "销售订单"
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
      orderTypeList.add([
        {
          value: ORDER_TYPE.purchase,
          label: "采购订单"
        },
        {
          value: ORDER_TYPE.sale,
          label: "销售订单"
        },
        {
          value: ORDER_TYPE.claim,
          label: "理赔订单"
        }
      ]);
    }
  });
  return [...orderTypeList];
};

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

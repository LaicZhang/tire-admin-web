import { ORDER_TYPE } from "@/utils";
import {
  purchaseOrderDeatailsColumns,
  saleOrderDeatailsColumns,
  assemblyOrderDeatailsColumns,
  claimOrderDetailsColumns,
  returnOrderDetailsColumns,
  transferOrderDetailsColumns,
  wasteOrderDetailsColumns,
  assemblyOrderFormRules,
  claimOrderFormRules,
  purchaseOrderFormRules,
  returnOrderFormRules,
  saleOrderFormRules,
  transferOrderFormRules,
  wasteOrderFormRules
} from "./props";

export const getCommonData = (uid: string, companyId: string, curData) => {
  return {
    uid,
    company: {
      connect: { uid: companyId }
    },
    auditor: {
      connect: { uid: curData.auditorId }
    }
  };
};

const columnsMap = {
  [ORDER_TYPE.purchase]: purchaseOrderDeatailsColumns,
  [ORDER_TYPE.sale]: saleOrderDeatailsColumns,
  [ORDER_TYPE.assembly]: assemblyOrderDeatailsColumns,
  [ORDER_TYPE.claim]: claimOrderDetailsColumns,
  [ORDER_TYPE.return]: returnOrderDetailsColumns,
  [ORDER_TYPE.transfer]: transferOrderDetailsColumns,
  [ORDER_TYPE.waste]: wasteOrderDetailsColumns,
  [ORDER_TYPE.default]: []
};

const formRulesMap = {
  [ORDER_TYPE.purchase]: purchaseOrderFormRules,
  [ORDER_TYPE.sale]: saleOrderFormRules,
  [ORDER_TYPE.assembly]: assemblyOrderFormRules,
  [ORDER_TYPE.claim]: claimOrderFormRules,
  [ORDER_TYPE.return]: returnOrderFormRules,
  [ORDER_TYPE.transfer]: transferOrderFormRules,
  [ORDER_TYPE.waste]: wasteOrderFormRules,
  [ORDER_TYPE.default]: {}
};

export const getColumns = orderType => {
  return columnsMap[orderType];
};

export const getFormRules = orderType => {
  return formRulesMap[orderType];
};

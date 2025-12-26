import { ORDER_TYPE } from "@/utils";
import type { FormRules } from "element-plus";
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
  wasteOrderFormRules,
  purchasePlanDetailsColumns,
  purchasePlanFormRules,
  purchaseInquiryDetailsColumns,
  purchaseInquiryFormRules,
  saleQuotationDetailsColumns,
  saleQuotationFormRules
} from "./props";

type CurOrderData = {
  auditorId?: string;
};

export const getCommonData = (
  uid: string,
  companyId: string,
  curData: CurOrderData
) => {
  return {
    uid,
    company: {
      connect: { uid: companyId }
    },
    ...(curData.auditorId
      ? {
          auditor: {
            connect: { uid: curData.auditorId }
          }
        }
      : {})
  };
};

const columnsMap: Record<ORDER_TYPE, TableColumnList> = {
  [ORDER_TYPE.purchase]: purchaseOrderDeatailsColumns,
  [ORDER_TYPE.sale]: saleOrderDeatailsColumns,
  [ORDER_TYPE.assembly]: assemblyOrderDeatailsColumns,
  [ORDER_TYPE.claim]: claimOrderDetailsColumns,
  [ORDER_TYPE.return]: returnOrderDetailsColumns,
  [ORDER_TYPE.transfer]: transferOrderDetailsColumns,
  [ORDER_TYPE.waste]: wasteOrderDetailsColumns,
  [ORDER_TYPE.purchasePlan]: purchasePlanDetailsColumns,
  [ORDER_TYPE.purchaseInquiry]: purchaseInquiryDetailsColumns,
  [ORDER_TYPE.saleQuotation]: saleQuotationDetailsColumns,
  [ORDER_TYPE.surplus]: [],
  [ORDER_TYPE.default]: []
};

const formRulesMap: Record<ORDER_TYPE, FormRules> = {
  [ORDER_TYPE.purchase]: purchaseOrderFormRules,
  [ORDER_TYPE.sale]: saleOrderFormRules,
  [ORDER_TYPE.assembly]: assemblyOrderFormRules,
  [ORDER_TYPE.claim]: claimOrderFormRules,
  [ORDER_TYPE.return]: returnOrderFormRules,
  [ORDER_TYPE.transfer]: transferOrderFormRules,
  [ORDER_TYPE.waste]: wasteOrderFormRules,
  [ORDER_TYPE.purchasePlan]: purchasePlanFormRules,
  [ORDER_TYPE.purchaseInquiry]: purchaseInquiryFormRules,
  [ORDER_TYPE.saleQuotation]: saleQuotationFormRules,
  [ORDER_TYPE.surplus]: {} as FormRules,
  [ORDER_TYPE.default]: {} as FormRules
};

export const getColumns = (orderType: ORDER_TYPE): TableColumnList => {
  return columnsMap[orderType] ?? [];
};

export const getFormRules = (orderType: ORDER_TYPE): FormRules => {
  return formRulesMap[orderType] ?? ({} as FormRules);
};

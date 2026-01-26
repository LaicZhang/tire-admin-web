import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/sales/";

export interface SalesQuotationDto {
  customerId?: string;
  customerName?: string;
  desc?: string;
  status?: string;
  validUntil?: string;
  quotationNo?: string;
  totalAmount?: number;
  items?: Array<{ tireId: string; price: number; count: number }>;
}

export interface SalesQuotation extends SalesQuotationDto {
  id: number;
  uid: string;
}

/** 销售报价查询参数 */
export interface SalesQuotationQuery {
  customerId?: string;
  status?: string;
  quotationNo?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

/** 销售报价单 API */
export async function getSalesQuotationListApi(
  index: number,
  params?: SalesQuotationQuery
) {
  return await http.request<CommonResult<PaginatedResponseDto<SalesQuotation>>>(
    "get",
    baseUrlApi(prefix + "quotation/" + index),
    { params }
  );
}

export async function createSalesQuotationApi(data: SalesQuotationDto) {
  return await http.request<CommonResult<SalesQuotation>>(
    "post",
    baseUrlApi(prefix + "quotation"),
    {
      data
    }
  );
}

export async function updateSalesQuotationApi(
  id: string,
  data: Partial<SalesQuotationDto>
) {
  return await http.request<CommonResult<SalesQuotation>>(
    "patch",
    baseUrlApi(prefix + "quotation/" + id),
    {
      data
    }
  );
}

export async function deleteSalesQuotationApi(id: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + "quotation/" + id)
  );
}

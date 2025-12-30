/** Sales Report Module Types */

export interface SalesStatistics {
  totalOrders: number;
  totalAmount: number;
  totalReceived: number;
  totalUnreceived: number;
  totalQuantity: number;
  averageOrderAmount: number;
}

export interface CustomerRanking {
  customerId: string;
  customerName: string;
  orderCount: number;
  totalAmount: number;
  totalQuantity: number;
  percentage: number;
}

export interface TrendData {
  date: string;
  orderCount: number;
  amount: number;
  quantity: number;
}

export interface ProductStats {
  tireId: string;
  tireName: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface ReportQueryParams {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  groupBy?: "day" | "week" | "month" | "year";
}

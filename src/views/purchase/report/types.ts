/** Purchase Report Module Types */

export interface PurchaseStatistics {
  totalOrders: number;
  totalAmount: number;
  totalPaid: number;
  totalUnpaid: number;
  totalQuantity: number;
  averageOrderAmount: number;
}

export interface ProviderRanking {
  providerId: string;
  providerName: string;
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

export interface CategoryStats {
  category: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface ReportQueryParams {
  startDate?: string;
  endDate?: string;
  providerId?: string;
  groupBy?: "day" | "week" | "month" | "year";
}

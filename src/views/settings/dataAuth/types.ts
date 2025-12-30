// 数据授权 - 类型定义
export interface DataAuthUser {
  uid: string;
  username: string;
  phone: string;
  roleName: string;
  customerAuth: "all" | "partial";
  supplierAuth: "all" | "partial";
  warehouseAuth: "all" | "partial";
  authTime: string;
}

export interface AuthItem {
  uid: string;
  name: string;
  code: string;
  authTime: string;
}

export interface DataAuthDetail {
  userId: string;
  username: string;
  customers: AuthItem[];
  suppliers: AuthItem[];
  warehouses: AuthItem[];
}

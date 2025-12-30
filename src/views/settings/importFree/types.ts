// 导入免费版账套 - 类型定义
export interface FreeAccountItem {
  uid: string;
  accountName: string;
  companyName: string;
  ownerName: string;
  ownerPhone: string;
  userCount: number;
  role: "admin" | "manager" | "user";
  createTime: string;
  lastLoginTime: string;
  status: "available" | "locked";
}

export interface ImportFreeFormProps {
  formInline: FreeAccountItem;
}

export interface AuthRequest {
  accountId: string;
  phone: string;
  verifyCode: string;
}

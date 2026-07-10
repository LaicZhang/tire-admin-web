export type CommonResult<T = unknown> = {
  code: number;
  msg: string;
  data: T;
};

export type UserResult = {
  code: number;
  success?: boolean;
  msg: string;
  data: {
    /** 头像 */
    avatar?: string;
    /** 用户名 */
    username: string;
    /** 昵称 */
    nickname?: string;
    /** 当前登录用户的角色 */
    roles: Array<string>;
    /** 按钮级别权限 */
    permissions?: Array<string>;
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

export type RefreshTokenResult = {
  code: number;
  msg: string;
  data: {
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

export interface AuthSessionUser {
  uid: string;
  username: string;
  currentCompanyId: string;
  currentStoreId: string;
}

export type AuthSessionResult = CommonResult<{
  authenticated: boolean;
  user: AuthSessionUser;
}>;

export type PaginatedResponseDto<T = unknown> = {
  list: T[];
  total: number;
  page?: number;
  pageSize?: number;
};

export type CountResponseDto = {
  count: number;
};

/** 公司信息 */
export interface CompanyInfo {
  id: number;
  uid: string;
  name: string;
  desc?: string;
  status: boolean;
  principalName?: string;
  principalPhone?: string;
  province?: string;
  city?: string;
  bossId?: string;
  createAt?: string;
  updateAt?: string;
}

export type CaptchaResponseDto = {
  data: {
    id: string;
    image: string;
  };
};

export type VerifySendResponseDto = {
  success: boolean;
};

// 支付相关类型
export type PaymentAccount = {
  uid: string;
  companyId?: string;
  companyUid?: string;
  balance: number | string;
  frozen?: number | string;
  /** 账户名称 */
  name: string;
  /** 银行名称 */
  bankName?: string;
  /** 银行账号 */
  bankAccount?: string;
  /** 账户类型 */
  accountType?: string;
  /** 备注 */
  desc?: string | null;
  /** 启停用 */
  status?: boolean | null;
  /** 排序级别 */
  level?: number | null;
  /** 创建时间 */
  createAt?: string;
  /** 更新时间 */
  updateAt?: string;
};

export type PaymentRecord = {
  uid: string;
  serialNumber: string;
  type: string;
  beforeModify: number | string;
  modified: number | string;
  afterModify: number | string;
  sign: string;
  /** 描述 */
  desc?: string;
  /** 关联订单ID */
  orderId?: string;
  /** 创建时间 */
  createTime?: string;
};

export type CreatePaymentDto = {
  company: {
    uid: string;
  };
  payment: {
    name: string;
    type?: number;
    accountType?: string;
    bankName?: string;
    bankAccount?: string;
    desc?: string | null;
    status?: boolean | null;
    level?: number | null;
    /** 初始余额，单位分 */
    balance?: number;
    /** 初始冻结金额，单位分 */
    frozen?: number;
  };
};

export type UpdatePaymentProfileDto = {
  type?: number;
  name?: string;
  accountType?: string;
  bankName?: string;
  bankAccount?: string;
  desc?: string | null;
  status?: boolean | null;
  level?: number | null;
};

export type UpdatePaymentDto = {
  type: "top-up" | "pay" | "freeze" | "unfreeze" | "pay-frozen";
  /** 支付账户更新信息 */
  payment?: {
    type?: number;
    name?: string;
    bankName?: string;
    bankAccount?: string;
    accountType?: string;
    desc?: string | null;
    status?: boolean | null;
    level?: number | null;
  };
  /** 交易记录信息 */
  record: {
    modified: number;
    operator?: {
      connect: {
        uid: string;
      };
    };
    desc?: string;
    orderId?: string;
    type?: number;
    confirm?: boolean;
  };
};

// 物流相关类型
export type LogisticStatus = {
  uid: string;
  type: string;
  logisticsStatus: number;
  isArrival: boolean;
  arrivalAt?: string | null;
  departureAt?: string | null;
  /** 物流公司 */
  logisticsCompany?: string;
  /** 物流单号 */
  trackingNumber?: string;
  /** 司机信息 */
  driverInfo?: string;
};

export type UpdateLogisticDto = {
  type: string;
  isArrival: boolean;
  /** 物流公司 */
  logisticsCompany?: string;
  /** 物流单号 */
  trackingNumber?: string;
  /** 到货/发货时间 */
  timestamp?: string;
};

// 订单相关类型
export type ClaimOrderPaymentDto = {
  fee: number;
  isReceive: boolean;
};

export type RefundOrderDto = {
  fee: number;
};

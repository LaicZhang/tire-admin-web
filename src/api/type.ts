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

export type PaginatedResponseDto<T = any> = {
  count: number;
  list: T[];
};

export type CountResponseDto = {
  count: number;
};

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
  companyUid: string;
  balance: number | string;
  [key: string]: any;
};

export type PaymentRecord = {
  uid: string;
  serialNumber: string;
  type: string;
  beforeModify: number | string;
  modified: number | string;
  afterModify: number | string;
  sign: string;
  [key: string]: any;
};

export type CreatePaymentDto = {
  companyUid: string;
  [key: string]: any;
};

export type UpdatePaymentDto = {
  type: "top-up" | "pay";
  payment?: any;
  record?: any;
  [key: string]: any;
};

// 物流相关类型
export type LogisticStatus = {
  uid: string;
  type: string;
  logisticsStatus: number;
  isArrival: boolean;
  arrivalAt?: string | null;
  departureAt?: string | null;
  [key: string]: any;
};

export type UpdateLogisticDto = {
  type: string;
  isArrival: boolean;
  [key: string]: any;
};

// 订单相关类型
export type ClaimOrderPaymentDto = {
  fee: number;
  isReceive: boolean;
};

export type RefundOrderDto = {
  fee: number;
};

export type OrderDetailDto = {
  tireId?: string;
  count?: number;
  total?: number;
  isExchange?: boolean;
  exchangeTireId?: string;
  exchangeCount?: number;
  [key: string]: any;
};

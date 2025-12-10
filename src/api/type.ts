export type CommonResult = {
  code: number;
  msg: string;
  data: any;
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

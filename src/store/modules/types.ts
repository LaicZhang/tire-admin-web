import type { RouteRecordName } from "vue-router";

export type cacheType = {
  mode: string;
  name?: RouteRecordName;
};

export type positionType = {
  startIndex?: number;
  length?: number;
};

export type appType = {
  sidebar: {
    opened: boolean;
    withoutAnimation: boolean;
    // 判断是否手动点击Collapse
    isClickCollapse: boolean;
  };
  layout: string;
  device: string;
  viewportSize: {
    width: number;
    height: number;
  };
};

export interface RouteMeta {
  title?: string;
  icon?: string | null;
  roles?: string[];
  keepAlive?: boolean;
  showLink?: boolean;
  showParent?: boolean;
  rank?: number;
  auths?: string[];
  frameSrc?: string;
  frameLoading?: boolean;
  transition?: {
    name?: string;
    enterTransition?: string;
    leaveTransition?: string;
  };
  hiddenTag?: boolean;
  dynamicLevel?: number;
  activePath?: string;
}

export type multiType = {
  path: string;
  name: string;
  meta: RouteMeta;
  query?: Record<string, string>;
  params?: Record<string, string>;
};

export type setType = {
  title: string;
  fixedHeader: boolean;
  hiddenSideBar: boolean;
};

export type userType = {
  avatar: string;
  username: string;
  nickname: string;
  uid: string;
  roles: Array<string>;
  permissions: Array<string>;

  /** 是否勾选登录页免登录 */
  isRemember: boolean;
  captchaCode: string;
  currentPage: number;
  /** 免登录天数 */
  loginDay: number;
};

export type currentCompanyType = {
  companyName: string;
  companyId: string;
};

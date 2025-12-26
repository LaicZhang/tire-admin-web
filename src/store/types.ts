export type cacheType = {
  mode: string;
  name?: string;
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
  viewportSize: { width: number; height: number };
};

export type multiType = {
  path: string;
  name: string;
  meta: {
    title?: string;
    icon?: string;
    roles?: string[];
    auths?: string[];
    keepAlive?: boolean;
    showLink?: boolean;
    hiddenTag?: boolean;
    dynamicLevel?: number;
    frameSrc?: string;
  };
  query?: Record<string, string>;
  params?: Record<string, string>;
};

export type setType = {
  title: string;
  fixedHeader: boolean;
  hiddenSideBar: boolean;
};

export type userType = {
  avatar?: string;
  username?: string;
  nickname?: string;
  roles?: Array<string>;
  permissions?: Array<string>;
  isRemember?: boolean;
  loginDay?: number;
  currentPage?: number;
  captchaCode?: string;
};

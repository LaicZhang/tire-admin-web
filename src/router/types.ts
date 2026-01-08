import type { RouteRecordRaw } from "vue-router";

export type ExtendedRouteRecord = RouteRecordRaw & {
  id?: number;
  uid?: string;
  parentId?: string | number | null;
  isShow?: boolean;
  rank?: number;
};

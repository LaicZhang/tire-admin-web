import { ORDER_TYPE } from "@/utils/const";

const ROUTE_ORDER_TYPE_MAP: Record<string, string> = {
  "/business/supplierClaim": ORDER_TYPE.supplierClaim
};

export function resolveRouteOrderType(params: {
  path: string;
  queryOrderType?: string;
}) {
  if (params.queryOrderType) {
    return params.queryOrderType;
  }

  return ROUTE_ORDER_TYPE_MAP[params.path] ?? "";
}

import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/logistic/";

export async function getLogisticListApi(
  index: number,
  params?: {
    type?: string;
    isArrival?: boolean;
    query?: string;
  }
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + `page/${index}`),
    { params }
  );
}

export async function getLogisticApi(uid: string, type: string) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid), {
    params: { type }
  });
}

/** 物流更新数据类型 */
export interface UpdateLogisticData {
  type: string;
  isArrival: boolean;
  /** 物流公司 */
  logisticsCompany?: string;
  /** 物流单号 */
  trackingNumber?: string;
  /** 司机姓名 */
  driverName?: string;
  /** 司机电话 */
  driverPhone?: string;
  /** 到达/发货时间 */
  timestamp?: string;
  /** 备注 */
  remark?: string;
}

export async function updateLogisticApi(uid: string, data: UpdateLogisticData) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function cancelLogisticApi(uid: string, type: string) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid), {
    params: { type }
  });
}

// ============ 发运计划 ============

/** 创建发运计划 */
export async function createShippingPlanApi(data: {
  name: string;
  plannedDate: string;
  orders: string[];
}) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "shipping-plan"),
    { data }
  );
}

/** 获取发运计划列表 */
export async function getShippingPlanListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + `shipping-plan/page/${index}`),
    { params }
  );
}

// ============ 装车任务 ============

/** 创建装车任务 */
export async function createLoadingTaskApi(data: {
  vehicleNo: string;
  driverName?: string;
  driverPhone?: string;
  orders: string[];
}) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "loading-task"),
    { data }
  );
}

/** 获取装车任务列表 */
export async function getLoadingTaskListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + `loading-task/page/${index}`),
    { params }
  );
}

// ============ 发货波次 ============

/** 创建发货波次 */
export async function createShippingWaveApi(data: object) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "shipping-wave"),
    { data }
  );
}

/** 获取发货波次列表 */
export async function getShippingWaveListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + `shipping-wave/page/${index}`),
    { params }
  );
}

// ============ 签收与异常 ============

/** 创建签收回执 */
export async function createDeliveryReceiptApi(data: {
  logisticUid: string;
  receiverName: string;
  signedAt: string;
  remark?: string;
}) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "delivery-receipt"),
    { data }
  );
}

/** 创建配送异常 */
export async function createDeliveryExceptionApi(data: {
  logisticUid: string;
  type: string;
  description: string;
  images?: string[];
}) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "delivery-exception"),
    { data }
  );
}

// ============ 物流跟踪 ============

/** 同步物流跟踪信息 */
export async function syncTrackingApi(trackingNo: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "tracking/sync"),
    { data: { trackingNo } }
  );
}

/** 添加跟踪节点 */
export async function addTrackingNodeApi(data: {
  logisticUid: string;
  time: string;
  location: string;
  description: string;
}) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "tracking/node"),
    { data }
  );
}

/** 查询物流跟踪信息 */
export async function getTrackingApi(trackingNo: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + `tracking/${trackingNo}`)
  );
}

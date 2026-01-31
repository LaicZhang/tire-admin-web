/**
 * 订单确认操作 Composable
 * 封装发货/到货/送达等批量确认逻辑
 */

import { handleApiError, message } from "@/utils";

/** 订单明细基础类型 */
export interface OrderDetailBase {
  uid?: string;
  isShipped?: boolean;
  isArrival?: boolean;
  isDelivered?: boolean;
  count?: number;
}

/** 确认 API 参数类型 */
export interface ConfirmApiParams {
  detailUid: string;
  [key: string]: unknown;
}

/** 批量确认配置 */
export interface ConfirmBatchConfig<TDetail extends OrderDetailBase> {
  /** 过滤待处理明细的函数 */
  filterFn: (detail: TDetail) => boolean;
  /** 确认 API 函数 */
  confirmApi: (orderId: string, params: ConfirmApiParams) => Promise<unknown>;
  /** 无待处理项时的提示 */
  emptyMessage: string;
  /** 成功提示 */
  successMessage: string;
  /** 错误提示 */
  errorMessage: string;
}

/** 配置选项 */
export interface UseOrderConfirmActionsOptions {
  /** 操作成功后的回调 */
  onSuccess: () => Promise<void> | void;
}

/**
 * 订单确认操作 Composable
 *
 * @example
 * ```ts
 * const { handleConfirmBatch } = useOrderConfirmActions({
 *   onSuccess: getList
 * });
 *
 * // 确认发货
 * handleConfirmBatch(row, {
 *   filterFn: d => !d.isShipped,
 *   confirmApi: confirmShipmentApi,
 *   emptyMessage: '所有商品已发货',
 *   successMessage: '确认发货成功',
 *   errorMessage: '确认发货失败'
 * });
 * ```
 */
export function useOrderConfirmActions(options: UseOrderConfirmActionsOptions) {
  const { onSuccess } = options;

  /**
   * 批量确认操作
   * @param orderId 订单 ID
   * @param details 订单明细列表
   * @param config 确认配置
   */
  async function handleConfirmBatch<TDetail extends OrderDetailBase>(
    orderId: string,
    details: TDetail[],
    config: ConfirmBatchConfig<TDetail>
  ): Promise<void> {
    const { filterFn, confirmApi, emptyMessage, successMessage, errorMessage } =
      config;

    const pendingDetails = details.filter(filterFn);

    if (pendingDetails.length === 0) {
      message(emptyMessage, { type: "info" });
      return;
    }

    try {
      for (const detail of pendingDetails) {
        if (detail.uid) {
          await confirmApi(orderId, { detailUid: detail.uid });
        }
      }
      message(successMessage, { type: "success" });
      await onSuccess();
    } catch (error) {
      handleApiError(error, errorMessage);
    }
  }

  /**
   * 确认发货（销售订单专用）
   */
  async function handleConfirmShipment<
    TDetail extends { uid?: string; isShipped?: boolean; count?: number },
    T extends { uid: string; details: TDetail[] }
  >(
    row: T,
    confirmApi: (
      orderId: string,
      params: ConfirmApiParams & { shipCount?: number }
    ) => Promise<unknown>
  ): Promise<void> {
    const pendingDetails = (row.details || []).filter(d => !d.isShipped);

    if (pendingDetails.length === 0) {
      message("所有商品已发货", { type: "info" });
      return;
    }

    try {
      for (const detail of pendingDetails) {
        if (detail.uid) {
          await confirmApi(row.uid, {
            detailUid: detail.uid,
            shipCount: detail.count
          });
        }
      }
      message("确认发货成功", { type: "success" });
      await onSuccess();
    } catch (error) {
      handleApiError(error, "确认发货失败");
    }
  }

  /**
   * 确认送达（销售订单专用）
   */
  async function handleConfirmDelivery<
    TDetail extends {
      uid?: string;
      isShipped?: boolean;
      isDelivered?: boolean;
    },
    T extends { uid: string; details: TDetail[] }
  >(
    row: T,
    confirmApi: (orderId: string, params: ConfirmApiParams) => Promise<unknown>
  ): Promise<void> {
    const shippedDetails = (row.details || []).filter(
      d => d.isShipped && !d.isDelivered
    );

    if (shippedDetails.length === 0) {
      message("所有商品已送达", { type: "info" });
      return;
    }

    try {
      for (const detail of shippedDetails) {
        if (detail.uid) {
          await confirmApi(row.uid, { detailUid: detail.uid });
        }
      }
      message("确认送达成功", { type: "success" });
      await onSuccess();
    } catch (error) {
      handleApiError(error, "确认送达失败");
    }
  }

  /**
   * 确认到货（采购订单/调拨订单专用）
   */
  async function handleConfirmArrival<
    TDetail extends { uid?: string; isShipped?: boolean; isArrival?: boolean },
    T extends { uid: string; details: TDetail[] }
  >(
    row: T,
    confirmApi: (orderId: string, params: ConfirmApiParams) => Promise<unknown>,
    options?: {
      /** 是否需要先发货才能到货（调拨订单） */
      requireShipped?: boolean;
    }
  ): Promise<void> {
    const filterFn = options?.requireShipped
      ? (d: OrderDetailBase) => d.isShipped && !d.isArrival
      : (d: OrderDetailBase) => !d.isArrival;

    const pendingDetails = (row.details || []).filter(filterFn);

    if (pendingDetails.length === 0) {
      message("所有商品已到货", { type: "info" });
      return;
    }

    try {
      for (const detail of pendingDetails) {
        if (detail.uid) {
          await confirmApi(row.uid, { detailUid: detail.uid });
        }
      }
      message("确认到货成功", { type: "success" });
      await onSuccess();
    } catch (error) {
      handleApiError(error, "确认到货失败");
    }
  }

  return {
    handleConfirmBatch,
    handleConfirmShipment,
    handleConfirmDelivery,
    handleConfirmArrival
  };
}

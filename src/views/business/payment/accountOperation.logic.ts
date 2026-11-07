import { resolveApiError } from "@/utils/apiErrorContract";
import { ApiResponseError } from "@/utils/apiResponse";
import type { UpdatePaymentDto } from "@/api/type";

export const LARGE_OPERATION_CONFIRM_ERROR_CODE =
  "VALIDATION.LARGE_PAYMENT_OPERATION_CONFIRM_REQUIRED";

type OperationType = UpdatePaymentDto["type"];

export interface OperationPayloadInput {
  type: OperationType;
  amountFen: number;
  operatorUid: string;
  reason: string;
  desc?: string;
  /** 大额二次确认通过后置为 true；服务端按 record.confirm 校验。 */
  confirm?: boolean;
}

export function buildOperationPayload(
  input: OperationPayloadInput
): UpdatePaymentDto {
  return {
    type: input.type,
    reason: input.reason,
    record: {
      modified: input.amountFen,
      operator: { connect: { uid: input.operatorUid } },
      ...(input.desc ? { desc: input.desc } : {}),
      ...(input.confirm ? { confirm: true } : {})
    }
  };
}

/**
 * 从任意 catch 到的错误里取 errorCode。
 * - 信封拦截器 reject 的是 `ApiResponseError`（单测/成功响应路径）；
 * - axios 失败路径可能直接 reject 信封对象（错误拦截器）；
 * - 网络错误走传输层兜底，返回 `HTTP_0`。
 */
export function resolveOperationErrorCode(error: unknown): string | undefined {
  if (error instanceof ApiResponseError) {
    return error.resolved.errorCode;
  }
  return resolveApiError(error).errorCode;
}

export interface SubmitWithLargeOperationConfirmArgs {
  amountFen: number;
  /** confirm=true 表示用户已确认大额风险。 */
  submit: (confirm: boolean) => Promise<void>;
  /** 返回 false 表示用户取消。 */
  confirmLarge: (amountFen: number) => Promise<boolean>;
}

/**
 * 先按普通操作提交；只有服务端返回大额确认错误码时才弹确认并带
 * `record.confirm=true` 重试一次。阈值只在服务端判断，前端不硬编码。
 */
export async function submitWithLargeOperationConfirm(
  args: SubmitWithLargeOperationConfirmArgs
): Promise<"submitted" | "cancelled"> {
  try {
    await args.submit(false);
    return "submitted";
  } catch (error) {
    if (
      resolveOperationErrorCode(error) !== LARGE_OPERATION_CONFIRM_ERROR_CODE
    ) {
      throw error;
    }
  }

  const confirmed = await args.confirmLarge(args.amountFen);
  if (!confirmed) return "cancelled";

  await args.submit(true);
  return "submitted";
}

import { describe, expect, it, vi } from "vitest";
import { resolveApiError } from "@/utils/apiErrorContract";
import { ApiResponseError } from "@/utils/apiResponse";
import {
  LARGE_OPERATION_CONFIRM_ERROR_CODE,
  buildOperationPayload,
  resolveOperationErrorCode,
  submitWithLargeOperationConfirm
} from "../accountOperation.logic";

function largeOperationError(): ApiResponseError {
  const envelope = {
    code: 403,
    msg: "大额资金操作需要二次确认",
    errorCode: LARGE_OPERATION_CONFIRM_ERROR_CODE
  };
  return new ApiResponseError(envelope, resolveApiError(envelope));
}

describe("accountOperation.logic", () => {
  it("builds the payload with a top-level reason and optional confirm", () => {
    expect(
      buildOperationPayload({
        type: "top-up",
        amountFen: 12345,
        operatorUid: "user-1",
        reason: "现金充值已核对",
        desc: "现金"
      })
    ).toEqual({
      type: "top-up",
      reason: "现金充值已核对",
      record: {
        modified: 12345,
        operator: { connect: { uid: "user-1" } },
        desc: "现金"
      }
    });

    expect(
      buildOperationPayload({
        type: "pay",
        amountFen: 100,
        operatorUid: "user-1",
        reason: "付款核对",
        confirm: true
      }).record
    ).toMatchObject({ modified: 100, confirm: true });
  });

  it("extracts errorCode from ApiResponseError and raw envelopes", () => {
    expect(resolveOperationErrorCode(largeOperationError())).toBe(
      LARGE_OPERATION_CONFIRM_ERROR_CODE
    );
    expect(
      resolveOperationErrorCode({
        code: 403,
        msg: "x",
        errorCode: LARGE_OPERATION_CONFIRM_ERROR_CODE
      })
    ).toBe(LARGE_OPERATION_CONFIRM_ERROR_CODE);
    expect(resolveOperationErrorCode(new Error("network"))).toBe("HTTP_0");
  });

  it("submits without confirmation when the operation is below the threshold", async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    const confirmLarge = vi.fn().mockResolvedValue(true);

    await expect(
      submitWithLargeOperationConfirm({
        amountFen: 100,
        submit,
        confirmLarge
      })
    ).resolves.toBe("submitted");

    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith(false);
    expect(confirmLarge).not.toHaveBeenCalled();
  });

  it("confirms once and retries with record.confirm=true", async () => {
    const submit = vi
      .fn()
      .mockRejectedValueOnce(largeOperationError())
      .mockResolvedValueOnce(undefined);
    const confirmLarge = vi.fn().mockResolvedValue(true);

    await expect(
      submitWithLargeOperationConfirm({
        amountFen: 1_000_000,
        submit,
        confirmLarge
      })
    ).resolves.toBe("submitted");

    expect(confirmLarge).toHaveBeenCalledWith(1_000_000);
    expect(submit).toHaveBeenCalledTimes(2);
    expect(submit).toHaveBeenNthCalledWith(1, false);
    expect(submit).toHaveBeenNthCalledWith(2, true);
  });

  it("does not retry when the user cancels the confirmation", async () => {
    const submit = vi.fn().mockRejectedValueOnce(largeOperationError());
    const confirmLarge = vi.fn().mockResolvedValue(false);

    await expect(
      submitWithLargeOperationConfirm({
        amountFen: 1_000_000,
        submit,
        confirmLarge
      })
    ).resolves.toBe("cancelled");

    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("rethrows other failures instead of prompting", async () => {
    const submit = vi
      .fn()
      .mockRejectedValueOnce(new Error("insufficient balance"));
    const confirmLarge = vi.fn();

    await expect(
      submitWithLargeOperationConfirm({
        amountFen: 100,
        submit,
        confirmLarge
      })
    ).rejects.toThrow("insufficient balance");
    expect(confirmLarge).not.toHaveBeenCalled();
  });
});

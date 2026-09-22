import { describe, expect, it } from "vitest";
import {
  isFollowupErrorToastSuppressed,
  markHttpErrorNotified,
  suppressFollowupErrorToasts,
  wasHttpErrorNotified
} from "../notified-error";

describe("notified-error", () => {
  it("marks envelopes without changing enumerable fields", () => {
    const envelope = { code: 400, msg: "nope", errorCode: "HTTP_400" };
    expect(markHttpErrorNotified(envelope)).toBe(envelope);
    expect(wasHttpErrorNotified(envelope)).toBe(true);
    expect(Object.keys(envelope)).toEqual(["code", "msg", "errorCode"]);
    expect(wasHttpErrorNotified({ code: 400, msg: "plain" })).toBe(false);
    expect(wasHttpErrorNotified(null)).toBe(false);
  });

  it("suppresses follow-up error toasts only until the next macrotask", async () => {
    expect(isFollowupErrorToastSuppressed()).toBe(false);
    suppressFollowupErrorToasts();
    expect(isFollowupErrorToastSuppressed()).toBe(true);
    await Promise.resolve();
    expect(isFollowupErrorToastSuppressed()).toBe(true);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(isFollowupErrorToastSuppressed()).toBe(false);
  });
});

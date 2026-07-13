import { describe, expect, it } from "vitest";
import {
  buildUpdateCurrentUserInfoPayload,
  requiresCurrentPassword
} from "../profile-edit";

describe("views/auth/profile-edit", () => {
  it("requires current password when phone changes", () => {
    expect(
      requiresCurrentPassword(
        { phone: "13800000000", email: "a@b.com" },
        { phone: "13900000000", email: "a@b.com" }
      )
    ).toBe(true);
  });

  it("requires current password when email changes", () => {
    expect(
      requiresCurrentPassword(
        { phone: "13800000000", email: "a@b.com" },
        { phone: "13800000000", email: "c@d.com" }
      )
    ).toBe(true);
  });

  it("does not require current password for non sensitive changes", () => {
    expect(
      requiresCurrentPassword(
        { phone: "13800000000", email: "a@b.com" },
        { nickname: "new name", phone: "13800000000", email: "a@b.com" }
      )
    ).toBe(false);
  });

  it("builds the update payload with current password when provided", () => {
    expect(
      buildUpdateCurrentUserInfoPayload({
        nickname: "new name",
        phone: "13900000000",
        email: "c@d.com",
        gender: 0,
        birthday: "2026-01-01",
        currentPassword: "secret"
      })
    ).toEqual({
      nickname: "new name",
      phone: "13900000000",
      email: "c@d.com",
      gender: 0,
      birthday: "2026-01-01",
      currentPassword: "secret"
    });
  });
});

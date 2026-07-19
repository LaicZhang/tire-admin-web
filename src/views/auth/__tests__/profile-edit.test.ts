import { describe, expect, it } from "vitest";
import {
  buildUpdateCurrentUserInfoPayload,
  requiresCurrentPassword
} from "../profile-edit";

const initial = {
  nickname: "old name",
  phone: "13800000000",
  email: "a@b.com",
  gender: 1,
  birthday: "2000-01-01"
};

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

  it("nickname-only payload has no phone/email", () => {
    expect(
      buildUpdateCurrentUserInfoPayload(initial, {
        nickname: "new name",
        phone: "13800000000",
        email: "a@b.com",
        gender: 1,
        birthday: "2000-01-01"
      })
    ).toEqual({
      nickname: "new name",
      gender: 1,
      birthday: "2000-01-01"
    });
  });

  it("phone change includes phone and currentPassword", () => {
    expect(
      buildUpdateCurrentUserInfoPayload(initial, {
        nickname: "old name",
        phone: "13900000000",
        email: "a@b.com",
        gender: 1,
        birthday: "2000-01-01",
        currentPassword: "secret"
      })
    ).toEqual({
      nickname: "old name",
      phone: "13900000000",
      gender: 1,
      birthday: "2000-01-01",
      currentPassword: "secret"
    });
  });

  it("builds the update payload with current password when contact fields change", () => {
    expect(
      buildUpdateCurrentUserInfoPayload(initial, {
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

  it("omits currentPassword when only non-sensitive fields change", () => {
    expect(
      buildUpdateCurrentUserInfoPayload(initial, {
        nickname: "new name",
        phone: "13800000000",
        email: "a@b.com",
        gender: 0,
        birthday: "2000-01-01",
        currentPassword: "secret"
      })
    ).toEqual({
      nickname: "new name",
      gender: 0,
      birthday: "2000-01-01"
    });
  });
});

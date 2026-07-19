import type { UpdateUserInfoDto } from "@/api/auth";

type SensitiveContactFields = {
  phone?: string;
  email?: string;
};

export type ProfileEditSnapshot = SensitiveContactFields & {
  nickname?: string;
  gender?: number;
  birthday?: string;
};

export type ProfileEditFormData = UpdateUserInfoDto & {
  currentPassword?: string;
};

function normalizeText(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function requiresCurrentPassword<
  TInitial extends SensitiveContactFields,
  TNext extends SensitiveContactFields
>(initialData: TInitial, nextData: TNext) {
  return (
    normalizeText(initialData.phone) !== normalizeText(nextData.phone) ||
    normalizeText(initialData.email) !== normalizeText(nextData.email)
  );
}

/**
 * Build PATCH /auth/info payload as a diff against the initial profile snapshot.
 * Sensitive contact fields (phone/email) are only sent when they actually change,
 * so backend re-auth is not triggered for nickname/gender/birthday-only edits.
 */
export function buildUpdateCurrentUserInfoPayload(
  initialData: ProfileEditSnapshot,
  form: ProfileEditFormData
): UpdateUserInfoDto {
  const payload: UpdateUserInfoDto = {};

  if (form.nickname !== undefined) {
    payload.nickname = form.nickname;
  }

  if (normalizeText(form.phone) !== normalizeText(initialData.phone)) {
    payload.phone = form.phone;
  }

  if (normalizeText(form.email) !== normalizeText(initialData.email)) {
    payload.email = form.email;
  }

  if (form.gender !== undefined) {
    payload.gender = form.gender;
  }

  if (normalizeText(form.birthday)) {
    payload.birthday = form.birthday;
  }

  if (requiresCurrentPassword(initialData, form)) {
    const currentPassword = normalizeText(form.currentPassword);
    if (currentPassword) {
      payload.currentPassword = currentPassword;
    }
  }

  return payload;
}

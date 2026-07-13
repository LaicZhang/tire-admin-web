import type { UpdateUserInfoDto } from "@/api/auth";

type SensitiveContactFields = {
  phone?: string;
  email?: string;
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

export function buildUpdateCurrentUserInfoPayload(
  form: ProfileEditFormData
): UpdateUserInfoDto {
  const payload: UpdateUserInfoDto = {};

  if (form.nickname !== undefined) {
    payload.nickname = form.nickname;
  }
  if (form.phone !== undefined) {
    payload.phone = form.phone;
  }
  if (form.email !== undefined) {
    payload.email = form.email;
  }
  if (form.gender !== undefined) {
    payload.gender = form.gender;
  }
  if (normalizeText(form.birthday)) {
    payload.birthday = form.birthday;
  }

  const currentPassword = normalizeText(form.currentPassword);
  if (currentPassword) {
    payload.currentPassword = currentPassword;
  }

  return payload;
}

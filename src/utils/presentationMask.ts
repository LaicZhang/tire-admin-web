const EMPTY_DISPLAY = "-";

function normalizeDisplayValue(value?: string | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function maskPhoneDisplay(value?: string | null) {
  const phone = normalizeDisplayValue(value);
  if (!phone) return EMPTY_DISPLAY;
  if (phone.length <= 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

export function maskEmailDisplay(value?: string | null) {
  const email = normalizeDisplayValue(value);
  if (!email) return EMPTY_DISPLAY;

  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return email;

  return `${email.slice(0, 1)}***${email.slice(atIndex)}`;
}

export function maskBankAccountDisplay(value?: string | null) {
  const account = normalizeDisplayValue(value);
  if (!account) return EMPTY_DISPLAY;
  if (account.length <= 10) return account;
  return `${account.slice(0, 6)}******${account.slice(-4)}`;
}

export function getCompanyScopedOptionKey(
  optionKey: string,
  companyId: string
): string {
  return companyId ? `${optionKey}:company:${companyId}` : optionKey;
}

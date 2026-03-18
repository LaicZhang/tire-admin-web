export type SettingItemLike = Readonly<{
  key: string;
  value?: string | null;
}>;

export type SettingsPresence = Readonly<{
  missingKeys: readonly string[];
  unsetKeys: readonly string[];
}>;

export function analyzeSettingsPresence(params: {
  expectedKeys: readonly string[];
  items: readonly SettingItemLike[];
}): SettingsPresence {
  const valueByKey = new Map<string, string>();
  for (const item of params.items) {
    if (!item?.key) continue;
    valueByKey.set(item.key, String(item.value ?? ""));
  }

  const missingKeys: string[] = [];
  const unsetKeys: string[] = [];

  for (const key of params.expectedKeys) {
    if (!valueByKey.has(key)) {
      missingKeys.push(key);
      continue;
    }
    const raw = valueByKey.get(key);
    if (String(raw ?? "").trim() === "") unsetKeys.push(key);
  }

  return Object.freeze({
    missingKeys: Object.freeze(missingKeys),
    unsetKeys: Object.freeze(unsetKeys)
  });
}

export type ColumnSettings = unknown[];

const keyOf = (module: string) => `data:column-settings:${module}`;

export async function getColumnSettingsApi(
  module: string
): Promise<ColumnSettings | null> {
  try {
    const raw = localStorage.getItem(keyOf(module));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ColumnSettings;
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveColumnSettingsApi(
  module: string,
  columns: ColumnSettings
): Promise<void> {
  localStorage.setItem(keyOf(module), JSON.stringify(columns));
}

export async function clearColumnSettingsApi(module: string): Promise<void> {
  localStorage.removeItem(keyOf(module));
}

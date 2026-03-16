export type CompanySettingsCsvRow = Readonly<Record<string, string>>;

function parseCsvToRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = csvText[i + 1];
        if (next === '"') {
          field += '"';
          i++;
          continue;
        }
        inQuotes = false;
        continue;
      }

      field += ch;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    if (ch === "\r") continue;

    field += ch;
  }

  if (inQuotes) {
    throw new Error("CSV parse error: unterminated quote");
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter(r => r.some(cell => cell.trim().length > 0));
}

function toRecords(rows: string[][]): CompanySettingsCsvRow[] {
  const header = rows[0]?.map(h => h.trim()) ?? [];
  if (header.length === 0) throw new Error("CSV parse error: empty header row");

  const required = [
    "scope",
    "group",
    "key",
    "displayName",
    "settingType",
    "defaultValue",
    "description",
    "uiEntry",
    "api",
    "frontendExists",
    "backendExists",
    "status"
  ] as const;

  for (const k of required) {
    if (!header.includes(k)) {
      throw new Error(`CSV parse error: missing required header "${k}"`);
    }
  }

  const records: CompanySettingsCsvRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length !== header.length) {
      throw new Error(
        `CSV parse error: row ${i + 1} has ${r.length} columns, expected ${header.length}`
      );
    }
    const obj: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = r[j] ?? "";
    }
    records.push(obj);
  }
  return records;
}

export function parseCompanySettingsCsv(
  csvText: string
): CompanySettingsCsvRow[] {
  const rows = parseCsvToRows(csvText);
  if (rows.length < 2) {
    throw new Error("CSV parse error: expected header + at least one row");
  }
  return toRecords(rows);
}

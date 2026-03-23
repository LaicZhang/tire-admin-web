export interface SerialNumberPayload {
  serialNo: string;
  dotCode?: string;
  dotYear?: number;
  dotWeek?: number;
  remark?: string;
}

const FIELD_SPLIT_PATTERN = /[\t,，]+/;

function toOptionalInt(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseSerialNumberLine(line: string): SerialNumberPayload | null {
  const tokens = line
    .split(FIELD_SPLIT_PATTERN)
    .map(item => item.trim())
    .filter(Boolean);

  const [serialNo, dotCode, dotYearText, dotWeekText, ...remarkParts] = tokens;
  if (!serialNo) return null;

  const payload: SerialNumberPayload = { serialNo };
  if (dotCode) payload.dotCode = dotCode;

  const dotYear = toOptionalInt(dotYearText);
  if (dotYear !== undefined) payload.dotYear = dotYear;

  const dotWeek = toOptionalInt(dotWeekText);
  if (dotWeek !== undefined) payload.dotWeek = dotWeek;

  const remark = remarkParts.join(" ").trim();
  if (remark) payload.remark = remark;

  return payload;
}

export function parseSerialNumbersText(
  value?: string | null
): SerialNumberPayload[] {
  if (!value) return [];

  const rows = value
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const serials: SerialNumberPayload[] = [];

  for (const row of rows) {
    const payload = parseSerialNumberLine(row);
    if (!payload || seen.has(payload.serialNo)) continue;
    seen.add(payload.serialNo);
    serials.push(payload);
  }

  return serials;
}

export function formatSerialNumbersText(
  value?: SerialNumberPayload[] | null
): string {
  if (!Array.isArray(value) || value.length === 0) return "";

  return value
    .map(item =>
      [
        item.serialNo,
        item.dotCode,
        item.dotYear?.toString(),
        item.dotWeek?.toString(),
        item.remark
      ]
        .filter(Boolean)
        .join("\t")
    )
    .join("\n");
}

export function parseSerialNoListText(value?: string | null): string[] {
  if (!value) return [];

  const seen = new Set<string>();
  const serialNos: string[] = [];

  for (const item of value.split(/\r?\n/)) {
    const serialNo = item.trim();
    if (!serialNo || seen.has(serialNo)) continue;
    seen.add(serialNo);
    serialNos.push(serialNo);
  }

  return serialNos;
}

export function formatSerialNoListText(value?: string[] | null): string {
  if (!Array.isArray(value) || value.length === 0) return "";
  return value
    .map(item => item.trim())
    .filter(Boolean)
    .join("\n");
}

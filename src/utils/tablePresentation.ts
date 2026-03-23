import { downloadBlob, generateFilenameWithTimestamp } from "@/utils/download";

export interface PresentationColumn<T> {
  label: string;
  value(row: T): string | number | boolean | null | undefined;
}

export interface CsvSection<T> {
  title: string;
  rows: T[];
  columns: PresentationColumn<T>[];
}

function escapeHtml(value: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  return value.replace(/[&<>"']/g, char => map[char] ?? char);
}

function normalizeCell(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "是" : "否";
  return String(value);
}

function buildHtmlTable<T>(
  rows: T[],
  columns: PresentationColumn<T>[],
  title: string
) {
  const thead = columns
    .map(column => `<th>${escapeHtml(column.label)}</th>`)
    .join("");
  const tbody = rows
    .map(row => {
      const cells = columns
        .map(column => {
          const value = normalizeCell(column.value(row));
          return `<td>${escapeHtml(value)}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
        padding: 24px;
        color: #1f2937;
      }
      h1 {
        margin: 0 0 16px;
        font-size: 20px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      th,
      td {
        border: 1px solid #d1d5db;
        padding: 8px 10px;
        text-align: left;
        vertical-align: top;
        word-break: break-word;
      }
      th {
        background: #f3f4f6;
      }
      @media print {
        body {
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <table>
      <thead>
        <tr>${thead}</tr>
      </thead>
      <tbody>${tbody}</tbody>
    </table>
  </body>
</html>`;
}

function toCsvLine(values: string[]) {
  return values.map(value => `"${value.replace(/"/g, '""')}"`).join(",");
}

export function exportRowsAsCsv<T>(
  rows: T[],
  columns: PresentationColumn<T>[],
  baseFilename: string
) {
  const header = columns.map(column => column.label);
  const lines = rows.map(row =>
    columns.map(column => normalizeCell(column.value(row)))
  );
  const content = ["\ufeff" + toCsvLine(header), ...lines.map(toCsvLine)].join(
    "\n"
  );
  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8;"
  });
  downloadBlob(blob, generateFilenameWithTimestamp(baseFilename, ".csv"));
}

export function exportSectionedCsv(
  sections: CsvSection<unknown>[],
  baseFilename: string
) {
  const lines: string[] = ["\ufeff"];
  sections.forEach((section, index) => {
    lines.push(section.title);
    lines.push(toCsvLine(section.columns.map(column => column.label)));
    section.rows.forEach(row => {
      lines.push(
        toCsvLine(
          section.columns.map(column => normalizeCell(column.value(row)))
        )
      );
    });
    if (index < sections.length - 1) {
      lines.push("");
    }
  });
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;"
  });
  downloadBlob(blob, generateFilenameWithTimestamp(baseFilename, ".csv"));
}

export function printRows<T>(
  rows: T[],
  columns: PresentationColumn<T>[],
  title: string
) {
  const popup = window.open("", "_blank", "width=1024,height=768");
  if (!popup) {
    throw new Error("打印窗口打开失败，请检查浏览器弹窗设置");
  }

  popup.document.open();
  popup.document.write(buildHtmlTable(rows, columns, title));
  popup.document.close();
  popup.focus();
  popup.onload = () => {
    popup.print();
  };
}

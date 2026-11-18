/** Minimal CSV serialisation: RFC 4180 quoting plus a UTF-8 BOM for Excel. */

export function escapeCsvCell(value: string | number): string {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Array<Array<string | number>>): string {
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
}

export function withBom(csv: string): string {
  return `\uFEFF${csv}`;
}

/**
 * Escapes a cell value for CSV: wraps in double quotes and doubles internal quotes.
 */
function escapeCsvCell(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function stringifyCellValue(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) {
    return value.map((item) => stringifyCellValue(item)).join(", ");
  }
  return String(value);
}

/**
 * Exports table data to a CSV string. Uses column keys for cell values and column labels for the header row.
 * Values are stringified; commas, quotes, and newlines in values are escaped per RFC 4180-style CSV.
 */
export function exportTableToCsv(
  columns: Array<{ key: string; label: string }>,
  rows: Record<string, unknown>[]
): string {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(",");
  const dataRows = rows.map((row) =>
    columns.map((c) => escapeCsvCell(stringifyCellValue(row[c.key]))).join(",")
  );
  return [header, ...dataRows].join("\r\n");
}

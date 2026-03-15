import type { ValueFormat } from "@prism-reporting/core";

export function formatMetricValue(
  value: number | string,
  format?: ValueFormat,
  currencyCode?: string,
  decimalPlaces?: number,
  prefix?: string,
  suffix?: string
): string {
  const start = prefix ?? "";
  const end = suffix ?? "";

  if (format === "plain" || format == null) {
    return `${start}${String(value)}${end}`;
  }

  const numericValue = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numericValue)) {
    return `${start}${String(value)}${end}`;
  }

  const options: Intl.NumberFormatOptions = {};
  if (decimalPlaces != null) {
    options.minimumFractionDigits = decimalPlaces;
    options.maximumFractionDigits = decimalPlaces;
  }

  switch (format) {
    case "currency":
      return `${start}${new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode ?? "USD",
        ...options,
      }).format(numericValue)}${end}`;
    case "percent":
      return `${start}${new Intl.NumberFormat(undefined, {
        style: "percent",
        ...options,
      }).format(numericValue)}${end}`;
    case "number":
      return `${start}${new Intl.NumberFormat(undefined, options).format(numericValue)}${end}`;
    default:
      return `${start}${String(value)}${end}`;
  }
}

export function stringifyDisplayValue(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) {
    return value.map((item) => stringifyDisplayValue(item)).filter(Boolean).join(", ");
  }
  return String(value);
}

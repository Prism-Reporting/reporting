import type {
  CardConditionalFormattingRule,
  ConditionalFormattingCondition,
  ConditionalFormattingScalar,
  ConditionalFormattingTone,
  TableConditionalFormattingRule,
} from "@reporting/core";

export interface ConditionalFormattingMatch {
  tone: ConditionalFormattingTone;
  label?: string;
}

function toComparable(value: unknown):
  | { kind: "number" | "date" | "string"; value: number | string }
  | null {
  if (value == null) return null;

  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isNaN(timestamp) ? null : { kind: "date", value: timestamp };
  }

  if (typeof value === "number") {
    return Number.isNaN(value) ? null : { kind: "number", value };
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;

    const timestamp = Date.parse(trimmed);
    if (!Number.isNaN(timestamp)) {
      return { kind: "date", value: timestamp };
    }

    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return { kind: "number", value: numeric };
    }

    return { kind: "string", value: trimmed };
  }

  if (typeof value === "boolean") {
    return { kind: "number", value: value ? 1 : 0 };
  }

  return { kind: "string", value: String(value) };
}

function compareOrderedValues(left: unknown, right: ConditionalFormattingScalar): number | null {
  const leftComparable = toComparable(left);
  const rightComparable = toComparable(right);

  if (leftComparable == null || rightComparable == null) return null;
  if (leftComparable.kind !== rightComparable.kind) return null;

  if (typeof leftComparable.value === "number" && typeof rightComparable.value === "number") {
    return leftComparable.value - rightComparable.value;
  }

  return String(leftComparable.value).localeCompare(String(rightComparable.value), undefined, {
    numeric: true,
  });
}

function matchesEquality(left: unknown, right: ConditionalFormattingScalar): boolean {
  if (left == null) return false;

  if (typeof left === "number" && typeof right === "number") {
    return left === right;
  }

  const leftComparable = toComparable(left);
  const rightComparable = toComparable(right);
  if (leftComparable != null && rightComparable != null && leftComparable.kind === rightComparable.kind) {
    return leftComparable.value === rightComparable.value;
  }

  return String(left) === String(right);
}

function matchesCondition(
  row: Record<string, unknown>,
  condition: ConditionalFormattingCondition
): boolean {
  const left = row[condition.field];

  switch (condition.op) {
    case "gt": {
      const comparison = compareOrderedValues(left, condition.value);
      return comparison != null && comparison > 0;
    }
    case "gte": {
      const comparison = compareOrderedValues(left, condition.value);
      return comparison != null && comparison >= 0;
    }
    case "lt": {
      const comparison = compareOrderedValues(left, condition.value);
      return comparison != null && comparison < 0;
    }
    case "lte": {
      const comparison = compareOrderedValues(left, condition.value);
      return comparison != null && comparison <= 0;
    }
    case "between": {
      const minComparison = compareOrderedValues(left, condition.min);
      const maxComparison = compareOrderedValues(left, condition.max);
      return minComparison != null && maxComparison != null && minComparison >= 0 && maxComparison <= 0;
    }
    case "eq":
      return matchesEquality(left, condition.value);
    case "neq":
      return !matchesEquality(left, condition.value);
    case "in":
      return condition.values.some((value) => matchesEquality(left, value));
    default:
      return false;
  }
}

function toMatch(tone: ConditionalFormattingTone, label?: string): ConditionalFormattingMatch {
  return { tone, ...(label ? { label } : {}) };
}

function getFirstMatch<T extends { when: ConditionalFormattingCondition; tone: ConditionalFormattingTone; label?: string }>(
  rules: T[] | undefined,
  matcher: (rule: T) => boolean
): ConditionalFormattingMatch | undefined {
  const match = rules?.find(matcher);
  return match ? toMatch(match.tone, match.label) : undefined;
}

export function getTableRowConditionalFormatting(
  rules: TableConditionalFormattingRule[] | undefined,
  row: Record<string, unknown>
): ConditionalFormattingMatch | undefined {
  return getFirstMatch(
    rules,
    (rule) => rule.target.type === "row" && matchesCondition(row, rule.when)
  );
}

export function getTableCellConditionalFormatting(
  rules: TableConditionalFormattingRule[] | undefined,
  row: Record<string, unknown>,
  columnKey: string
): ConditionalFormattingMatch | undefined {
  return getFirstMatch(
    rules,
    (rule) =>
      rule.target.type === "cell" &&
      rule.target.columnKey === columnKey &&
      matchesCondition(row, rule.when)
  );
}

export function getCardConditionalFormatting(
  rules: CardConditionalFormattingRule[] | undefined,
  row: Record<string, unknown>
): ConditionalFormattingMatch | undefined {
  return getFirstMatch(
    rules,
    (rule) => rule.target.type === "card" && matchesCondition(row, rule.when)
  );
}

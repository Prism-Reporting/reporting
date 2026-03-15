import type {
  CardConditionalFormattingRule,
  ConditionalFormattingCondition,
  TableConditionalFormattingRule,
  ResolvedQueryExecution,
} from "@reporting/core";

function formatParamValue(value: unknown): string {
  if (value === undefined) return "";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export interface ResolvedQueryInspectorProps {
  queries: ResolvedQueryExecution[];
  compact?: boolean;
  conditionalFormatting?: Array<TableConditionalFormattingRule | CardConditionalFormattingRule>;
}

function formatConditionValue(condition: ConditionalFormattingCondition): string {
  switch (condition.op) {
    case "between":
      return `${condition.min} and ${condition.max}`;
    case "in":
      return condition.values.map((value) => String(value)).join(", ");
    default:
      return String(condition.value);
  }
}

function formatCondition(condition: ConditionalFormattingCondition): string {
  switch (condition.op) {
    case "gt":
      return `${condition.field} > ${condition.value}`;
    case "gte":
      return `${condition.field} >= ${condition.value}`;
    case "lt":
      return `${condition.field} < ${condition.value}`;
    case "lte":
      return `${condition.field} <= ${condition.value}`;
    case "eq":
      return `${condition.field} = ${condition.value}`;
    case "neq":
      return `${condition.field} != ${condition.value}`;
    case "between":
      return `${condition.field} between ${formatConditionValue(condition)}`;
    case "in":
      return `${condition.field} in (${formatConditionValue(condition)})`;
  }
}

function formatConditionalFormattingRule(
  rule: TableConditionalFormattingRule | CardConditionalFormattingRule
): string {
  const target =
    rule.target.type === "row"
      ? "Highlight row"
      : rule.target.type === "cell"
        ? `Highlight ${rule.target.columnKey} cell`
        : "Highlight card";
  const tone = rule.tone.charAt(0).toUpperCase() + rule.tone.slice(1);
  return `${target} ${tone.toLowerCase()} when ${formatCondition(rule.when)}`;
}

export function ResolvedQueryInspector({
  queries,
  compact = false,
  conditionalFormatting,
}: ResolvedQueryInspectorProps) {
  if (!queries.length && (!conditionalFormatting || conditionalFormatting.length === 0)) return null;

  return (
    <details
      className={`report-query-inspector${compact ? " report-query-inspector-compact" : ""}`}
    >
      <summary className="report-query-inspector-summary">
        {compact ? "Query" : "Query info"}
      </summary>
      <div className="report-query-inspector-body">
        {queries.map((query) => {
          const paramEntries = Object.entries(query.params ?? {}).filter(([, value]) => value !== undefined);
          return (
            <section key={query.dataSource} className="report-query-inspector-section">
              <div className="report-query-inspector-heading">
                <strong>{query.dataSource}</strong>
                <span className="report-query-inspector-query">{query.query}</span>
              </div>
              {paramEntries.length > 0 ? (
                <dl className="report-query-inspector-params">
                  {paramEntries.map(([key, value]) => (
                    <div key={key} className="report-query-inspector-param">
                      <dt>{key}</dt>
                      <dd>{formatParamValue(value)}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="report-query-inspector-empty">No params applied.</p>
              )}
            </section>
          );
        })}
        {conditionalFormatting && conditionalFormatting.length > 0 ? (
          <section className="report-query-inspector-section">
            <div className="report-query-inspector-heading">
              <strong>Formatting rules</strong>
              <span className="report-query-inspector-query">
                What the widget will highlight
              </span>
            </div>
            <ul className="report-query-inspector-rules">
              {conditionalFormatting.map((rule, index) => (
                <li key={`${rule.target.type}-${index}`} className="report-query-inspector-rule">
                  <span
                    className="report-query-inspector-rule-tone"
                    data-highlight-tone={rule.tone}
                  >
                    {rule.tone}
                  </span>
                  <span className="report-query-inspector-rule-text">
                    {rule.label?.trim() ? `${rule.label}: ` : ""}
                    {formatConditionalFormattingRule(rule)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </details>
  );
}

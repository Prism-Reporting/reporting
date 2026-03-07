import type { ResolvedQueryExecution } from "@reporting/core";

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
}

export function ResolvedQueryInspector({
  queries,
  compact = false,
}: ResolvedQueryInspectorProps) {
  if (!queries.length) return null;

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
      </div>
    </details>
  );
}

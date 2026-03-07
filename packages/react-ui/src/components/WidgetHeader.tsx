import type { ResolvedQueryExecution } from "@reporting/core";
import { ResolvedQueryInspector } from "./ResolvedQueryInspector.js";

export interface WidgetHeaderProps {
  title?: string;
  queryInfo?: ResolvedQueryExecution;
}

export function WidgetHeader({ title, queryInfo }: WidgetHeaderProps) {
  if (!title && !queryInfo) return null;

  return (
    <div className="report-widget-header">
      {title ? <h3 className="report-widget-title">{title}</h3> : <div />}
      {queryInfo ? <ResolvedQueryInspector queries={[queryInfo]} compact /> : null}
    </div>
  );
}

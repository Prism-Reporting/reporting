import type { KpiProps } from "@reporting/core";
import { WidgetHeader } from "./WidgetHeader.js";

export function KpiView({ title, data, queryInfo }: KpiProps) {
  const { value, label } = data;

  return (
    <div className="report-widget report-kpi" data-testid="kpi-widget">
      <WidgetHeader title={title} queryInfo={queryInfo} />
      <div className="report-kpi-value">{String(value)}</div>
      {label && <div className="report-kpi-label">{label}</div>}
    </div>
  );
}

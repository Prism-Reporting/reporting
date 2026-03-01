import type { KpiProps } from "@reporting/core";

export function KpiView({ title, data }: KpiProps) {
  const { value, label } = data;

  return (
    <div className="report-widget report-kpi" data-testid="kpi-widget">
      {title && <h3 className="report-widget-title">{title}</h3>}
      <div className="report-kpi-value">{String(value)}</div>
      {label && <div className="report-kpi-label">{label}</div>}
    </div>
  );
}

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { KpiProps } from "@prism-reporting/core";
import { WidgetHeader } from "./WidgetHeader.js";
import { formatMetricValue } from "./formatDisplayValue.js";

export function KpiView({
  title,
  data,
  queryInfo,
  collapsed = false,
  onToggleCollapse,
}: KpiProps) {
  const { value, label, format, currencyCode, decimalPlaces, prefix, suffix, trendData } = data;
  const displayed = formatMetricValue(
    value,
    format,
    currencyCode,
    decimalPlaces,
    prefix,
    suffix
  );
  const trendChartData =
    trendData && trendData.length > 0
      ? trendData.map((v, i) => ({ index: i, value: v }))
      : null;

  return (
    <div
      className={`report-widget report-kpi${collapsed ? " report-widget-collapsed" : ""}`}
      data-testid="kpi-widget"
    >
      <WidgetHeader
        title={title}
        queryInfo={queryInfo}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
      />
      {!collapsed && (
        <div className="report-kpi-content">
          <div className="report-kpi-main">
            <div className="report-kpi-value">{displayed}</div>
            {label && <div className="report-kpi-label">{label}</div>}
          </div>
          {trendChartData && trendChartData.length > 0 && (
            <div className="report-kpi-sparkline" aria-hidden="true">
              <ResponsiveContainer width="100%" height={32}>
                <AreaChart data={trendChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="kpi-sparkline-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="index" hide />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip content={() => null} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    fill="url(#kpi-sparkline-fill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

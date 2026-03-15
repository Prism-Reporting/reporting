import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { LineChartProps } from "@prism-reporting/core";
import { WidgetHeader } from "./WidgetHeader.js";
import { ChartLegend } from "./ChartLegend.js";

const LINE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export function LineChartWidgetView({
  title,
  data,
  queryInfo,
  collapsed = false,
  onToggleCollapse,
}: LineChartProps) {
  const { data: chartData, categoryKey, valueKey, series } = data;
  const hasMultipleSeries = series && series.length > 0;
  const legendItems = hasMultipleSeries
    ? series!.map((entry, index) => ({
        color: LINE_COLORS[index % LINE_COLORS.length],
        label: entry.label ?? entry.key,
      }))
    : [];

  return (
    <div
      className={`report-widget report-line-chart${collapsed ? " report-widget-collapsed" : ""}`}
      data-testid="line-chart-widget"
    >
      <WidgetHeader
        title={title}
        queryInfo={queryInfo}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
      />
      {!collapsed && (
        <div className="report-chart-body">
          <div className="report-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey={categoryKey}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  minTickGap={16}
                  tickMargin={8}
                />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} tickMargin={8} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                />
                {hasMultipleSeries ? (
                  <>
                    {series!.map((s, index) => (
                      <Line
                        key={s.key}
                        type="monotone"
                        dataKey={s.key}
                        name={s.label}
                        stroke={LINE_COLORS[index % LINE_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    ))}
                  </>
                ) : (
                  <Line
                    type="monotone"
                    dataKey={valueKey}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                )}
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend items={legendItems} />
        </div>
      )}
    </div>
  );
}

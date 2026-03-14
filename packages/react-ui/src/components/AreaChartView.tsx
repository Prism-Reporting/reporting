import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AreaChartProps } from "@reporting/core";
import { WidgetHeader } from "./WidgetHeader.js";
import { ChartLegend } from "./ChartLegend.js";

const AREA_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export function AreaChartView({
  title,
  data,
  queryInfo,
  collapsed = false,
  onToggleCollapse,
}: AreaChartProps) {
  const { data: chartData, categoryKey, valueKey, series } = data;
  const hasMultipleSeries = series && series.length > 0;
  const legendItems = hasMultipleSeries
    ? series!.map((entry, index) => ({
        color: AREA_COLORS[index % AREA_COLORS.length],
        label: entry.label ?? entry.key,
      }))
    : [];

  return (
    <div
      className={`report-widget report-area-chart${collapsed ? " report-widget-collapsed" : ""}`}
      data-testid="area-chart-widget"
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
              <RechartsAreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey={categoryKey}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  minTickGap={16}
                  tickMargin={8}
                />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} tickMargin={8} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
                {hasMultipleSeries ? (
                  <>
                    {series!.map((entry, index) => (
                      <Area
                        key={entry.key}
                        type="monotone"
                        dataKey={entry.key}
                        name={entry.label}
                        stroke={AREA_COLORS[index % AREA_COLORS.length]}
                        fill={AREA_COLORS[index % AREA_COLORS.length]}
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    ))}
                  </>
                ) : (
                  <Area
                    type="monotone"
                    dataKey={valueKey}
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                )}
              </RechartsAreaChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend items={legendItems} />
        </div>
      )}
    </div>
  );
}

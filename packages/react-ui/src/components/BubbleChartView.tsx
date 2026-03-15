import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { BubbleChartProps } from "@prism-reporting/core";
import { WidgetHeader } from "./WidgetHeader.js";
import { ChartLegend } from "./ChartLegend.js";

const SERIES_COLORS = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#db2777",
];

interface BubbleSeriesGroup {
  series: string;
  color: string;
  rows: Record<string, unknown>[];
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatLegendValue(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (Math.abs(value) >= 1000) return value.toLocaleString();
  if (Math.abs(value % 1) < 0.001) return value.toFixed(0);
  return value.toFixed(1);
}

export function BubbleChartView({
  title,
  data,
  queryInfo,
  collapsed = false,
  onToggleCollapse,
}: BubbleChartProps) {
  const { data: chartData, xKey, yKey, zKey, labelKey, seriesKey } = data;
  const rows = chartData as Record<string, unknown>[];
  const seriesEntries = seriesKey
    ? Array.from(
        new Set(
          rows
            .map((row) => row[seriesKey])
            .filter((value) => value != null && value !== "")
            .map((value) => String(value))
        )
      )
    : [];

  const groupedData: BubbleSeriesGroup[] =
    seriesEntries.length > 0
      ? seriesEntries.map((series, index) => ({
          series,
          color: SERIES_COLORS[index % SERIES_COLORS.length],
          rows: rows.filter((row) => String(row[seriesKey!]) === series),
        }))
      : [
          {
            series: "All items",
            color: "#2563eb",
            rows,
          },
        ];

  const zValues = rows
    .map((row) => toNumber(row[zKey]))
    .filter((value): value is number => value != null)
    .sort((left, right) => left - right);
  const minZ = zValues[0] ?? 0;
  const maxZ = zValues[zValues.length - 1] ?? minZ;
  const midZ = zValues.length > 0 ? zValues[Math.floor((zValues.length - 1) / 2)] ?? minZ : minZ;
  const sizeLegendValues = Array.from(new Set([minZ, midZ, maxZ]));

  return (
    <div
      className={`report-widget report-bubble-chart${collapsed ? " report-widget-collapsed" : ""}`}
      data-testid="bubble-chart-widget"
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
              <RechartsScatterChart margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey={xKey} name={xKey} tick={{ fontSize: 12 }} tickLine={false} />
                <YAxis dataKey={yKey} name={yKey} tick={{ fontSize: 12 }} tickLine={false} />
                <ZAxis dataKey={zKey} name={zKey} range={[90, 720]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value: unknown, _name: unknown, item) => {
                    const key = String(item?.name ?? "");
                    return [String(value ?? ""), key];
                  }}
                  labelFormatter={(_label: unknown, payload: Array<{ payload?: Record<string, unknown> }> = []) => {
                    const row = payload[0]?.payload;
                    if (!row) return "";
                    if (labelKey && row[labelKey] != null && row[labelKey] !== "") {
                      return String(row[labelKey]);
                    }
                    return String(row.id ?? row.name ?? row[xKey] ?? "Bubble");
                  }}
                />
                {groupedData.map((group) => (
                  <Scatter
                    key={group.series}
                    name={group.series}
                    data={group.rows}
                    fill={group.color}
                  />
                ))}
              </RechartsScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="report-bubble-chart-legends">
            {seriesEntries.length > 0 ? (
              <ChartLegend
                items={groupedData.map((group) => ({
                  color: group.color,
                  label: group.series,
                }))}
              />
            ) : null}
            <div className="report-bubble-size-legend" aria-label="Bubble size legend">
              <span className="report-bubble-size-legend-title">Bubble size</span>
              <div className="report-bubble-size-legend-items">
                {sizeLegendValues.map((value, index) => {
                  const diameter = 14 + (index / Math.max(sizeLegendValues.length - 1, 1)) * 16;
                  return (
                    <div key={`${value}-${index}`} className="report-bubble-size-legend-item">
                      <span
                        className="report-bubble-size-legend-circle"
                        style={{ width: `${diameter}px`, height: `${diameter}px` }}
                        aria-hidden="true"
                      />
                      <span className="report-bubble-size-legend-label">{formatLegendValue(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

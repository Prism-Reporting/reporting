import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { StackedBarChartProps } from "@reporting/core";
import { WidgetHeader } from "./WidgetHeader.js";

const STACK_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export function StackedBarChartView({
  title,
  data,
  queryInfo,
}: StackedBarChartProps) {
  const { data: chartData, categoryKey, series } = data;

  return (
    <div
      className="report-widget report-stacked-bar-chart"
      data-testid="stacked-bar-chart-widget"
    >
      <WidgetHeader title={title} queryInfo={queryInfo} />
      <div className="report-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={categoryKey}
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <Legend />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="stack"
                fill={STACK_COLORS[i % STACK_COLORS.length]}
                radius={i === series.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

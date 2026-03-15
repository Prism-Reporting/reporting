import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DoughnutChartProps, PieChartProps } from "@prism-reporting/core";
import { WidgetHeader } from "./WidgetHeader.js";
import { ChartLegend } from "./ChartLegend.js";

const SLICE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

function PieLikeChart({
  title,
  data,
  queryInfo,
  collapsed = false,
  onToggleCollapse,
  doughnut = false,
  testId,
}: (PieChartProps | DoughnutChartProps) & { doughnut?: boolean; testId: string }) {
  const { data: chartData, categoryKey, valueKey } = data;
  const legendItems = chartData.map((entry, index) => ({
    color: SLICE_COLORS[index % SLICE_COLORS.length],
    label: String(entry[categoryKey] ?? ""),
  }));

  return (
    <div
      className={`report-widget ${doughnut ? "report-doughnut-chart" : "report-pie-chart"}${collapsed ? " report-widget-collapsed" : ""}`}
      data-testid={testId}
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
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  dataKey={valueKey}
                  nameKey={categoryKey}
                  cx="50%"
                  cy="50%"
                  outerRadius="76%"
                  innerRadius={doughnut ? "52%" : 0}
                  paddingAngle={2}
                >
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend items={legendItems} />
        </div>
      )}
    </div>
  );
}

export function PieChartView(props: PieChartProps) {
  return <PieLikeChart {...props} testId="pie-chart-widget" />;
}

export function DoughnutChartView(props: DoughnutChartProps) {
  return <PieLikeChart {...props} doughnut testId="doughnut-chart-widget" />;
}

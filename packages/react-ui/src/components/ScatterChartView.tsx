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
import type { ScatterChartProps } from "@reporting/core";
import { WidgetHeader } from "./WidgetHeader.js";

export function ScatterChartView({
  title,
  data,
  queryInfo,
  collapsed = false,
  onToggleCollapse,
}: ScatterChartProps) {
  const { data: chartData, xKey, yKey, zKey } = data;

  return (
    <div
      className={`report-widget report-scatter-chart${collapsed ? " report-widget-collapsed" : ""}`}
      data-testid="scatter-chart-widget"
    >
      <WidgetHeader
        title={title}
        queryInfo={queryInfo}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
      />
      {!collapsed && (
        <div className="report-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsScatterChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={xKey} name={xKey} tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis dataKey={yKey} name={yKey} tick={{ fontSize: 12 }} tickLine={false} />
              {zKey ? <ZAxis dataKey={zKey} name={zKey} range={[60, 400]} /> : null}
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={chartData} fill="#3b82f6" />
            </RechartsScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

import {
  FunnelChart as RechartsFunnelChart,
  Funnel,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import type { FunnelChartProps } from "@prism-reporting/core";
import { WidgetHeader } from "./WidgetHeader.js";

export function FunnelChartView({
  title,
  data,
  queryInfo,
  collapsed = false,
  onToggleCollapse,
}: FunnelChartProps) {
  const { data: chartData, categoryKey, valueKey } = data;

  return (
    <div
      className={`report-widget report-funnel-chart${collapsed ? " report-widget-collapsed" : ""}`}
      data-testid="funnel-chart-widget"
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
            <RechartsFunnelChart>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Funnel data={chartData} dataKey={valueKey} nameKey={categoryKey} isAnimationActive={false} fill="#3b82f6">
                <LabelList position="right" fill="#374151" stroke="none" dataKey={categoryKey} />
              </Funnel>
            </RechartsFunnelChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

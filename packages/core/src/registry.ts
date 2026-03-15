import type { ComponentType } from "react";
import type { FilterSpec } from "./types";
import type {
  ResolvedCardViewData,
  ResolvedTableData,
  ResolvedBarChartData,
  ResolvedStackedBarChartData,
  ResolvedLineChartData,
  ResolvedPieChartData,
  ResolvedSpiralChartData,
  ResolvedScatterChartData,
  ResolvedBubbleChartData,
  ResolvedTimelineChartData,
  ResolvedKpiData,
  ResolvedQueryExecution,
} from "./engine";

export interface WidgetFrameProps {
  title?: string;
  queryInfo?: ResolvedQueryExecution;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export interface TableWidgetProps extends WidgetFrameProps {
  data: ResolvedTableData;
}

export interface CardViewProps extends WidgetFrameProps {
  data: ResolvedCardViewData;
}

export interface BarChartProps extends WidgetFrameProps {
  data: ResolvedBarChartData;
}

export interface StackedBarChartProps extends WidgetFrameProps {
  data: ResolvedStackedBarChartData;
}

export interface LineChartProps extends WidgetFrameProps {
  data: ResolvedLineChartData;
}

export interface AreaChartProps extends WidgetFrameProps {
  data: ResolvedLineChartData;
}

export interface PieChartProps extends WidgetFrameProps {
  data: ResolvedPieChartData;
}

export interface SpiralChartProps extends WidgetFrameProps {
  data: ResolvedSpiralChartData;
}

export interface DoughnutChartProps extends WidgetFrameProps {
  data: ResolvedPieChartData;
}

export interface KpiProps extends WidgetFrameProps {
  data: ResolvedKpiData;
}

export interface FunnelChartProps extends WidgetFrameProps {
  data: ResolvedPieChartData;
}

export interface ScatterChartProps extends WidgetFrameProps {
  data: ResolvedScatterChartData;
}

export interface BubbleChartProps extends WidgetFrameProps {
  data: ResolvedBubbleChartData;
}

export interface TimelineChartProps extends WidgetFrameProps {
  data: ResolvedTimelineChartData;
}

export interface FilterBarProps {
  filters: FilterSpec[];
  filterState: Record<string, unknown>;
  onFilterChange: (filterId: string, value: unknown) => void;
}

/**
 * Component registry for mapping report primitives to UI implementations.
 * Allows swapping implementations (e.g. Ant Design, MUI, Spectrum) without changing specs.
 */
export interface ComponentRegistry {
  table: ComponentType<TableWidgetProps>;
  cardView: ComponentType<CardViewProps>;
  barChart: ComponentType<BarChartProps>;
  stackedBarChart: ComponentType<StackedBarChartProps>;
  lineChart: ComponentType<LineChartProps>;
  areaChart: ComponentType<AreaChartProps>;
  spiralChart: ComponentType<SpiralChartProps>;
  pieChart: ComponentType<PieChartProps>;
  doughnutChart: ComponentType<DoughnutChartProps>;
  funnelChart: ComponentType<FunnelChartProps>;
  scatterChart: ComponentType<ScatterChartProps>;
  bubbleChart: ComponentType<BubbleChartProps>;
  timelineView: ComponentType<TimelineChartProps>;
  ganttChart: ComponentType<TimelineChartProps>;
  kpi: ComponentType<KpiProps>;
  filterBar: ComponentType<FilterBarProps>;
}

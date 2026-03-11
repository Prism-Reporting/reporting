import type { ComponentType } from "react";
import type { FilterSpec } from "./types";
import type {
  ResolvedTableData,
  ResolvedBarChartData,
  ResolvedStackedBarChartData,
  ResolvedLineChartData,
  ResolvedPieChartData,
  ResolvedScatterChartData,
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
  barChart: ComponentType<BarChartProps>;
  stackedBarChart: ComponentType<StackedBarChartProps>;
  lineChart: ComponentType<LineChartProps>;
  areaChart: ComponentType<AreaChartProps>;
  pieChart: ComponentType<PieChartProps>;
  doughnutChart: ComponentType<DoughnutChartProps>;
  funnelChart: ComponentType<FunnelChartProps>;
  scatterChart: ComponentType<ScatterChartProps>;
  kpi: ComponentType<KpiProps>;
  filterBar: ComponentType<FilterBarProps>;
}

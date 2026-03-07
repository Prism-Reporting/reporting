import type { ComponentType } from "react";
import type { FilterSpec } from "./types";
import type {
  ResolvedTableData,
  ResolvedBarChartData,
  ResolvedKpiData,
  ResolvedQueryExecution,
} from "./engine";

export interface WidgetFrameProps {
  title?: string;
  queryInfo?: ResolvedQueryExecution;
}

export interface TableWidgetProps {
  title?: string;
  data: ResolvedTableData;
  queryInfo?: ResolvedQueryExecution;
}

export interface BarChartProps {
  title?: string;
  data: ResolvedBarChartData;
  queryInfo?: ResolvedQueryExecution;
}

export interface KpiProps {
  title?: string;
  data: ResolvedKpiData;
  queryInfo?: ResolvedQueryExecution;
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
  kpi: ComponentType<KpiProps>;
  filterBar: ComponentType<FilterBarProps>;
}

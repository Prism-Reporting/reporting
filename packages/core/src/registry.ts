import type { ComponentType } from "react";
import type { FilterSpec } from "./types";
import type {
  ResolvedTableData,
  ResolvedBarChartData,
  ResolvedKpiData,
} from "./engine";

export interface TableWidgetProps {
  title?: string;
  data: ResolvedTableData;
}

export interface BarChartProps {
  title?: string;
  data: ResolvedBarChartData;
}

export interface KpiProps {
  title?: string;
  data: ResolvedKpiData;
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

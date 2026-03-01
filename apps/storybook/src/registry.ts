import type { ComponentRegistry } from "@reporting/core";
import { TableWidgetView } from "./components/TableWidgetView";
import { BarChartView } from "./components/BarChartView";
import { KpiView } from "./components/KpiView";
import { FilterBar } from "./components/FilterBar";

export const defaultRegistry: ComponentRegistry = {
  table: TableWidgetView,
  barChart: BarChartView,
  kpi: KpiView,
  filterBar: FilterBar,
};

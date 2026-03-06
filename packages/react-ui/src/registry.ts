import type { ComponentRegistry } from "@reporting/core";
import { TableWidgetView } from "./components/TableWidgetView.js";
import { BarChartView } from "./components/BarChartView.js";
import { KpiView } from "./components/KpiView.js";
import { FilterBar } from "./components/FilterBar.js";

export const defaultRegistry: ComponentRegistry = {
  table: TableWidgetView,
  barChart: BarChartView,
  kpi: KpiView,
  filterBar: FilterBar,
};

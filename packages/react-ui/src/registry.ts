import type { ComponentRegistry } from "@reporting/core";
import { TableWidgetView } from "./components/TableWidgetView.js";
import { CardView } from "./components/CardView.js";
import { BarChartView } from "./components/BarChartView.js";
import { StackedBarChartView } from "./components/StackedBarChartView.js";
import { LineChartWidgetView } from "./components/LineChartWidgetView.js";
import { AreaChartView } from "./components/AreaChartView.js";
import { PieChartView, DoughnutChartView } from "./components/PieChartView.js";
import { FunnelChartView } from "./components/FunnelChartView.js";
import { ScatterChartView } from "./components/ScatterChartView.js";
import { KpiView } from "./components/KpiView.js";
import { FilterBar } from "./components/FilterBar.js";

export const defaultRegistry: ComponentRegistry = {
  table: TableWidgetView,
  cardView: CardView,
  barChart: BarChartView,
  stackedBarChart: StackedBarChartView,
  lineChart: LineChartWidgetView,
  areaChart: AreaChartView,
  pieChart: PieChartView,
  doughnutChart: DoughnutChartView,
  funnelChart: FunnelChartView,
  scatterChart: ScatterChartView,
  kpi: KpiView,
  filterBar: FilterBar,
};

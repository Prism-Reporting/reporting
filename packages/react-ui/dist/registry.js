import { TableWidgetView } from "./components/TableWidgetView.js";
import { BarChartView } from "./components/BarChartView.js";
import { StackedBarChartView } from "./components/StackedBarChartView.js";
import { LineChartWidgetView } from "./components/LineChartWidgetView.js";
import { KpiView } from "./components/KpiView.js";
import { FilterBar } from "./components/FilterBar.js";
export const defaultRegistry = {
    table: TableWidgetView,
    barChart: BarChartView,
    stackedBarChart: StackedBarChartView,
    lineChart: LineChartWidgetView,
    kpi: KpiView,
    filterBar: FilterBar,
};

import { TableWidgetView } from "./components/TableWidgetView.js";
import { BarChartView } from "./components/BarChartView.js";
import { KpiView } from "./components/KpiView.js";
import { FilterBar } from "./components/FilterBar.js";
export const defaultRegistry = {
    table: TableWidgetView,
    barChart: BarChartView,
    kpi: KpiView,
    filterBar: FilterBar,
};

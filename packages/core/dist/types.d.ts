export type LayoutSpec = "singleColumn" | "twoColumn";
export interface DataSourceSpec {
    name: string;
    query: string;
    params?: Record<string, unknown>;
}
export interface SelectFilterSpec {
    type: "select";
    id: string;
    label: string;
    dataSource: string;
    options: Array<{
        value: string;
        label: string;
    }>;
    paramKey?: string;
}
export interface DateRangeFilterSpec {
    type: "dateRange";
    id: string;
    label: string;
    dataSource: string;
    paramKeyFrom?: string;
    paramKeyTo?: string;
}
export interface SearchFilterSpec {
    type: "search";
    id: string;
    label: string;
    dataSource: string;
    paramKey?: string;
    placeholder?: string;
}
export type FilterSpec = SelectFilterSpec | DateRangeFilterSpec | SearchFilterSpec;
export interface TableWidgetConfig {
    columns: Array<{
        key: string;
        label: string;
        type?: "string" | "number" | "date";
    }>;
    /** When set, rows are grouped by this key; resolved data will include a `groups` array. */
    groupByKey?: string;
    /** Optional key to use for group header label; defaults to the group key value. */
    groupLabelKey?: string;
}
export interface BarChartWidgetConfig {
    categoryKey: string;
    valueKey: string;
    series?: Array<{
        key: string;
        label: string;
    }>;
}
export interface KpiWidgetConfig {
    valueKey: string;
    label?: string;
    format?: "number" | "percent" | "currency";
}
export interface TableWidgetSpec {
    type: "table";
    id: string;
    title?: string;
    dataSource: string;
    config: TableWidgetConfig;
}
export interface BarChartWidgetSpec {
    type: "barChart";
    id: string;
    title?: string;
    dataSource: string;
    config: BarChartWidgetConfig;
}
export interface KpiWidgetSpec {
    type: "kpi";
    id: string;
    title?: string;
    dataSource: string;
    config: KpiWidgetConfig;
}
export type WidgetSpec = TableWidgetSpec | BarChartWidgetSpec | KpiWidgetSpec;
export interface ReportSpec {
    id: string;
    title: string;
    layout: LayoutSpec;
    dataSources: Record<string, DataSourceSpec>;
    filters: FilterSpec[];
    widgets: WidgetSpec[];
}
//# sourceMappingURL=types.d.ts.map
// --- Layout ---
export type LayoutSpec = "singleColumn" | "twoColumn";

/** Optional CSS gap values for the report grid. Applied by the UI. */
export interface LayoutOptions {
  columnGap?: string;
  rowGap?: string;
}

/** Optional section: groups widgets under a title. Order within section = order in widgetIds. */
export interface ReportSectionSpec {
  id: string;
  title?: string;
  widgetIds: string[];
  /** Optional logical groups inherited by all widgets in this section. Section id also acts as a group id. */
  groupIds?: string[];
}

/** Optional tab: report is tabbed; each tab shows only its widgets. Tabs take precedence over sections. */
export interface ReportTabSpec {
  id: string;
  label: string;
  widgetIds: string[];
  /** Optional logical groups inherited by all widgets in this tab. Tab id also acts as a group id. */
  groupIds?: string[];
}

/** Logical group for sharing filters across widgets without forcing a specific layout container. */
export interface ReportGroupSpec {
  id: string;
  label?: string;
  widgetIds: string[];
}

// --- Data shaping (dataSource level) ---
export type SortDirection = "asc" | "desc";

export interface SortItem {
  key: string;
  direction: SortDirection;
}

export interface DataSourcePaginationSpec {
  pageSize: number;
  /** Optional query param name for page; for future server-side paging. Not used in v1. */
  pageParamKey?: string;
}

export type DataSourceDeliveryMode = "paginatedList" | "fullVisual" | "summary";

export interface DataSourceDeliverySpec {
  mode: DataSourceDeliveryMode;
  /** Only for paginated lists; used by hosts/renderers as the requested page size. */
  pageSize?: number;
  /** Only for fullVisual; backend may return limitExceeded when total rows are above this cap. */
  maxRows?: number;
}

export type FilterDataSourceRef = string | string[];

// --- Data Sources ---
export interface DataSourceSpec {
  name: string;
  query: string;
  params?: Record<string, unknown>;
  /** Explicit delivery contract for the integration layer. */
  delivery?: DataSourceDeliverySpec;
  /** Optional sort; applied in-memory after fetch. */
  sort?: SortItem | SortItem[];
  /** Optional row limit; applied in-memory after sort. */
  limit?: number;
  /** Legacy pagination config. Prefer delivery.mode = "paginatedList". */
  pagination?: DataSourcePaginationSpec;
}

// --- Filters ---
export interface SelectFilterSpec {
  type: "select";
  id: string;
  label: string;
  dataSource: FilterDataSourceRef;
  /** Optional scoped group ids. Omit to keep the filter global. */
  groupIds?: string[];
  options: Array<{ value: string; label: string }>;
  paramKey?: string;
  required?: boolean;
  defaultValue?: string;
}

export interface MultiSelectFilterSpec {
  type: "multiSelect";
  id: string;
  label: string;
  dataSource: FilterDataSourceRef;
  /** Optional scoped group ids. Omit to keep the filter global. */
  groupIds?: string[];
  options: Array<{ value: string; label: string }>;
  paramKey?: string;
  required?: boolean;
  defaultValue?: string[];
}

export interface DateRangeFilterSpec {
  type: "dateRange";
  id: string;
  label: string;
  dataSource: FilterDataSourceRef;
  /** Optional scoped group ids. Omit to keep the filter global. */
  groupIds?: string[];
  paramKeyFrom?: string;
  paramKeyTo?: string;
  required?: boolean;
  defaultValue?: { from?: string; to?: string };
}

export interface SearchFilterSpec {
  type: "search";
  id: string;
  label: string;
  dataSource: FilterDataSourceRef;
  /** Optional scoped group ids. Omit to keep the filter global. */
  groupIds?: string[];
  paramKey?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}

export interface NumericRangeFilterSpec {
  type: "numericRange";
  id: string;
  label: string;
  dataSource: FilterDataSourceRef;
  /** Optional scoped group ids. Omit to keep the filter global. */
  groupIds?: string[];
  min?: number;
  max?: number;
  step?: number;
  paramKeyFrom?: string;
  paramKeyTo?: string;
  required?: boolean;
  defaultValue?: { from?: number; to?: number };
}

export type FilterSpec =
  | SelectFilterSpec
  | MultiSelectFilterSpec
  | DateRangeFilterSpec
  | SearchFilterSpec
  | NumericRangeFilterSpec;

// --- Aggregations (widget level) ---
export type AggregationOp = "sum" | "avg" | "min" | "max" | "count";

export interface AggregationSpec {
  key: string;
  op: AggregationOp;
}

export type TableSummaryOp = AggregationOp | "latest" | "earliest" | "distinct";

export interface TableSummarySpec {
  key: string;
  op: TableSummaryOp;
}

export type ConditionalFormattingTone =
  | "danger"
  | "warning"
  | "success"
  | "info"
  | "neutral";

export type ConditionalFormattingScalar = string | number;

export type ConditionalFormattingOp =
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "eq"
  | "neq"
  | "in";

export type ConditionalFormattingCondition =
  | {
      field: string;
      op: "gt" | "gte" | "lt" | "lte" | "eq" | "neq";
      value: ConditionalFormattingScalar;
    }
  | {
      field: string;
      op: "between";
      min: ConditionalFormattingScalar;
      max: ConditionalFormattingScalar;
    }
  | {
      field: string;
      op: "in";
      values: ConditionalFormattingScalar[];
    };

export type TableConditionalFormattingRule =
  | {
      target: { type: "row" };
      when: ConditionalFormattingCondition;
      tone: ConditionalFormattingTone;
      label?: string;
    }
  | {
      target: { type: "cell"; columnKey: string };
      when: ConditionalFormattingCondition;
      tone: ConditionalFormattingTone;
      label?: string;
    };

export interface CardConditionalFormattingRule {
  target: { type: "card" };
  when: ConditionalFormattingCondition;
  tone: ConditionalFormattingTone;
  label?: string;
}

export interface WidgetSizeConstraints {
  minWidth: string;
  minHeight: string;
}

export const WIDGET_SIZE_CONSTRAINTS = {
  table: { minWidth: "320px", minHeight: "180px" },
  cardView: { minWidth: "320px", minHeight: "220px" },
  barChart: { minWidth: "320px", minHeight: "260px" },
  lineChart: { minWidth: "320px", minHeight: "260px" },
  areaChart: { minWidth: "320px", minHeight: "260px" },
  spiralChart: { minWidth: "320px", minHeight: "260px" },
  bubbleChart: { minWidth: "320px", minHeight: "260px" },
  pieChart: { minWidth: "320px", minHeight: "260px" },
  doughnutChart: { minWidth: "320px", minHeight: "260px" },
  stackedBarChart: { minWidth: "320px", minHeight: "260px" },
  funnelChart: { minWidth: "320px", minHeight: "260px" },
  scatterChart: { minWidth: "320px", minHeight: "260px" },
  timelineView: { minWidth: "320px", minHeight: "260px" },
  ganttChart: { minWidth: "320px", minHeight: "260px" },
  kpi: { minWidth: "180px", minHeight: "80px" },
} as const satisfies Record<string, WidgetSizeConstraints>;

// --- Widgets ---
export interface TableWidgetConfig {
  /**
   * Optional when `summary` is provided; otherwise required.
   * When omitted, the engine derives columns from groupByKey / groupLabelKey and summary keys.
   */
  columns?: Array<{
    key: string;
    label: string;
    type?: "string" | "number" | "date";
  }>;
  /** When set, rows are grouped by this key; resolved data will include a `groups` array. */
  groupByKey?: string;
  /** Optional key to use for group header label; defaults to the group key value. */
  groupLabelKey?: string;
  /**
   * Optional summary reducers applied across the full result set or once per group when `groupByKey` is set.
   * Supports grouped raw/object summaries such as latest milestone date or distinct milestone names per project.
   */
  summary?: TableSummarySpec[];
  /** Optional aggregations; footer row shows aggregated values for numeric columns. */
  aggregations?: AggregationSpec[];
  /** Optional grouped subtotals shown under each raw group when `groupByKey` is set. */
  groupAggregations?: AggregationSpec[];
  /** Optional label used for each grouped subtotal row; defaults to "Subtotal". */
  groupSummaryLabel?: string;
  /** Optional label used for the grand total row; defaults to "Grand total". */
  grandTotalLabel?: string;
  /** Optional widget-level sort; applied after dataSource sort when building table data. */
  sort?: SortItem | SortItem[];
  /** Optional drill-down: open URL with row values substituted; paramKeys list which row keys to use for placeholders. */
  drillDown?: {
    urlTemplate: string;
    paramKeys?: string[];
    target?: "_self" | "_blank";
  };
  /** Optional conditional highlighting rules for rows or cells. */
  conditionalFormatting?: TableConditionalFormattingRule[];
}

export interface BarChartWidgetConfig {
  categoryKey: string;
  valueKey: string;
  series?: Array<{ key: string; label: string }>;
}

export interface LineChartWidgetConfig {
  categoryKey: string;
  valueKey: string;
  series?: Array<{ key: string; label: string }>;
}

export interface AreaChartWidgetConfig {
  categoryKey: string;
  valueKey: string;
  series?: Array<{ key: string; label: string }>;
}

export interface PieChartWidgetConfig {
  categoryKey: string;
  valueKey: string;
}

export interface SpiralChartWidgetConfig {
  categoryKey: string;
  valueKey: string;
}

export type ValueFormat = "number" | "currency" | "percent" | "plain";

export interface ValueDisplayConfig {
  format?: ValueFormat;
  currencyCode?: string;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
}

export interface KpiWidgetConfig {
  valueKey: string;
  aggregation?: AggregationSpec;
  label?: string;
  format?: ValueFormat;
  currencyCode?: string;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
  /** Optional trend: sparkline from first N rows using this dataKey; omitted if no rows. */
  trend?: { dataKey: string };
}

export interface CardFieldConfig {
  key: string;
  label?: string;
}

export interface CardMetricConfig extends ValueDisplayConfig {
  key: string;
  label?: string;
}

export interface CardWidgetConfig {
  titleKey: string;
  subtitleKey?: string;
  badges?: CardFieldConfig[];
  metadata?: CardFieldConfig[];
  primaryMetric?: CardMetricConfig;
  template?: "compact" | "detailed";
  emptyStateText?: string;
  /** Optional conditional highlighting rules for cards. */
  conditionalFormatting?: CardConditionalFormattingRule[];
}

export interface TableWidgetSpec {
  type: "table";
  id: string;
  title?: string;
  dataSource: string;
  /** Optional logical groups this widget belongs to. */
  groupIds?: string[];
  config: TableWidgetConfig;
  /** Optional sizing hint (e.g. "100%", "50%", "400px"). UI enforces a 320px minimum width and 180px minimum height. */
  width?: string;
  height?: string;
}

export interface CardViewWidgetSpec {
  type: "cardView";
  id: string;
  title?: string;
  dataSource: string;
  /** Optional logical groups this widget belongs to. */
  groupIds?: string[];
  config: CardWidgetConfig;
  /** Optional sizing hint. UI enforces a 320px minimum width and 220px minimum height. */
  width?: string;
  height?: string;
}

export interface BarChartWidgetSpec {
  type: "barChart";
  id: string;
  title?: string;
  dataSource: string;
  /** Optional logical groups this widget belongs to. */
  groupIds?: string[];
  config: BarChartWidgetConfig;
  /** Optional sizing hint. UI enforces a 320px minimum width and 260px minimum height. */
  width?: string;
  height?: string;
}

export interface LineChartWidgetSpec {
  type: "lineChart";
  id: string;
  title?: string;
  dataSource: string;
  /** Optional logical groups this widget belongs to. */
  groupIds?: string[];
  config: LineChartWidgetConfig;
  /** Optional sizing hint. UI enforces a 320px minimum width and 260px minimum height. */
  width?: string;
  height?: string;
}

export interface AreaChartWidgetSpec {
  type: "areaChart";
  id: string;
  title?: string;
  dataSource: string;
  /** Optional logical groups this widget belongs to. */
  groupIds?: string[];
  config: AreaChartWidgetConfig;
  /** Optional sizing hint. UI enforces a 320px minimum width and 260px minimum height. */
  width?: string;
  height?: string;
}

export interface PieChartWidgetSpec {
  type: "pieChart";
  id: string;
  title?: string;
  dataSource: string;
  /** Optional logical groups this widget belongs to. */
  groupIds?: string[];
  config: PieChartWidgetConfig;
  /** Optional sizing hint. UI enforces a 320px minimum width and 260px minimum height. */
  width?: string;
  height?: string;
}

export interface SpiralChartWidgetSpec {
  type: "spiralChart";
  id: string;
  title?: string;
  dataSource: string;
  /** Optional logical groups this widget belongs to. */
  groupIds?: string[];
  config: SpiralChartWidgetConfig;
  /** Optional sizing hint. UI enforces a 320px minimum width and 260px minimum height. */
  width?: string;
  height?: string;
}

export interface DoughnutChartWidgetSpec {
  type: "doughnutChart";
  id: string;
  title?: string;
  dataSource: string;
  /** Optional logical groups this widget belongs to. */
  groupIds?: string[];
  config: PieChartWidgetConfig;
  /** Optional sizing hint. UI enforces a 320px minimum width and 260px minimum height. */
  width?: string;
  height?: string;
}

/** Stacked bar chart: categoryKey for x-axis, series define stack segments (one Bar per series with stackId). */
export interface StackedBarChartWidgetConfig {
  categoryKey: string;
  series: Array<{ key: string; label?: string }>;
}

export interface StackedBarChartWidgetSpec {
  type: "stackedBarChart";
  id: string;
  title?: string;
  dataSource: string;
  /** Optional logical groups this widget belongs to. */
  groupIds?: string[];
  config: StackedBarChartWidgetConfig;
  /** Optional sizing hint. UI enforces a 320px minimum width and 260px minimum height. */
  width?: string;
  height?: string;
}

export interface FunnelChartWidgetSpec {
  type: "funnelChart";
  id: string;
  title?: string;
  dataSource: string;
  /** Optional logical groups this widget belongs to. */
  groupIds?: string[];
  config: PieChartWidgetConfig;
  /** Optional sizing hint. UI enforces a 320px minimum width and 260px minimum height. */
  width?: string;
  height?: string;
}

export interface ScatterChartWidgetConfig {
  xKey: string;
  yKey: string;
  zKey?: string;
}

export interface BubbleChartWidgetConfig {
  xKey: string;
  yKey: string;
  zKey: string;
  labelKey?: string;
  seriesKey?: string;
}

export interface TimelineWidgetConfig {
  startDateKey: string;
  endDateKey: string;
  labelKey: string;
  groupKey?: string;
  statusKey?: string;
}

export interface ScatterChartWidgetSpec {
  type: "scatterChart";
  id: string;
  title?: string;
  dataSource: string;
  /** Optional logical groups this widget belongs to. */
  groupIds?: string[];
  config: ScatterChartWidgetConfig;
  /** Optional sizing hint. UI enforces a 320px minimum width and 260px minimum height. */
  width?: string;
  height?: string;
}

export interface BubbleChartWidgetSpec {
  type: "bubbleChart";
  id: string;
  title?: string;
  dataSource: string;
  /** Optional logical groups this widget belongs to. */
  groupIds?: string[];
  config: BubbleChartWidgetConfig;
  /** Optional sizing hint. UI enforces a 320px minimum width and 260px minimum height. */
  width?: string;
  height?: string;
}

export interface TimelineViewWidgetSpec {
  type: "timelineView";
  id: string;
  title?: string;
  dataSource: string;
  /** Optional logical groups this widget belongs to. */
  groupIds?: string[];
  config: TimelineWidgetConfig;
  /** Optional sizing hint. UI enforces a 320px minimum width and 260px minimum height. */
  width?: string;
  height?: string;
}

export interface GanttChartWidgetSpec {
  type: "ganttChart";
  id: string;
  title?: string;
  dataSource: string;
  /** Optional logical groups this widget belongs to. */
  groupIds?: string[];
  config: TimelineWidgetConfig;
  /** Optional sizing hint. UI enforces a 320px minimum width and 260px minimum height. */
  width?: string;
  height?: string;
}

export interface KpiWidgetSpec {
  type: "kpi";
  id: string;
  title?: string;
  dataSource: string;
  /** Optional logical groups this widget belongs to. */
  groupIds?: string[];
  config: KpiWidgetConfig;
  /** Optional sizing hint. UI enforces a 180px minimum width and 80px minimum height. */
  width?: string;
  height?: string;
}

export type WidgetSpec =
  | TableWidgetSpec
  | CardViewWidgetSpec
  | BarChartWidgetSpec
  | LineChartWidgetSpec
  | AreaChartWidgetSpec
  | SpiralChartWidgetSpec
  | PieChartWidgetSpec
  | DoughnutChartWidgetSpec
  | StackedBarChartWidgetSpec
  | FunnelChartWidgetSpec
  | ScatterChartWidgetSpec
  | BubbleChartWidgetSpec
  | TimelineViewWidgetSpec
  | GanttChartWidgetSpec
  | KpiWidgetSpec;

export function getWidgetSizeConstraints(type: WidgetSpec["type"]): WidgetSizeConstraints {
  return WIDGET_SIZE_CONSTRAINTS[type];
}

// --- Presets (optional saved filter states) ---
export interface ReportSpecPreset {
  id: string;
  label: string;
  filterState: Record<string, unknown>;
}

// --- Report Spec ---
export interface ReportSpec {
  id: string;
  title: string;
  layout: LayoutSpec;
  dataSources: Record<string, DataSourceSpec>;
  filters: FilterSpec[];
  widgets: WidgetSpec[];
  /** Optional logical groups for sharing scoped filters across widgets. */
  groups?: ReportGroupSpec[];
  /** Optional named presets; host can show a dropdown/buttons to apply preset.filterState. */
  presets?: ReportSpecPreset[];
  /** Optional report version (e.g. "1.0", "2024.03"); for display and versioning. */
  version?: string;
  /** Optional refresh interval in seconds; when set, host should re-call resolveReport after that interval (engine does not implement timers). */
  refreshInterval?: number;
  /** Optional layout styling (CSS gap values). Applied by the UI. */
  layoutOptions?: LayoutOptions;
  /** Optional sections: group widgets under titles. Order in section = order in widgetIds. If absent, all widgets in layout order. */
  sections?: ReportSectionSpec[];
  /** Optional tabs: report is tabbed; each tab shows only its widgets. When present, sections are ignored. */
  tabs?: ReportTabSpec[];
  /** Optional owner (e.g. user id or email); pass-through for governance and UI display. */
  owner?: string;
  /** Optional author (e.g. user id or email); pass-through for UI display (e.g. "By {author}"). */
  author?: string;
}

// --- Governance: audit and policy ---
/** Minimal audit event shape for hosts to log when a report is generated or validated. */
export interface ReportAuditEvent {
  type: "report_validated" | "report_generated";
  timestamp: string;
  specId?: string;
  outcome: "valid" | "invalid" | "success" | "error";
  diagnosticCount?: number;
  errorMessage?: string;
}

/** Result of an optional policy check; hosts can enforce rules (e.g. max widgets, allowed query names). */
export interface PolicyResult {
  allowed: boolean;
  errors?: Array<{ code: string; message: string }>;
}

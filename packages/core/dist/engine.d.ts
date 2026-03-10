import type { ReportSpec, DataSourceDeliveryMode, FilterSpec, WidgetSpec, PolicyResult, ReportAuditEvent } from "./types.js";
import type { DataProvider } from "./data-provider";
export declare const REPORT_SPEC_VERSION: "v1";
export interface ValidationDiagnostic {
    path: string;
    code: string;
    message: string;
    severity: "error";
    suggestion?: string;
}
export interface ValidationContext {
    availableQueries?: string[];
    availableFields?: Record<string, string[]>;
}
export interface ValidationResult {
    version: typeof REPORT_SPEC_VERSION;
    valid: boolean;
    errors: string[];
    diagnostics: ValidationDiagnostic[];
}
export interface ValidateReportSpecOptions {
    /** Optional policy check; when provided and it returns allowed: false, policy errors are added to diagnostics and valid becomes false. */
    policy?: (spec: ReportSpec) => PolicyResult;
}
export interface ResolvedTableData {
    rows: Record<string, unknown>[];
    columns: Array<{
        key: string;
        label: string;
    }>;
    /** When table has groupByKey, rows are grouped; UI renders one section per group. */
    groups?: Array<{
        label: string;
        rows: Record<string, unknown>[];
    }>;
    /** Footer row: key -> aggregated value for columns with aggregations. */
    footer?: Record<string, unknown>;
    /** When set, rows are clickable / link column; URL built from urlTemplate and row values (paramKeys). */
    drillDown?: {
        urlTemplate: string;
        paramKeys?: string[];
        target?: "_self" | "_blank";
    };
}
export interface ResolvedPaginationMetadata {
    totalCount: number;
    pageSize: number;
    page: number;
    /** Total number of pages; use to know if current view is complete (e.g. page === totalPages and no hasMore). */
    totalPages: number;
    hasMore?: boolean;
}
export interface ResolvedLimitExceededMetadata {
    totalCount: number;
    limit: number;
    message?: string;
}
export interface ResolvedBarChartData {
    data: Array<Record<string, unknown>>;
    categoryKey: string;
    valueKey: string;
}
export interface ResolvedStackedBarChartData {
    data: Array<Record<string, unknown>>;
    categoryKey: string;
    series: Array<{
        key: string;
        label: string;
    }>;
}
export interface ResolvedLineChartData {
    data: Array<Record<string, unknown>>;
    categoryKey: string;
    valueKey: string;
    series?: Array<{
        key: string;
        label: string;
    }>;
}
export interface ResolvedKpiData {
    value: number | string;
    label?: string;
    format?: "number" | "currency" | "percent" | "plain";
    currencyCode?: string;
    decimalPlaces?: number;
    /** When trend is requested and data has rows: values for sparkline (first N rows, e.g. 10). */
    trendData?: number[];
}
export type ResolvedWidgetData = {
    type: "table";
    data: ResolvedTableData;
} | {
    type: "barChart";
    data: ResolvedBarChartData;
} | {
    type: "stackedBarChart";
    data: ResolvedStackedBarChartData;
} | {
    type: "lineChart";
    data: ResolvedLineChartData;
} | {
    type: "kpi";
    data: ResolvedKpiData;
};
export interface ResolvedWidget {
    spec: WidgetSpec;
    data: ResolvedWidgetData;
}
export interface ResolvedQueryExecution {
    widgetId?: string;
    dataSource: string;
    query: string;
    params: Record<string, unknown>;
    groupIds?: string[];
    rowCount: number;
    deliveryMode?: DataSourceDeliveryMode;
    /** Set when dataSource has pagination; totalCount is before applying limit. */
    pagination?: ResolvedPaginationMetadata;
    /** Set when a fullVisual query is over its row limit and returned metadata instead of rows. */
    limitExceeded?: ResolvedLimitExceededMetadata;
}
/** Resolved section: title and ordered resolved widgets. Used when spec.sections is present and spec.tabs is absent. */
export interface ResolvedSection {
    id: string;
    title?: string;
    widgets: ResolvedWidget[];
}
/** Resolved tab: label and ordered resolved widgets. Used when spec.tabs is present (sections then ignored). */
export interface ResolvedTab {
    id: string;
    label: string;
    widgets: ResolvedWidget[];
}
/**
 * Result of resolving a ReportSpec. Hosts may cache by (spec.id + filterState) and TTL;
 * when spec.refreshInterval is set, the host should re-call resolveReport after that interval.
 * When spec.tabs is present, use resolved.tabs for rendering; when spec.sections is present (and no tabs), use resolved.sections; otherwise use resolved.widgets in layout order.
 */
export interface ResolvedReport {
    spec: ReportSpec;
    filterState: Record<string, unknown>;
    queries: ResolvedQueryExecution[];
    widgets: ResolvedWidget[];
    /** Report version when spec.version is set; UI may show e.g. "Report v1.0". */
    version?: string;
    /** Set when spec.sections is present and spec.tabs is absent. Widgets not in any section appear in an "Other" section. */
    sections?: ResolvedSection[];
    /** Set when spec.tabs is present. Sections are ignored. Widgets not in any tab appear in an "Other" tab. */
    tabs?: ResolvedTab[];
    /** Pass-through from spec.owner for UI display (e.g. "Owner: {owner}"). */
    owner?: string;
    /** Pass-through from spec.author for UI display (e.g. "By {author}"). */
    author?: string;
}
/**
 * Validates a ReportSpec for required fields and referential integrity.
 * When options.policy is provided, runs the policy check after structural validation; if the policy returns allowed: false, policy errors are added to diagnostics and valid is set to false.
 */
export declare function validateReportSpec(spec: ReportSpec, context?: ValidationContext, options?: ValidateReportSpecOptions): ValidationResult;
/**
 * Returns filter state with spec defaults applied for missing values.
 * Does not mutate the input.
 */
export declare function getEffectiveFilterState(spec: ReportSpec, filterState: Record<string, unknown>): Record<string, unknown>;
/**
 * Returns initial filter state from spec defaults only.
 * Use to seed UI state when no user selection exists yet.
 */
export declare function getDefaultFilterState(spec: ReportSpec): Record<string, unknown>;
/**
 * Validates that all required filters have a value in the given state.
 * @throws Error if any required filter is missing a value
 */
export declare function validateRequiredFilters(spec: ReportSpec, filterState: Record<string, unknown>): void;
export declare function getWidgetGroupIds(spec: ReportSpec, widgetId: string): string[];
export declare function filterAppliesToGroupIds(filter: FilterSpec, groupIds: string[]): boolean;
/**
 * Builds params for a dataSource from filterState and filter specs.
 * Uses filter.defaultValue when filterState has no value for a filter.
 */
export declare function buildParamsForDataSource(dataSourceName: string, spec: ReportSpec, filterState: Record<string, unknown>, groupIds?: string[]): Record<string, unknown>;
export interface ResolveReportOptions {
    /** When provided, the engine calls this with an audit event when report resolution completes (success or error). Hosts can log to their audit system. */
    onAudit?: (event: ReportAuditEvent) => void;
}
/**
 * Resolves a ReportSpec into a view-ready ResolvedReport using the DataProvider.
 */
export declare function resolveReport(spec: ReportSpec, dataProvider: DataProvider, filterState?: Record<string, unknown>, options?: ResolveReportOptions): Promise<ResolvedReport>;
//# sourceMappingURL=engine.d.ts.map
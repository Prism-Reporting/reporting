import type { ReportSpec, WidgetSpec } from "./types";
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
export interface ResolvedTableData {
    rows: Record<string, unknown>[];
    columns: Array<{
        key: string;
        label: string;
    }>;
}
export interface ResolvedBarChartData {
    data: Array<Record<string, unknown>>;
    categoryKey: string;
    valueKey: string;
}
export interface ResolvedKpiData {
    value: number | string;
    label?: string;
}
export type ResolvedWidgetData = {
    type: "table";
    data: ResolvedTableData;
} | {
    type: "barChart";
    data: ResolvedBarChartData;
} | {
    type: "kpi";
    data: ResolvedKpiData;
};
export interface ResolvedWidget {
    spec: WidgetSpec;
    data: ResolvedWidgetData;
}
export interface ResolvedReport {
    spec: ReportSpec;
    filterState: Record<string, unknown>;
    widgets: ResolvedWidget[];
}
/**
 * Validates a ReportSpec for required fields and referential integrity.
 */
export declare function validateReportSpec(spec: ReportSpec, context?: ValidationContext): ValidationResult;
/**
 * Resolves a ReportSpec into a view-ready ResolvedReport using the DataProvider.
 */
export declare function resolveReport(spec: ReportSpec, dataProvider: DataProvider, filterState?: Record<string, unknown>): Promise<ResolvedReport>;
//# sourceMappingURL=engine.d.ts.map
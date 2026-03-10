import type { ReportSpec, DataProvider } from "@reporting/core";
import type { ComponentRegistry } from "@reporting/core";
export interface ReportRendererProps {
    spec: ReportSpec;
    dataProvider: DataProvider;
    registry: ComponentRegistry;
    /** Optional fallback page size for paginatedList data sources that omit delivery.pageSize. */
    pageSize?: number;
}
export declare function ReportRenderer({ spec, dataProvider, registry, pageSize: pageSizeProp, }: ReportRendererProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ReportRenderer.d.ts.map
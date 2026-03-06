import type { ReportSpec, DataProvider } from "@reporting/core";
import type { ComponentRegistry } from "@reporting/core";
export interface ReportRendererProps {
    spec: ReportSpec;
    dataProvider: DataProvider;
    registry: ComponentRegistry;
    /** Optional page size for pagination (default 20). Omit or set to 0 to disable pagination. */
    pageSize?: number;
}
export declare function ReportRenderer({ spec, dataProvider, registry, pageSize: pageSizeProp, }: ReportRendererProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ReportRenderer.d.ts.map
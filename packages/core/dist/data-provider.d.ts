import type { QueryCatalogEntry } from "./context.js";
import type { DataSourceDeliveryMode } from "./types.js";
export interface RunQueryRequest {
    name: string;
    params?: Record<string, unknown>;
    execution?: {
        deliveryMode: DataSourceDeliveryMode;
        page?: number;
        pageSize?: number;
        maxRows?: number;
    };
    context?: {
        widgetId?: string;
        dataSource?: string;
        groupIds?: string[];
    };
}
export interface QueryResultPagination {
    page: number;
    pageSize: number;
    /** Total number of items across all pages. Supply so consumers can know extent. */
    totalCount?: number;
    /** Total number of pages. Supply so consumers can know if data is complete; if omitted, engines derive from totalCount and pageSize. */
    totalPages?: number;
    hasMore?: boolean;
}
export interface QueryResultEnvelope {
    kind?: "rows";
    data: unknown[];
    totalCount?: number;
    pagination?: QueryResultPagination;
}
export interface QueryLimitExceededResult {
    kind: "limitExceeded";
    totalCount: number;
    limit: number;
    message?: string;
}
export type RunQueryResult = unknown[] | QueryResultEnvelope | QueryLimitExceededResult;
export interface DataProvider {
    runQuery(request: RunQueryRequest): Promise<RunQueryResult>;
}
export declare function validateQueryResultAgainstCatalog(queryCatalog: QueryCatalogEntry[], queryName: string, result: RunQueryResult): RunQueryResult;
export declare function createContractEnforcedDataProvider(queryCatalog: QueryCatalogEntry[], dataProvider: DataProvider): DataProvider;
//# sourceMappingURL=data-provider.d.ts.map
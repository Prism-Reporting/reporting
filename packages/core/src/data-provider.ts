import type { QueryCatalogEntry, QueryFieldContract } from "./context.js";
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

function isQueryResultEnvelope(result: RunQueryResult): result is QueryResultEnvelope {
  return typeof result === "object" && result !== null && "data" in result && Array.isArray((result as QueryResultEnvelope).data);
}

function isLimitExceededResult(result: RunQueryResult): result is QueryLimitExceededResult {
  return typeof result === "object" && result !== null && (result as QueryLimitExceededResult).kind === "limitExceeded";
}

function getRowsFromResult(result: RunQueryResult): unknown[] {
  if (isLimitExceededResult(result)) return [];
  if (isQueryResultEnvelope(result)) return result.data;
  return Array.isArray(result) ? result : [result];
}

function matchesScalarType(value: unknown, type: QueryFieldContract["type"]): boolean {
  if (type === "date") return typeof value === "string";
  return typeof value === type;
}

export function validateQueryResultAgainstCatalog(
  queryCatalog: QueryCatalogEntry[],
  queryName: string,
  result: RunQueryResult
): RunQueryResult {
  const query = queryCatalog.find((entry) => entry.name === queryName);
  const fieldShape = query?.fieldShape;
  if (!fieldShape) return result;

  const rows = getRowsFromResult(result);
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      throw new Error(`Query "${queryName}" returned row ${index} that is not an object.`);
    }

    const record = row as Record<string, unknown>;
    for (const [fieldName, contract] of Object.entries(fieldShape)) {
      const value = record[fieldName];
      if (value === undefined || value === null) {
        if (!contract.optional) {
          throw new Error(`Query "${queryName}" returned row ${index} without required field "${fieldName}".`);
        }
        continue;
      }

      if (!matchesScalarType(value, contract.type)) {
        throw new Error(
          `Query "${queryName}" returned field "${fieldName}" in row ${index} with type "${typeof value}", expected "${contract.type}".`
        );
      }
    }
  }

  return result;
}

export function createContractEnforcedDataProvider(
  queryCatalog: QueryCatalogEntry[],
  dataProvider: DataProvider
): DataProvider {
  return {
    async runQuery(request: RunQueryRequest): Promise<RunQueryResult> {
      const result = await dataProvider.runQuery(request);
      return validateQueryResultAgainstCatalog(queryCatalog, request.name, result);
    },
  };
}

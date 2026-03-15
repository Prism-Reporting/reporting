import {
  REPORT_SPEC_VERSION,
  resolveReport,
  validateReportSpec,
  type BaseReportingContext,
  type DataProvider,
  type QueryCatalogEntry,
  type QueryFieldContract,
  type QueryParamContract,
  type QueryParamSemanticMode,
  type ReportingContextProvider,
  type ReportSpec,
  type RunQueryResult,
} from "@prism-reporting/core";
import { buildValidationContextFromBaseContext } from "./runtime.js";

export interface ReportingAgentToolsOptions {
  contextProvider: ReportingContextProvider;
  dataProvider: DataProvider;
  previewRowLimit?: number;
  profileRowLimit?: number;
}

export interface PreviewQueryInspectOptions {
  includeFieldProfiles?: boolean;
  includeValueOptions?: boolean;
  includeRanges?: boolean;
  includeNullRates?: boolean;
  includeParamOptions?: boolean;
  maxDistinctValues?: number;
}

interface QueryRowsPayload {
  rows: Record<string, unknown>[];
  totalCount?: number;
  pagination?: Record<string, unknown>;
}

interface PreviewFieldProfile {
  declaredType?: QueryFieldContract["type"];
  semantic?: QueryFieldContract["semantic"];
  sampleValues?: unknown[];
  nullCount?: number;
  nullRate?: number;
  distinctValueCount?: number;
  distinctValues?: unknown[];
  distinctValuesTruncated?: boolean;
  observedMin?: number | string;
  observedMax?: number | string;
}

interface PreviewParamInsight {
  type: QueryParamContract["type"];
  mapsToField?: string;
  mode?: QueryParamSemanticMode;
  suggestedValues?: unknown[];
  suggestedValuesTruncated?: boolean;
  observedMin?: number | string;
  observedMax?: number | string;
}

function findQuery(baseContext: BaseReportingContext, queryName: string): QueryCatalogEntry | null {
  return baseContext.queries.find((query) => query.name === queryName) ?? null;
}

function getAllowedParamNames(query: QueryCatalogEntry): string[] {
  return Array.isArray(query.params)
    ? query.params
    : query.paramShape
      ? Object.keys(query.paramShape)
      : [];
}

function getAllowedFieldNames(query: QueryCatalogEntry): string[] {
  return Array.isArray(query.fields)
    ? query.fields
    : query.fieldShape
      ? Object.keys(query.fieldShape)
      : [];
}

function getRowsPayload(result: RunQueryResult): QueryRowsPayload {
  if (Array.isArray(result)) {
    return { rows: result as Record<string, unknown>[] };
  }
  if (result && typeof result === "object" && (result as { kind?: string }).kind === "limitExceeded") {
    return { rows: [] };
  }
  if (result && typeof result === "object" && Array.isArray((result as { data?: unknown[] }).data)) {
    const envelope = result as {
      data: Record<string, unknown>[];
      totalCount?: number;
      pagination?: Record<string, unknown>;
    };
    return {
      rows: envelope.data,
      totalCount: envelope.totalCount,
      pagination: envelope.pagination,
    };
  }
  return { rows: [] };
}

function uniqueStringValues(values: string[] | undefined): string[] | undefined {
  if (!Array.isArray(values)) return undefined;
  const normalized = [...new Set(values.filter((value) => typeof value === "string" && value.trim().length > 0))];
  return normalized.length > 0 ? normalized : undefined;
}

function projectRows(rows: Record<string, unknown>[], fields: string[] | undefined): Record<string, unknown>[] {
  if (!fields || fields.length === 0) return rows;
  return rows.map((row) =>
    Object.fromEntries(fields.map((fieldName) => [fieldName, row[fieldName]]))
  );
}

function getProfileTargetFields(
  query: QueryCatalogEntry,
  rows: Record<string, unknown>[],
  requestedFields: string[] | undefined,
  inspect: PreviewQueryInspectOptions
): string[] {
  const fields = new Set<string>(requestedFields ?? getAllowedFieldNames(query) ?? []);
  if (fields.size === 0) {
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        fields.add(key);
      }
    }
  }

  if (inspect.includeParamOptions && query.paramShape) {
    for (const contract of Object.values(query.paramShape)) {
      if (contract.semantic?.mapsToField) {
        fields.add(contract.semantic.mapsToField);
      }
    }
  }

  return [...fields];
}

function shouldBuildProfiles(inspect: PreviewQueryInspectOptions): boolean {
  return Boolean(
    inspect.includeFieldProfiles ||
      inspect.includeValueOptions ||
      inspect.includeRanges ||
      inspect.includeNullRates ||
      inspect.includeParamOptions
  );
}

function normalizeDistinctLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) return 20;
  return Math.max(1, Math.min(50, Math.trunc(Number(value))));
}

function createValueKey(value: unknown): string {
  if (value === null) return "null";
  return `${typeof value}:${String(value)}`;
}

function collectDistinctValues(values: unknown[]): { values: unknown[]; count: number; truncated: boolean } {
  const unique = new Map<string, unknown>();
  for (const value of values) {
    unique.set(createValueKey(value), value);
  }
  return {
    values: [...unique.values()],
    count: unique.size,
    truncated: false,
  };
}

function buildFieldProfiles(
  query: QueryCatalogEntry,
  rows: Record<string, unknown>[],
  fields: string[],
  inspect: PreviewQueryInspectOptions
): Record<string, PreviewFieldProfile> {
  const profiles: Record<string, PreviewFieldProfile> = {};
  const distinctLimit = normalizeDistinctLimit(inspect.maxDistinctValues);

  for (const fieldName of fields) {
    const contract = query.fieldShape?.[fieldName];
    const nullCount = rows.reduce((count, row) => (row[fieldName] == null ? count + 1 : count), 0);
    const values = rows
      .map((row) => row[fieldName])
      .filter((value): value is unknown => value != null);
    const profile: PreviewFieldProfile = {
      ...(contract?.type ? { declaredType: contract.type } : {}),
      ...(contract?.semantic ? { semantic: contract.semantic } : {}),
      sampleValues: values.slice(0, 5),
    };

    if (inspect.includeNullRates) {
      profile.nullCount = nullCount;
      profile.nullRate = rows.length > 0 ? Number((nullCount / rows.length).toFixed(4)) : 0;
    }

    if (inspect.includeValueOptions) {
      const distinct = collectDistinctValues(values);
      profile.distinctValueCount = distinct.count;
      if (distinct.count <= distinctLimit) {
        profile.distinctValues = distinct.values;
        profile.distinctValuesTruncated = false;
      } else {
        profile.distinctValues = distinct.values.slice(0, distinctLimit);
        profile.distinctValuesTruncated = true;
      }
    }

    if (inspect.includeRanges) {
      if (contract?.type === "number") {
        const numericValues = values
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value));
        if (numericValues.length > 0) {
          profile.observedMin = Math.min(...numericValues);
          profile.observedMax = Math.max(...numericValues);
        }
      } else if (contract?.type === "date") {
        const dateValues = values
          .map((value) => String(value))
          .filter((value) => value.length > 0)
          .sort((left, right) => left.localeCompare(right));
        if (dateValues.length > 0) {
          profile.observedMin = dateValues[0];
          profile.observedMax = dateValues[dateValues.length - 1];
        }
      }
    }

    profiles[fieldName] = profile;
  }

  return profiles;
}

function buildParamInsights(
  query: QueryCatalogEntry,
  fieldProfiles: Record<string, PreviewFieldProfile>
): Record<string, PreviewParamInsight> | undefined {
  if (!query.paramShape) return undefined;

  const entries = Object.entries(query.paramShape)
    .filter(([, contract]) => contract.semantic?.mapsToField)
    .map(([paramName, contract]) => {
      const fieldProfile = contract.semantic?.mapsToField
        ? fieldProfiles[contract.semantic.mapsToField]
        : undefined;
      return [
        paramName,
        {
          type: contract.type,
          mapsToField: contract.semantic?.mapsToField,
          mode: contract.semantic?.mode,
          ...(fieldProfile?.distinctValues ? { suggestedValues: fieldProfile.distinctValues } : {}),
          ...(fieldProfile?.distinctValuesTruncated != null
            ? { suggestedValuesTruncated: fieldProfile.distinctValuesTruncated }
            : {}),
          ...(fieldProfile?.observedMin != null ? { observedMin: fieldProfile.observedMin } : {}),
          ...(fieldProfile?.observedMax != null ? { observedMax: fieldProfile.observedMax } : {}),
        } satisfies PreviewParamInsight,
      ] as const;
    });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function formatValidationError(
  errors: string[],
  diagnostics: Array<{ path: string; code: string; message: string; suggestion?: string }>
): string {
  const errorLines = errors.length > 0 ? `Errors:\n${errors.map((error) => `- ${error}`).join("\n")}` : "";
  const diagnosticLines =
    diagnostics.length > 0
      ? `Diagnostics:\n${diagnostics
          .map(
            (diagnostic) =>
              `- ${diagnostic.path || "$"} [${diagnostic.code}]: ${diagnostic.message}${
                diagnostic.suggestion ? ` (${diagnostic.suggestion})` : ""
              }`
          )
          .join("\n")}`
      : "";
  return [errorLines, diagnosticLines].filter(Boolean).join("\n") || "Validation failed.";
}

function buildDryRunErrors(resolvedReport: Awaited<ReturnType<typeof resolveReport>>): string[] {
  return (resolvedReport.queries ?? [])
    .filter((query) => query.limitExceeded)
    .map((query) => {
      const message = query.limitExceeded?.message ?? "Query exceeded the supported row limit.";
      return `Widget "${query.widgetId ?? "unknown"}" dry-run failed for dataSource "${query.dataSource}" (${query.query}): ${message}`;
    });
}

export function createReportingAgentTools(options: ReportingAgentToolsOptions) {
  const previewRowLimit = Math.max(1, Math.min(10, options.previewRowLimit ?? 5));
  const profileRowLimit = Math.max(previewRowLimit, Math.min(200, Math.max(1, options.profileRowLimit ?? 100)));

  return {
    async listAvailableQueries() {
      const baseContext = await options.contextProvider.getBaseContext();
      return {
        version: REPORT_SPEC_VERSION,
        source: baseContext.source,
        tenantId: baseContext.tenantId,
        queries: baseContext.queries,
      };
    },

    async describeQuery({ name }: { name: string }) {
      const baseContext = await options.contextProvider.getBaseContext();
      const query = findQuery(baseContext, name);
      return {
        version: REPORT_SPEC_VERSION,
        found: Boolean(query),
        query,
        availableQueryNames: query ? undefined : baseContext.queries.map((entry) => entry.name),
      };
    },

    async previewQuery({
      name,
      params = {},
      fields,
      inspect = {},
    }: {
      name: string;
      params?: Record<string, unknown>;
      fields?: string[];
      inspect?: PreviewQueryInspectOptions;
    }) {
      const baseContext = await options.contextProvider.getBaseContext();
      const query = findQuery(baseContext, name);
      if (!query) {
        return {
          ok: false,
          error: `Unknown query "${name}".`,
          availableQueryNames: baseContext.queries.map((entry) => entry.name),
        };
      }

      const allowedParams = new Set(getAllowedParamNames(query));
      const invalidParams = Object.keys(params).filter((key) => !allowedParams.has(key));
      if (invalidParams.length > 0) {
        return {
          ok: false,
          error: `Query "${name}" does not accept params: ${invalidParams.join(", ")}.`,
          allowedParams: [...allowedParams],
        };
      }

      const requestedFields = uniqueStringValues(fields);
      const allowedFields = new Set(getAllowedFieldNames(query));
      const invalidFields = (requestedFields ?? []).filter((fieldName) => !allowedFields.has(fieldName));
      if (invalidFields.length > 0) {
        return {
          ok: false,
          error: `Query "${name}" does not expose fields: ${invalidFields.join(", ")}.`,
          allowedFields: [...allowedFields],
        };
      }

      const result = await options.dataProvider.runQuery({
        name,
        params,
        execution: {
          deliveryMode: "paginatedList",
          page: 1,
          pageSize: profileRowLimit,
        },
      });
      const payload = getRowsPayload(result);
      const rows = payload.rows.slice(0, profileRowLimit);
      const previewRows = projectRows(rows.slice(0, previewRowLimit), requestedFields);
      const profileTargets = shouldBuildProfiles(inspect)
        ? getProfileTargetFields(query, rows, requestedFields, inspect)
        : [];
      const fieldProfiles = profileTargets.length > 0
        ? buildFieldProfiles(query, rows, profileTargets, inspect)
        : undefined;
      const paramInsights =
        inspect.includeParamOptions && fieldProfiles
          ? buildParamInsights(query, fieldProfiles)
          : undefined;

      return {
        ok: true,
        query: name,
        params,
        requestedFields,
        previewLimit: previewRowLimit,
        inspectedRowCount: rows.length,
        profileScope: "boundedLiveData",
        rows: previewRows,
        totalCount: payload.totalCount,
        pagination: payload.pagination,
        ...(fieldProfiles ? { fieldProfiles } : {}),
        ...(paramInsights ? { paramInsights } : {}),
      };
    },

    async applyReportSpec({ spec }: { spec: ReportSpec }) {
      const baseContext = await options.contextProvider.getBaseContext();
      const validationContext = buildValidationContextFromBaseContext(baseContext);
      const validation = validateReportSpec(spec, validationContext);
      if (!validation.valid) {
        return {
          applied: false,
          error: formatValidationError(validation.errors ?? [], validation.diagnostics ?? []),
          validation,
        };
      }

      try {
        const resolved = await resolveReport(spec, options.dataProvider);
        const dryRunErrors = buildDryRunErrors(resolved);
        if (dryRunErrors.length > 0) {
          return {
            applied: false,
            error: formatValidationError(dryRunErrors, []),
          };
        }
      } catch (error) {
        return {
          applied: false,
          error: formatValidationError([error instanceof Error ? error.message : String(error)], []),
        };
      }

      return { applied: true };
    },
  };
}

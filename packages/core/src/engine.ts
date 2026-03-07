import type {
  ReportSpec,
  FilterSpec,
  WidgetSpec,
  TableWidgetSpec,
  BarChartWidgetSpec,
  KpiWidgetSpec,
  DataSourceSpec,
} from "./types";
import type { DataProvider } from "./data-provider";

export const REPORT_SPEC_VERSION = "v1" as const;

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
  columns: Array<{ key: string; label: string }>;
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

export type ResolvedWidgetData =
  | { type: "table"; data: ResolvedTableData }
  | { type: "barChart"; data: ResolvedBarChartData }
  | { type: "kpi"; data: ResolvedKpiData };

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
export function validateReportSpec(
  spec: ReportSpec,
  context: ValidationContext = {}
): ValidationResult {
  const diagnostics: ValidationDiagnostic[] = [];
  const queryLookup = new Set(context.availableQueries ?? []);
  const hasQueryContext = queryLookup.size > 0;
  const fieldLookup = Object.fromEntries(
    Object.entries(context.availableFields ?? {}).map(([query, fields]) => [
      query,
      new Set(fields),
    ])
  );

  const addError = (
    path: string,
    code: string,
    message: string,
    suggestion?: string
  ) => {
    diagnostics.push({
      path,
      code,
      message,
      severity: "error",
      suggestion,
    });
  };

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

  const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

  const validateFieldReference = (
    path: string,
    queryName: string | undefined,
    fieldName: unknown,
    label: string
  ) => {
    if (!isNonEmptyString(fieldName)) {
      addError(
        path,
        "missing-field-reference",
        `${label} must be a non-empty string`,
        "Provide a field key that exists in the referenced query output."
      );
      return;
    }

    if (!queryName) return;

    const knownFields = fieldLookup[queryName];
    if (knownFields && !knownFields.has(fieldName)) {
      addError(
        path,
        "unknown-field-reference",
        `${label} "${fieldName}" is not available on query "${queryName}"`,
        "Use one of the fields exposed by the query catalog for this query."
      );
    }
  };

  const rawSpec = spec as unknown;
  if (!isRecord(rawSpec)) {
    addError(
      "$",
      "invalid-report-spec",
      "ReportSpec must be an object",
      "Provide a JSON object that matches the ReportSpec contract."
    );
    return {
      version: REPORT_SPEC_VERSION,
      valid: false,
      errors: diagnostics.map((diagnostic) => diagnostic.message),
      diagnostics,
    };
  }

  if (!isNonEmptyString(rawSpec.id)) {
    addError("id", "missing-id", "ReportSpec.id is required", "Use a unique kebab-case report id.");
  }

  if (!isNonEmptyString(rawSpec.title)) {
    addError("title", "missing-title", "ReportSpec.title is required", "Provide a human-readable title.");
  }

  if (!isNonEmptyString(rawSpec.layout)) {
    addError("layout", "missing-layout", "ReportSpec.layout is required", 'Use "singleColumn" or "twoColumn".');
  } else if (!["singleColumn", "twoColumn"].includes(rawSpec.layout)) {
    addError(
      "layout",
      "invalid-layout",
      `ReportSpec.layout "${rawSpec.layout}" is not supported`,
      'Use "singleColumn" or "twoColumn".'
    );
  }

  const dataSources = isRecord(rawSpec.dataSources) ? rawSpec.dataSources : {};
  if (!isRecord(rawSpec.dataSources)) {
    addError(
      "dataSources",
      "invalid-data-sources",
      "ReportSpec.dataSources must be an object",
      "Provide an object keyed by dataSource id."
    );
  }

  const filters = Array.isArray(rawSpec.filters) ? rawSpec.filters : [];
  if (!Array.isArray(rawSpec.filters)) {
    addError(
      "filters",
      "invalid-filters",
      "ReportSpec.filters must be an array",
      "Provide an array of filter definitions."
    );
  }

  const widgets = Array.isArray(rawSpec.widgets) ? rawSpec.widgets : [];
  if (!Array.isArray(rawSpec.widgets)) {
    addError(
      "widgets",
      "invalid-widgets",
      "ReportSpec.widgets must be an array",
      "Provide an array of widget definitions."
    );
  }

  const dataSourceNames = new Set<string>();
  const dataSourceValueNames = new Set<string>();
  const dataSourceQueries = new Map<string, string>();

  for (const [dataSourceId, value] of Object.entries(dataSources)) {
    dataSourceNames.add(dataSourceId);

    if (!isRecord(value)) {
      addError(
        `dataSources.${dataSourceId}`,
        "invalid-data-source",
        `Data source "${dataSourceId}" must be an object`,
        "Provide { name, query, params? } for each data source."
      );
      continue;
    }

    if (!isNonEmptyString(value.name)) {
      addError(
        `dataSources.${dataSourceId}.name`,
        "missing-data-source-name",
        `Data source "${dataSourceId}" must define a non-empty name`,
        "Use a stable descriptive name for the data source."
      );
    } else if (dataSourceValueNames.has(value.name)) {
      addError(
        `dataSources.${dataSourceId}.name`,
        "duplicate-data-source-name",
        `Duplicate data source name "${value.name}"`,
        "Ensure every data source name is unique within the report."
      );
    } else {
      dataSourceValueNames.add(value.name);
    }

    if (!isNonEmptyString(value.query)) {
      addError(
        `dataSources.${dataSourceId}.query`,
        "missing-query",
        `Data source "${dataSourceId}" must define a non-empty query`,
        "Use a backend query identifier supported by the host."
      );
      continue;
    }

    dataSourceQueries.set(dataSourceId, value.query);

    if (hasQueryContext && !queryLookup.has(value.query)) {
      addError(
        `dataSources.${dataSourceId}.query`,
        "unknown-query",
        `Data source "${dataSourceId}" references unknown query "${value.query}"`,
        "Use one of the queries published by the host query catalog."
      );
    }

    if (value.params !== undefined && !isRecord(value.params)) {
      addError(
        `dataSources.${dataSourceId}.params`,
        "invalid-data-source-params",
        `Data source "${dataSourceId}" params must be an object`,
        "Provide static default params as a JSON object."
      );
    }
  }

  const filterIds = new Set<string>();
  for (const [index, filter] of filters.entries()) {
    const path = `filters.${index}`;

    if (!isRecord(filter)) {
      addError(
        path,
        "invalid-filter",
        `Filter at index ${index} must be an object`,
        "Provide a valid filter definition."
      );
      continue;
    }

    const id = filter.id;
    if (!isNonEmptyString(id)) {
      addError(`${path}.id`, "missing-filter-id", `Filter at index ${index} is missing id`, "Provide a unique filter id.");
    } else if (filterIds.has(id)) {
      addError(
        `${path}.id`,
        "duplicate-filter-id",
        `Duplicate filter id "${id}"`,
        "Ensure every filter id is unique within the report."
      );
    } else {
      filterIds.add(id);
    }

    if (!isNonEmptyString(filter.label)) {
      addError(`${path}.label`, "missing-filter-label", `Filter "${String(id ?? index)}" is missing label`, "Provide a human-readable label.");
    }

    if (!isNonEmptyString(filter.dataSource)) {
      addError(
        `${path}.dataSource`,
        "missing-filter-data-source",
        `Filter "${String(id ?? index)}" must reference a dataSource`,
        "Use the id of one of the dataSources defined in the spec."
      );
    } else if (!dataSourceNames.has(filter.dataSource)) {
      addError(
        `${path}.dataSource`,
        "unknown-filter-data-source",
        `Filter "${String(id ?? index)}" references unknown dataSource "${filter.dataSource}"`,
        "Use a dataSource key that exists in ReportSpec.dataSources."
      );
    }

    switch (filter.type) {
      case "select": {
        if (!Array.isArray(filter.options) || filter.options.length === 0) {
          addError(
            `${path}.options`,
            "invalid-select-options",
            `Select filter "${String(id ?? index)}" must define at least one option`,
            "Provide one or more { value, label } options."
          );
          break;
        }

        for (const [optionIndex, option] of filter.options.entries()) {
          if (!isRecord(option)) {
            addError(
              `${path}.options.${optionIndex}`,
              "invalid-select-option",
              "Select filter options must be objects",
              "Provide { value, label } for each option."
            );
            continue;
          }

          if (!isNonEmptyString(option.value)) {
            addError(
              `${path}.options.${optionIndex}.value`,
              "missing-select-option-value",
              "Select filter option value must be a non-empty string",
              "Provide the value passed to the backend query."
            );
          }

          if (!isNonEmptyString(option.label)) {
            addError(
              `${path}.options.${optionIndex}.label`,
              "missing-select-option-label",
              "Select filter option label must be a non-empty string",
              "Provide the label shown in the UI."
            );
          }
        }
        break;
      }
      case "dateRange":
      case "search":
        break;
      default:
        addError(
          `${path}.type`,
          "unsupported-filter-type",
          `Filter "${String(id ?? index)}" uses unsupported type "${String(filter.type)}"`,
          'Use one of "select", "dateRange", or "search".'
        );
    }
  }

  const widgetIds = new Set<string>();
  for (const [index, widget] of widgets.entries()) {
    const path = `widgets.${index}`;

    if (!isRecord(widget)) {
      addError(
        path,
        "invalid-widget",
        `Widget at index ${index} must be an object`,
        "Provide a valid widget definition."
      );
      continue;
    }

    const id = widget.id;
    if (!isNonEmptyString(id)) {
      addError(`${path}.id`, "missing-widget-id", `Widget at index ${index} is missing id`, "Provide a unique widget id.");
    } else if (widgetIds.has(id)) {
      addError(
        `${path}.id`,
        "duplicate-widget-id",
        `Duplicate widget id "${id}"`,
        "Ensure every widget id is unique within the report."
      );
    } else {
      widgetIds.add(id);
    }

    if (!isNonEmptyString(widget.dataSource)) {
      addError(
        `${path}.dataSource`,
        "missing-widget-data-source",
        `Widget "${String(id ?? index)}" must reference a dataSource`,
        "Use the id of one of the dataSources defined in the spec."
      );
    } else if (!dataSourceNames.has(widget.dataSource)) {
      addError(
        `${path}.dataSource`,
        "unknown-widget-data-source",
        `Widget "${String(id ?? index)}" references unknown dataSource "${widget.dataSource}"`,
        "Use a dataSource key that exists in ReportSpec.dataSources."
      );
    }

    if (!isRecord(widget.config)) {
      addError(
        `${path}.config`,
        "missing-widget-config",
        `Widget "${String(id ?? index)}" must define a config object`,
        "Provide the config required for the widget type."
      );
      continue;
    }

    const queryName =
      isNonEmptyString(widget.dataSource) && dataSourceQueries.has(widget.dataSource)
        ? dataSourceQueries.get(widget.dataSource)
        : undefined;

    switch (widget.type) {
      case "table": {
        if (!Array.isArray(widget.config.columns) || widget.config.columns.length === 0) {
          addError(
            `${path}.config.columns`,
            "invalid-table-columns",
            `Table widget "${String(id ?? index)}" must define at least one column`,
            "Provide one or more { key, label } column definitions."
          );
          break;
        }

        for (const [columnIndex, column] of widget.config.columns.entries()) {
          if (!isRecord(column)) {
            addError(
              `${path}.config.columns.${columnIndex}`,
              "invalid-table-column",
              "Table columns must be objects",
              "Provide { key, label, type? } for each column."
            );
            continue;
          }

          validateFieldReference(
            `${path}.config.columns.${columnIndex}.key`,
            queryName,
            column.key,
            "Table column key"
          );

          if (!isNonEmptyString(column.label)) {
            addError(
              `${path}.config.columns.${columnIndex}.label`,
              "missing-table-column-label",
              "Table column label must be a non-empty string",
              "Provide a label shown in the rendered table."
            );
          }

          if (
            column.type !== undefined &&
            !["string", "number", "date"].includes(String(column.type))
          ) {
            addError(
              `${path}.config.columns.${columnIndex}.type`,
              "invalid-table-column-type",
              `Table column type "${String(column.type)}" is not supported`,
              'Use "string", "number", or "date".'
            );
          }
        }
        break;
      }
      case "barChart":
        validateFieldReference(
          `${path}.config.categoryKey`,
          queryName,
          widget.config.categoryKey,
          "Bar chart categoryKey"
        );
        validateFieldReference(
          `${path}.config.valueKey`,
          queryName,
          widget.config.valueKey,
          "Bar chart valueKey"
        );
        break;
      case "kpi":
        validateFieldReference(
          `${path}.config.valueKey`,
          queryName,
          widget.config.valueKey,
          "KPI valueKey"
        );
        if (
          widget.config.format !== undefined &&
          !["number", "percent", "currency"].includes(String(widget.config.format))
        ) {
          addError(
            `${path}.config.format`,
            "invalid-kpi-format",
            `KPI format "${String(widget.config.format)}" is not supported`,
            'Use "number", "percent", or "currency".'
          );
        }
        break;
      default:
        addError(
          `${path}.type`,
          "unsupported-widget-type",
          `Widget "${String(id ?? index)}" uses unsupported type "${String(widget.type)}"`,
          'Use one of "table", "barChart", or "kpi".'
        );
    }
  }

  return {
    version: REPORT_SPEC_VERSION,
    valid: diagnostics.length === 0,
    errors: diagnostics.map((diagnostic) => diagnostic.message),
    diagnostics,
  };
}

/**
 * Builds params for a dataSource from filterState and filter specs.
 */
function buildParamsForDataSource(
  dataSourceName: string,
  spec: ReportSpec,
  filterState: Record<string, unknown>
): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  const ds = spec.dataSources[dataSourceName];
  if (ds?.params) {
    Object.assign(params, ds.params);
  }

  for (const filter of spec.filters) {
    if (filter.dataSource !== dataSourceName) continue;

    const filterId = filter.id;
    const value = filterState[filterId];

    if (value === undefined || value === null) continue;

    if (filter.type === "select") {
      const paramKey = filter.paramKey ?? filterId;
      params[paramKey] = value;
    } else if (filter.type === "dateRange") {
      const range = value as { from?: string; to?: string };
      const keyFrom = filter.paramKeyFrom ?? `${filterId}From`;
      const keyTo = filter.paramKeyTo ?? `${filterId}To`;
      if (range?.from) params[keyFrom] = range.from;
      if (range?.to) params[keyTo] = range.to;
    } else if (filter.type === "search") {
      const paramKey = filter.paramKey ?? filterId;
      params[paramKey] = value;
    }
  }

  return params;
}

/**
 * Resolves a ReportSpec into a view-ready ResolvedReport using the DataProvider.
 */
export async function resolveReport(
  spec: ReportSpec,
  dataProvider: DataProvider,
  filterState: Record<string, unknown> = {}
): Promise<ResolvedReport> {
  const validation = validateReportSpec(spec);
  if (!validation.valid) {
    throw new Error(`Invalid ReportSpec: ${validation.errors.join("; ")}`);
  }

  const dataCache = new Map<string, unknown[]>();

  const fetchData = async (dataSourceName: string): Promise<unknown[]> => {
    if (dataCache.has(dataSourceName)) {
      return dataCache.get(dataSourceName)!;
    }
    const ds = spec.dataSources[dataSourceName];
    const params = buildParamsForDataSource(dataSourceName, spec, filterState);
    const result = await dataProvider.runQuery({
      name: ds.query,
      params,
    });
    const arr = Array.isArray(result) ? result : [result];
    dataCache.set(dataSourceName, arr);
    return arr;
  };

  const resolvedWidgets: ResolvedWidget[] = [];

  for (const widget of spec.widgets) {
    const rows = (await fetchData(widget.dataSource)) as Record<string, unknown>[];

    if (widget.type === "table") {
      const tableSpec = widget as TableWidgetSpec;
      resolvedWidgets.push({
        spec: widget,
        data: {
          type: "table",
          data: {
            rows,
            columns: tableSpec.config.columns.map((c) => ({
              key: c.key,
              label: c.label,
            })),
          },
        },
      });
    } else if (widget.type === "barChart") {
      const chartSpec = widget as BarChartWidgetSpec;
      resolvedWidgets.push({
        spec: widget,
        data: {
          type: "barChart",
          data: {
            data: rows,
            categoryKey: chartSpec.config.categoryKey,
            valueKey: chartSpec.config.valueKey,
          },
        },
      });
    } else if (widget.type === "kpi") {
      const kpiSpec = widget as KpiWidgetSpec;
      const first = rows[0];
      const raw =
        first && typeof first === "object" && kpiSpec.config.valueKey in first
          ? (first as Record<string, unknown>)[kpiSpec.config.valueKey]
          : rows.length;
      const value: number | string =
        typeof raw === "number" || typeof raw === "string" ? raw : String(raw ?? "");
      resolvedWidgets.push({
        spec: widget,
        data: {
          type: "kpi",
          data: {
            value,
            label: kpiSpec.config.label,
          },
        },
      });
    }
  }

  return {
    spec,
    filterState,
    widgets: resolvedWidgets,
  };
}

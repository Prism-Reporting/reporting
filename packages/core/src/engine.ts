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

export interface ValidationResult {
  valid: boolean;
  errors: string[];
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
export function validateReportSpec(spec: ReportSpec): ValidationResult {
  const errors: string[] = [];

  if (!spec.id?.trim()) errors.push("ReportSpec.id is required");
  if (!spec.title?.trim()) errors.push("ReportSpec.title is required");
  if (!spec.layout) errors.push("ReportSpec.layout is required");
  if (!spec.dataSources || typeof spec.dataSources !== "object")
    errors.push("ReportSpec.dataSources must be an object");
  if (!Array.isArray(spec.filters)) errors.push("ReportSpec.filters must be an array");
  if (!Array.isArray(spec.widgets)) errors.push("ReportSpec.widgets must be an array");

  const dataSourceNames = new Set(Object.keys(spec.dataSources || {}));

  for (const filter of spec.filters || []) {
    const f = filter as FilterSpec & { dataSource?: string };
    if (f.dataSource && !dataSourceNames.has(f.dataSource)) {
      errors.push(`Filter "${(filter as FilterSpec & { id?: string }).id}" references unknown dataSource "${f.dataSource}"`);
    }
  }

  for (const widget of spec.widgets || []) {
    const w = widget as WidgetSpec & { dataSource?: string };
    if (w.dataSource && !dataSourceNames.has(w.dataSource)) {
      errors.push(`Widget "${(widget as WidgetSpec & { id?: string }).id}" references unknown dataSource "${w.dataSource}"`);
    }
  }

  const widgetIds = new Set<string>();
  for (const widget of spec.widgets || []) {
    const id = (widget as WidgetSpec & { id?: string }).id;
    if (id && widgetIds.has(id)) {
      errors.push(`Duplicate widget id "${id}"`);
    }
    if (id) widgetIds.add(id);
  }

  return {
    valid: errors.length === 0,
    errors,
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

# @reporting/core

Core types, engine, and interfaces for the AI Reporting Platform.

## ReportSpec v1

The ReportSpec is a structured DSL that describes reports. AI tools (future phase) will generate and modify ReportSpec—they do **not** produce raw HTML or control UI libraries directly.

### Required Fields (Safe for AI)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique report identifier |
| `title` | string | Yes | Display title |
| `layout` | "singleColumn" \| "twoColumn" | Yes | Page layout |
| `dataSources` | Record<string, DataSourceSpec> | Yes | Named data sources |
| `filters` | FilterSpec[] | Yes | Filter definitions (may be empty) |
| `widgets` | WidgetSpec[] | Yes | Visual widgets |
| `groups` | ReportGroupSpec[] | No | Optional logical widget groups used to scope filters to part of a report. |
| `presets` | ReportSpecPreset[] | No | Optional named filter states (e.g. "This quarter"); host applies `preset.filterState`. |
| `version` | string | No | Optional report version (e.g. "1.0", "2024.03"); exposed on `ResolvedReport.version` for UI display. |
| `refreshInterval` | number | No | Optional interval in seconds; when set, the **host** should re-call `resolveReport` after that interval (engine does not implement timers). Hosts may cache by spec.id + filterState and TTL. |
| `layoutOptions` | LayoutOptions | No | Optional `columnGap` / `rowGap` CSS hints for the report grid. |
| `sections` | ReportSectionSpec[] | No | Optional titled widget groupings; widgets are referenced by id. |
| `tabs` | ReportTabSpec[] | No | Optional tabbed layout; takes precedence over sections. |
| `owner` | string | No | Optional owner (e.g. user id or email); pass-through for governance and UI (e.g. "Owner: {owner}"). |
| `author` | string | No | Optional author (e.g. user id or email); pass-through for UI (e.g. "By {author}"). |

### DataSourceSpec

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique name within the report |
| `query` | string | Yes | Query identifier (passed to DataProvider.runQuery) |
| `params` | Record<string, unknown> | No | Static default parameters |
| `delivery` | `{ mode, pageSize?, maxRows? }` | No | Explicit integration contract. Use `paginatedList` for table/list sources, `fullVisual` for full chart datasets and engine-side grouped summaries, `summary` for backend-aggregated KPI sources. |

### FilterSpec Variants

- **SelectFilter**: `type: "select"`, `options: { value, label }[]`, `groupIds?`, `paramKey?`
- **MultiSelectFilter**: `type: "multiSelect"`, `options: { value, label }[]`, `groupIds?`, `paramKey?`
- **DateRangeFilter**: `type: "dateRange"`, `groupIds?`, `paramKeyFrom?`, `paramKeyTo?`
- **SearchFilter**: `type: "search"`, `groupIds?`, `paramKey?`, `placeholder?`
- **NumericRangeFilter**: `type: "numericRange"`, `groupIds?`, `min?`, `max?`, `step?`, `paramKeyFrom?`, `paramKeyTo?`

All filters require: `id`, `label`, `dataSource` (must reference a key in `dataSources`).

### WidgetSpec Variants

- **TableWidget**: `type: "table"`, `config.columns?: { key, label }[]`, `config.summary?: { key, op }[]`, `config.groupByKey?`, `config.groupAggregations?`, `config.drillDown?`
- **CardViewWidget**: `type: "cardView"`, `config.titleKey`, optional `config.subtitleKey`, `config.badges`, `config.metadata`, `config.primaryMetric`, `config.template`
- **BarChartWidget**: `type: "barChart"`, `config.categoryKey`, `config.valueKey`
- **LineChartWidget** / **AreaChartWidget**: `config.categoryKey`, `config.valueKey`, optional `config.series`
- **PieChartWidget** / **DoughnutChartWidget** / **SpiralChartWidget** / **FunnelChartWidget**: `config.categoryKey`, `config.valueKey`
- **StackedBarChartWidget**: `config.categoryKey`, `config.series`
- **ScatterChartWidget** / **BubbleChartWidget**: `config.xKey`, `config.yKey`, optional or required `config.zKey`
- **TimelineViewWidget** / **GanttChartWidget**: `config.startDateKey`, `config.endDateKey`, `config.labelKey`, optional `config.groupKey`, `config.statusKey`
- **KpiWidget**: `type: "kpi"`, `config.valueKey`, `config.label?`, optional aggregation/format/trend settings

All widgets require: `id`, `dataSource`, `config`. `title`, `groupIds`, `width`, and `height` are optional.

Sizing hints:

- `width` / `height` are optional CSS size strings such as `100%`, `320px`, or `24rem`.
- The renderer enforces per-widget minimum sizes even when a smaller hint is provided.
- Current minimums are exported as `WIDGET_SIZE_CONSTRAINTS` and available through `getWidgetSizeConstraints()`:
  - table: min `320px` wide, `180px` tall
  - cardView: min `320px` wide, `220px` tall
  - bar/line/stacked charts: min `320px` wide, `260px` tall
  - KPI: min `180px` wide, `80px` tall

### Safe-for-AI Constraints

1. **Referential integrity**: Filter and widget `dataSource` values must exist in `dataSources`.
2. **Unique IDs**: Widget and filter `id` values must be unique within the report.
3. **No arbitrary layout**: Use only `singleColumn` or `twoColumn`—no pixel-level control.
4. **Stable schema**: Adding new filter/widget types requires schema updates; AI should only use documented types.

## DataProvider Interface

The host implements `DataProvider` to provide data. The engine never accesses databases directly.

```typescript
interface DataProvider {
  runQuery(
    request: {
      name: string;
      params?: Record<string, unknown>;
      execution?: {
        deliveryMode: "paginatedList" | "fullVisual" | "summary";
        page?: number;
        pageSize?: number;
        maxRows?: number;
      };
    }
  ): Promise<
    | unknown[]
    | {
        kind?: "rows";
        data: unknown[];
        totalCount?: number;
        pagination?: {
          page: number;
          pageSize: number;
          totalCount?: number;
          hasMore?: boolean;
        };
      }
    | {
        kind: "limitExceeded";
        totalCount: number;
        limit: number;
        message?: string;
      }
  >;
}
```

Framework expectations:

- `paginatedList`: backend should use `execution.page` / `execution.pageSize` and return rows plus pagination metadata.
- `fullVisual`: backend must not paginate. Return all rows when they fit under `execution.maxRows`; otherwise return `kind: "limitExceeded"` with `totalCount`.
- `summary`: backend returns already-aggregated rows for KPIs/summary widgets.

When a host returns the object form, the engine preserves pagination or `limitExceeded` metadata on the resolved query so the UI can render table paging controls and explicit “too much data” messages for visuals.

## Engine

- `validateReportSpec(spec, context?, options?)`: Returns `{ version, valid, errors, diagnostics }`. Optional `options.policy(spec)` runs after structural validation; when the policy returns `allowed: false`, policy errors are added to diagnostics and `valid` is set to false. Hosts can supply a policy for governance (e.g. max widgets, allowed query names).
- `resolveReport(spec, dataProvider, filterState?, options?)`: Validates, runs queries with merged filter params, returns `ResolvedReport`. Optional `options.onAudit(event)` is called with a minimal audit event on success or error so hosts can log to their audit system.

`validateReportSpec` supports optional grounding context:

- `availableQueries?: string[]`
- `availableFields?: Record<string, string[]>`

When grounding context is provided, the validator can also catch:

- unknown `dataSource.query` values
- unknown widget field references for the selected query
- invalid enum-like values and missing type-specific config
- duplicate filter ids in addition to duplicate widget ids

### Shareable URLs (filter state in URL)

Hosts can persist filter state in the URL so links are shareable. Use:

- **`serializeFilterStateToSearchParams(filterState, spec.filters)`** – returns a query string (e.g. `?status=NEW&dueDateFrom=2024-01-01`) from current filter state.
- **`parseFilterStateFromSearchParams(search, spec.filters)`** – parses `window.location.search` (or any query string) into `Record<string, unknown>` filter state.

Conventions: single-value filters use the filter `id` as the param key; multiSelect uses the same key with comma-separated values; dateRange/numericRange use `idFrom` and `idTo`. On load, parse the URL and pass the result as initial filter state; on filter change, call `serializeFilterStateToSearchParams` and update the URL with `history.replaceState` or `pushState`.

### Save/load reports

Hosts may persist a report by saving the spec as JSON and restore it later. Use **`serializeReportSpecToJson(spec)`** to get a string (e.g. for localStorage or a server API), and **`parseReportSpecFromJson(json)`** to parse it back; the parser returns `{ ok: true, spec }` or `{ ok: false, error }`. No backend or database is required—persistence is the host's responsibility.

### Export

- **CSV**: Use **`exportTableToCsv(columns, rows)`** with resolved table columns and rows to produce a CSV string. The react-ui table widget exposes an "Export CSV" button that uses this.
- **PDF**: PDF export is not currently exposed in the react-ui renderer. If this is reintroduced later, it will likely use the browser print dialog rather than a dedicated PDF library.

## Reporting context contract

Shared types for **base** and **semantic** reporting context, and the **context provider** interface, are exported from `@reporting/core`. Both the MCP package and application code (e.g. starter example) can use these types.

### Base reporting context

- **`BaseReportingContext`**: `source?`, `tenantId?`, `queries: QueryCatalogEntry[]`
- **`QueryCatalogEntry`**: `name`, `description?`, `fields?`, `params?`, `notes?`

Base context drives deterministic validation and runtime behavior (e.g. `validateReportSpec` grounding).

### Semantic reporting context (optional)

- **`SemanticReportingContext`**: `queryAliases?`, `fieldAliases?`, `examples?`, `clarificationHints?`
- Element types: `QueryAliasEntry`, `FieldAliasEntry`, `SemanticExampleEntry`, `ClarificationHintEntry`

Semantic context is for AI grounding only; it must not redefine validation rules.

### Context provider interface

- **`ReportingContextProvider`**:
  - **`getBaseContext(input?)`**: `Promise<BaseReportingContext>` (required)
  - **`getSemanticContext(input?)`**: `Promise<SemanticReportingContext | null>` (optional method)

Implementations may be local (e.g. starter reading from query catalog) or remote. The MCP server and app both consume context via this provider.

## Component Registry

The `ComponentRegistry` interface maps primitives (table, cardView, barChart, kpi, filterBar, and the other supported visual widgets) to React components. Hosts can provide custom implementations (e.g., Ant Design, MUI) without changing the spec.

## Example: Natural Language → ReportSpec

**Request**: "Show me tasks by status with a date filter"

**Generated ReportSpec** (conceptual):

```json
{
  "id": "tasks-by-status",
  "title": "Tasks by Status",
  "layout": "singleColumn",
  "dataSources": { "tasks": { "name": "tasks", "query": "tasks" } },
  "filters": [
    { "type": "select", "id": "status", "label": "Status", "dataSource": "tasks", "options": [...] },
    { "type": "dateRange", "id": "dateRange", "label": "Due Date", "dataSource": "tasks" }
  ],
  "widgets": [
    { "type": "table", "id": "t1", "dataSource": "tasks", "config": { "columns": [...] } }
  ]
}
```

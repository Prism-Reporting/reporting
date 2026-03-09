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

### DataSourceSpec

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique name within the report |
| `query` | string | Yes | Query identifier (passed to DataProvider.runQuery) |
| `params` | Record<string, unknown> | No | Static default parameters |

### FilterSpec Variants

- **SelectFilter**: `type: "select"`, `options: { value, label }[]`, `paramKey?`
- **DateRangeFilter**: `type: "dateRange"`, `paramKeyFrom?`, `paramKeyTo?`
- **SearchFilter**: `type: "search"`, `paramKey?`, `placeholder?`

All filters require: `id`, `label`, `dataSource` (must reference a key in `dataSources`).

### WidgetSpec Variants

- **TableWidget**: `type: "table"`, `config.columns: { key, label }[]`
- **BarChartWidget**: `type: "barChart"`, `config.categoryKey`, `config.valueKey`
- **KpiWidget**: `type: "kpi"`, `config.valueKey`, `config.label?`

All widgets require: `id`, `dataSource`, `config`. `title` is optional.

### Safe-for-AI Constraints

1. **Referential integrity**: Filter and widget `dataSource` values must exist in `dataSources`.
2. **Unique IDs**: Widget and filter `id` values must be unique within the report.
3. **No arbitrary layout**: Use only `singleColumn` or `twoColumn`—no pixel-level control.
4. **Stable schema**: Adding new filter/widget types requires schema updates; AI should only use documented types.

## DataProvider Interface

The host implements `DataProvider` to provide data. The engine never accesses databases directly.

```typescript
interface DataProvider {
  runQuery(request: { name: string; params?: Record<string, unknown> }): Promise<unknown[]>;
}
```

## Engine

- `validateReportSpec(spec, context?)`: Returns `{ version, valid, errors, diagnostics }`.
- `resolveReport(spec, dataProvider, filterState?)`: Validates, runs queries with merged filter params, returns `ResolvedReport`.

`validateReportSpec` supports optional grounding context:

- `availableQueries?: string[]`
- `availableFields?: Record<string, string[]>`

When grounding context is provided, the validator can also catch:

- unknown `dataSource.query` values
- unknown widget field references for the selected query
- invalid enum-like values and missing type-specific config
- duplicate filter ids in addition to duplicate widget ids

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

The `ComponentRegistry` interface maps primitives (table, barChart, kpi, filterBar) to React components. Hosts can provide custom implementations (e.g., Ant Design, MUI) without changing the spec.

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

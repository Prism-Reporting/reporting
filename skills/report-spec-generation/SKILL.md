---
name: report-spec-generation
description: Generate Prism Reporting ReportSpec (DSL) from natural language. Use when the user wants to create or describe a report (tables, charts, filters) that will be rendered by Prism ReportRenderer.
---

# ReportSpec generation for Prism Reporting

Generate a **ReportSpec** (JSON) from a natural language description. The output must conform to the schema below so it can be passed to `ReportRenderer` from `@reporting/core` / `@reporting/react-ui`.

## Output schema (required fields)

- **id** (string): Unique report id, e.g. `"tasks-by-status"`.
- **title** (string): Human-readable report title.
- **layout** (string): Either `"singleColumn"` or `"twoColumn"`.
- **dataSources** (object): Map of source key to `{ name, query, params?, delivery?, sort?, limit? }`. The `query` value must match what the DataProvider supports (e.g. `"tasks"` for a tasks API). Use only query names the user or context provides (e.g. from `availableQueries`). Prefer `delivery.mode = "paginatedList"` for browseable tables/cards, `fullVisual` for charts and grouped summary tables, and `summary` for backend-aggregated KPI sources.
- **filters** (array): Zero or more filter specs. Each has `type`, `id`, `label`, `dataSource`, and type-specific fields:
  - **select**: `type: "select"`, `options: [{ value, label }]`, optional `groupIds`, `paramKey`, `required`, `defaultValue`.
  - **multiSelect**: `type: "multiSelect"`, `options: [{ value, label }]`, optional `groupIds`, `paramKey`, `required`, `defaultValue`.
  - **dateRange**: `type: "dateRange"`, optional `groupIds`, `paramKeyFrom`, `paramKeyTo`, `required`, `defaultValue`.
  - **search**: `type: "search"`, optional `groupIds`, `paramKey`, `placeholder`, `required`, `defaultValue`.
  - **numericRange**: `type: "numericRange"`, optional `groupIds`, `min`, `max`, `step`, `paramKeyFrom`, `paramKeyTo`, `required`, `defaultValue`.
- **widgets** (array): One or more widget specs. Each has `type`, `id`, `dataSource`, optional `title`, and `config`:
  - **table**: `type: "table"`, `config: { columns?, groupByKey?, groupLabelKey?, summary?, aggregations?, groupAggregations?, groupSummaryLabel?, grandTotalLabel?, sort?, drillDown? }`. Use `groupByKey` for grouped raw tables, `summary` for derived summary rows, and `groupAggregations` for per-group subtotals.
  - **cardView**: `type: "cardView"`, `config: { titleKey, subtitleKey?, badges?, metadata?, primaryMetric?, template?, emptyStateText? }`.
  - **barChart**: `type: "barChart"`, `config: { categoryKey, valueKey, series? }`.
  - **lineChart**: `type: "lineChart"`, `config: { categoryKey, valueKey, series? }`.
  - **areaChart**: `type: "areaChart"`, `config: { categoryKey, valueKey, series? }`.
  - **spiralChart**: `type: "spiralChart"`, `config: { categoryKey, valueKey }`.
  - **pieChart**: `type: "pieChart"`, `config: { categoryKey, valueKey }`.
  - **doughnutChart**: `type: "doughnutChart"`, `config: { categoryKey, valueKey }`.
  - **stackedBarChart**: `type: "stackedBarChart"`, `config: { categoryKey, series: [{ key, label? }] }`.
  - **funnelChart**: `type: "funnelChart"`, `config: { categoryKey, valueKey }`.
  - **scatterChart**: `type: "scatterChart"`, `config: { xKey, yKey, zKey? }`.
  - **bubbleChart**: `type: "bubbleChart"`, `config: { xKey, yKey, zKey, labelKey?, seriesKey? }`.
  - **timelineView** / **ganttChart**: `config: { startDateKey, endDateKey, labelKey, groupKey?, statusKey? }`.
  - **kpi**: `type: "kpi"`, `config: { valueKey, aggregation?, label?, format?, currencyCode?, decimalPlaces?, prefix?, suffix?, trend? }`.

- **groups** (array, optional): Logical filter scopes shaped like `{ id, label?, widgetIds }`.
- **sections** (array, optional): Titled widget groupings shaped like `{ id, title?, widgetIds, groupIds? }`.
- **tabs** (array, optional): Tabbed report groups shaped like `{ id, label, widgetIds, groupIds? }`. Tabs override sections.
- **presets** (array, optional): Saved filter states shaped like `{ id, label, filterState }`.
- **layoutOptions** (object, optional): CSS gap hints like `{ columnGap, rowGap }`.
- **version**, **refreshInterval**, **owner**, **author** are optional metadata fields.

All `dataSource` values in filters and widgets must reference a key from `dataSources`. Use stable, kebab-case ids for filters and widgets. If you use `sections`, `tabs`, or `groups`, their `widgetIds` must reference existing widget ids exactly.

## Example (tasks by status with filters)

**User request**: "I want to see all tasks grouped by status, with a filter for status and date range."

**ReportSpec**:

```json
{
  "id": "tasks-by-status",
  "title": "Tasks by Status",
  "layout": "singleColumn",
  "dataSources": {
    "tasks": {
      "name": "tasks",
      "query": "tasks"
    }
  },
  "filters": [
    {
      "type": "select",
      "id": "status",
      "label": "Status",
      "dataSource": "tasks",
      "paramKey": "status",
      "options": [
        { "value": "To Do", "label": "To Do" },
        { "value": "In Progress", "label": "In Progress" },
        { "value": "Done", "label": "Done" }
      ]
    },
    {
      "type": "dateRange",
      "id": "dateRange",
      "label": "Due Date",
      "dataSource": "tasks",
      "paramKeyFrom": "tasksFrom",
      "paramKeyTo": "tasksTo"
    }
  ],
  "widgets": [
    {
      "type": "table",
      "id": "tasks-table",
      "title": "Tasks",
      "dataSource": "tasks",
      "config": {
        "columns": [
          { "key": "name", "label": "Task" },
          { "key": "status", "label": "Status" },
          { "key": "assignee", "label": "Assignee" },
          { "key": "dueDate", "label": "Due Date" }
        ]
      }
    }
  ]
}
```

## Authoring guidance

- Prefer `fullVisual` delivery for charts, timeline/gantt, grouped summary tables, and any table using `summary` or `groupAggregations`.
- Use `groupIds` when filters should only affect one area of a report. If every widget should respond, omit `groupIds`.
- For grouped tables, use `groupByKey` plus `groupLabelKey` when the display label differs from the raw grouping key.
- When building tabs or sections, define all widgets in `widgets` first, then reference those same ids from `tabs[].widgetIds` or `sections[].widgetIds`.

## More examples

See [REFERENCE.md](REFERENCE.md) in this skill for additional examples and the full schema reference.

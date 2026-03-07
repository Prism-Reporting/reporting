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
- **dataSources** (object): Map of source key to `{ name, query, params? }`. The `query` value must match what the DataProvider supports (e.g. `"tasks"` for a tasks API). Use only query names the user or context provides (e.g. from `availableQueries`).
- **filters** (array): Zero or more filter specs. Each has `type`, `id`, `label`, `dataSource`, and type-specific fields:
  - **select**: `type: "select"`, `options: [{ value, label }]`, optional `paramKey`.
  - **dateRange**: `type: "dateRange"`, optional `paramKeyFrom`, `paramKeyTo`.
  - **search**: `type: "search"`, optional `paramKey`, `placeholder`.
- **widgets** (array): One or more widget specs. Each has `type`, `id`, `dataSource`, optional `title`, and `config`:
  - **table**: `type: "table"`, `config: { columns: [{ key, label, type? }] }` (type is `"string"` | `"number"` | `"date"`).
  - **barChart**: `type: "barChart"`, `config: { categoryKey, valueKey, series? }`.
  - **kpi**: `type: "kpi"`, `config: { valueKey, label?, format? }` (format is `"number"` | `"percent"` | `"currency"`).

All `dataSource` values in filters and widgets must reference a key from `dataSources`. Use stable, kebab-case ids for filters and widgets.

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

## More examples

See [REFERENCE.md](REFERENCE.md) in this skill for additional examples and the full schema reference.

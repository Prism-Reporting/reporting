# ReportSpec schema reference and examples

Full reference for Prism Reporting ReportSpec. Types align with `@reporting/core` ([packages/core/src/types.ts](../../packages/core/src/types.ts)).

## ReportSpec (root)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | yes | Unique report identifier (kebab-case). |
| title | string | yes | Display title. |
| layout | "singleColumn" \| "twoColumn" | yes | Layout of the report. |
| dataSources | Record<string, DataSourceSpec> | yes | Map of source key to data source spec. |
| filters | FilterSpec[] | yes | Array of filter specs (can be empty). |
| widgets | WidgetSpec[] | yes | Array of widget specs. |

## DataSourceSpec

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | yes | Logical name. |
| query | string | yes | Query name passed to DataProvider.runQuery (must match backend). |
| params | Record<string, unknown> | no | Optional default params. |

## FilterSpec (discriminated by type)

### SelectFilterSpec (type: "select")

| Field | Type | Required |
|-------|------|----------|
| type | "select" | yes |
| id | string | yes |
| label | string | yes |
| dataSource | string | yes (must be a key in dataSources) |
| options | Array<{ value: string, label: string }> | yes |
| paramKey | string | no |

### DateRangeFilterSpec (type: "dateRange")

| Field | Type | Required |
|-------|------|----------|
| type | "dateRange" | yes |
| id | string | yes |
| label | string | yes |
| dataSource | string | yes |
| paramKeyFrom | string | no |
| paramKeyTo | string | no |

### SearchFilterSpec (type: "search")

| Field | Type | Required |
|-------|------|----------|
| type | "search" | yes |
| id | string | yes |
| label | string | yes |
| dataSource | string | yes |
| paramKey | string | no |
| placeholder | string | no |

## WidgetSpec (discriminated by type)

### TableWidgetSpec (type: "table")

| Field | Type | Required |
|-------|------|----------|
| type | "table" | yes |
| id | string | yes |
| dataSource | string | yes |
| title | string | no |
| config | { columns: Array<{ key: string, label: string, type?: "string" \| "number" \| "date" }> } | yes |

### BarChartWidgetSpec (type: "barChart")

| Field | Type | Required |
|-------|------|----------|
| type | "barChart" | yes |
| id | string | yes |
| dataSource | string | yes |
| title | string | no |
| config | { categoryKey: string, valueKey: string, series?: Array<{ key: string, label: string }> } | yes (categoryKey, valueKey) |

### KpiWidgetSpec (type: "kpi")

| Field | Type | Required |
|-------|------|----------|
| type | "kpi" | yes |
| id | string | yes |
| dataSource | string | yes |
| title | string | no |
| config | { valueKey: string, label?: string, format?: "number" \| "percent" \| "currency" } | yes (valueKey) |

## Example: Bar chart by assignee

**Request**: "Show me a bar chart of work items per assignee, with a filter by assignee."

```json
{
  "id": "work-items-by-assignee",
  "title": "Work Items by Assignee",
  "layout": "singleColumn",
  "dataSources": {
    "workItems": {
      "name": "workItems",
      "query": "workItemsByAssignee"
    }
  },
  "filters": [
    {
      "type": "select",
      "id": "assignee",
      "label": "Assignee",
      "dataSource": "workItems",
      "paramKey": "assignee",
      "options": [
        { "value": "Alice", "label": "Alice" },
        { "value": "Bob", "label": "Bob" }
      ]
    }
  ],
  "widgets": [
    {
      "type": "barChart",
      "id": "assignee-chart",
      "title": "Work Items per Assignee",
      "dataSource": "workItems",
      "config": {
        "categoryKey": "assignee",
        "valueKey": "count"
      }
    }
  ]
}
```

## Example: KPI only

**Request**: "Show total count of tasks as a KPI."

```json
{
  "id": "tasks-kpi",
  "title": "Total Tasks",
  "layout": "singleColumn",
  "dataSources": {
    "tasks": {
      "name": "tasks",
      "query": "tasks"
    }
  },
  "filters": [],
  "widgets": [
    {
      "type": "kpi",
      "id": "total-tasks",
      "title": "Total Tasks",
      "dataSource": "tasks",
      "config": {
        "valueKey": "count",
        "format": "number"
      }
    }
  ]
}
```

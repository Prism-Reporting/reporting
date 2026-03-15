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
| groups | ReportGroupSpec[] | no | Optional logical scopes for filter sharing. |
| presets | ReportSpecPreset[] | no | Saved filter states. |
| layoutOptions | { columnGap?, rowGap? } | no | Optional CSS gap hints for the report grid. |
| sections | ReportSectionSpec[] | no | Optional titled widget groupings. |
| tabs | ReportTabSpec[] | no | Optional tabbed layout; overrides sections. |
| version | string | no | Optional report version. |
| refreshInterval | number | no | Host refresh interval in seconds. |
| owner | string | no | Governance/display metadata. |
| author | string | no | Display metadata. |

## DataSourceSpec

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | yes | Logical name. |
| query | string | yes | Query name passed to `DataProvider.runQuery`. |
| params | Record<string, unknown> | no | Optional default params. |
| sort | SortItem \| SortItem[] | no | In-memory post-fetch sorting. |
| limit | number | no | In-memory post-sort row limit. |
| delivery | { mode, pageSize?, maxRows? } | no | Use `paginatedList`, `fullVisual`, or `summary`. |
| pagination | { pageSize, pageParamKey? } | no | Legacy paging config. Prefer `delivery`. |

## FilterSpec

All filters require `type`, `id`, `label`, and `dataSource`. `dataSource` may be a single source key or an array of keys. `groupIds` is optional on every filter and scopes the filter to part of the report.

| Type | Important fields |
|------|------------------|
| `select` | `options`, `paramKey?`, `required?`, `defaultValue?` |
| `multiSelect` | `options`, `paramKey?`, `required?`, `defaultValue?: string[]` |
| `dateRange` | `paramKeyFrom?`, `paramKeyTo?`, `required?`, `defaultValue?: { from?, to? }` |
| `search` | `paramKey?`, `placeholder?`, `required?`, `defaultValue?` |
| `numericRange` | `min?`, `max?`, `step?`, `paramKeyFrom?`, `paramKeyTo?`, `required?`, `defaultValue?: { from?, to? }` |

## WidgetSpec

Every widget supports `id`, `dataSource`, `config`, and optional `title`, `groupIds`, `width`, `height`.

| Type | Required config | Optional highlights |
|------|------------------|---------------------|
| `table` | `columns` or `summary` | `groupByKey`, `groupLabelKey`, `summary`, `aggregations`, `groupAggregations`, `groupSummaryLabel`, `grandTotalLabel`, `sort`, `drillDown` |
| `cardView` | `titleKey` | `subtitleKey`, `badges`, `metadata`, `primaryMetric`, `template`, `emptyStateText` |
| `barChart` | `categoryKey`, `valueKey` | `series` |
| `lineChart` | `categoryKey`, `valueKey` | `series` |
| `areaChart` | `categoryKey`, `valueKey` | `series` |
| `spiralChart` | `categoryKey`, `valueKey` |  |
| `pieChart` | `categoryKey`, `valueKey` |  |
| `doughnutChart` | `categoryKey`, `valueKey` |  |
| `stackedBarChart` | `categoryKey`, `series` |  |
| `funnelChart` | `categoryKey`, `valueKey` |  |
| `scatterChart` | `xKey`, `yKey` | `zKey` |
| `bubbleChart` | `xKey`, `yKey`, `zKey` | `labelKey`, `seriesKey` |
| `timelineView` | `startDateKey`, `endDateKey`, `labelKey` | `groupKey`, `statusKey` |
| `ganttChart` | `startDateKey`, `endDateKey`, `labelKey` | `groupKey`, `statusKey` |
| `kpi` | `valueKey` | `aggregation`, `label`, `format`, `currencyCode`, `decimalPlaces`, `prefix`, `suffix`, `trend` |

## Layout and grouping primitives

- `groups`: `{ id, label?, widgetIds }`
- `sections`: `{ id, title?, widgetIds, groupIds? }`
- `tabs`: `{ id, label, widgetIds, groupIds? }`

Notes:

- `sections[].widgetIds`, `tabs[].widgetIds`, and `groups[].widgetIds` must all reference widget ids already defined in `widgets`.
- Tabs take precedence over sections.
- Section ids and tab ids also act as implicit filter scope ids, so filters can target them through `groupIds`.

## Example: Grouped table with scoped filters

```json
{
  "id": "project-milestones",
  "title": "Project Milestones",
  "layout": "twoColumn",
  "layoutOptions": {
    "columnGap": "1.25rem",
    "rowGap": "1rem"
  },
  "dataSources": {
    "milestones": {
      "name": "project-milestones",
      "query": "projectMilestones",
      "delivery": {
        "mode": "fullVisual",
        "maxRows": 1000
      }
    }
  },
  "filters": [
    {
      "type": "multiSelect",
      "id": "projectStatus",
      "label": "Project Status",
      "dataSource": "milestones",
      "groupIds": ["project-health"],
      "paramKey": "projectStatus",
      "options": [
        { "value": "on-track", "label": "On Track" },
        { "value": "at-risk", "label": "At Risk" },
        { "value": "off-track", "label": "Off Track" }
      ]
    }
  ],
  "widgets": [
    {
      "type": "table",
      "id": "milestone-summary",
      "title": "Milestones by Project",
      "dataSource": "milestones",
      "groupIds": ["project-health"],
      "config": {
        "groupByKey": "projectId",
        "groupLabelKey": "projectName",
        "columns": [
          { "key": "milestoneName", "label": "Milestone" },
          { "key": "owner", "label": "Owner" },
          { "key": "plannedDate", "label": "Planned", "type": "date" },
          { "key": "budgetVariance", "label": "Variance", "type": "number" }
        ],
        "groupAggregations": [
          { "key": "budgetVariance", "op": "sum" }
        ],
        "groupSummaryLabel": "Project subtotal",
        "aggregations": [
          { "key": "budgetVariance", "op": "sum" }
        ],
        "grandTotalLabel": "Portfolio total"
      }
    }
  ],
  "groups": [
    {
      "id": "project-health",
      "label": "Project Health",
      "widgetIds": ["milestone-summary"]
    }
  ],
  "sections": [
    {
      "id": "portfolio-section",
      "title": "Portfolio Health",
      "widgetIds": ["milestone-summary"],
      "groupIds": ["project-health"]
    }
  ]
}
```

## Example: Timeline and Gantt tabs

```json
{
  "id": "release-plan",
  "title": "Release Plan",
  "layout": "singleColumn",
  "dataSources": {
    "roadmap": {
      "name": "release-roadmap",
      "query": "releaseRoadmap",
      "delivery": {
        "mode": "fullVisual",
        "maxRows": 500
      }
    }
  },
  "filters": [
    {
      "type": "dateRange",
      "id": "window",
      "label": "Timeline Window",
      "dataSource": "roadmap",
      "paramKeyFrom": "startFrom",
      "paramKeyTo": "endTo"
    }
  ],
  "widgets": [
    {
      "type": "timelineView",
      "id": "release-timeline",
      "title": "Milestone Timeline",
      "dataSource": "roadmap",
      "config": {
        "startDateKey": "startDate",
        "endDateKey": "endDate",
        "labelKey": "milestone",
        "groupKey": "team",
        "statusKey": "status"
      }
    },
    {
      "type": "ganttChart",
      "id": "release-gantt",
      "title": "Delivery Schedule",
      "dataSource": "roadmap",
      "config": {
        "startDateKey": "startDate",
        "endDateKey": "endDate",
        "labelKey": "milestone",
        "groupKey": "workstream",
        "statusKey": "status"
      }
    }
  ],
  "tabs": [
    { "id": "timeline", "label": "Timeline", "widgetIds": ["release-timeline"] },
    { "id": "schedule", "label": "Schedule", "widgetIds": ["release-gantt"] }
  ]
}
```

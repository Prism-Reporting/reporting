# Reporting TODOs

This document captures the next reporting capabilities that should be added after the current V1.2 foundation.

## Newly implemented easy widgets

These are now low-friction options in the DSL and renderer:

- `areaChart`
- `pieChart`
- `doughnutChart`
- `funnelChart`
- `scatterChart`

Notes:

- `barChart`, `lineChart`, `stackedBarChart`, `table`, and `kpi` were already supported.
- `stackedBarChart` already covers the common "stacked column chart" use case because it renders a vertical categorical stacked bar visualization.

## Next TODOs

### 1. Summarization KPIs

Goal: allow prompts like "show total budget spend" without requiring the source query to return a single pre-aggregated row.

What needs to be added:

- KPI-level aggregation config, for example:
  - `aggregation.op`: `sum | avg | min | max | count`
  - `aggregation.key`: field to aggregate
- Optional formatting helpers for money totals:
  - `currencyCode`
  - `decimalPlaces`
  - display suffix/prefix
- Validation rules that ensure aggregated KPI fields exist on the source query
- Engine support to aggregate the full result set before rendering the KPI

Example target:

```json
{
  "type": "kpi",
  "id": "totalBudgetSpend",
  "title": "Total Budget Spend",
  "dataSource": "projectBudgets",
  "config": {
    "valueKey": "budgetSpent",
    "aggregation": { "op": "sum", "key": "budgetSpent" },
    "format": "currency",
    "currencyCode": "USD",
    "decimalPlaces": 0
  }
}
```

### 2. Raw summarization for grouped records

Goal: support prompts like "give me a raw summary of all group items" and return grouped objects such as milestone summaries with latest completion dates.

What needs to be added:

- A summary-oriented widget or response type that returns grouped object summaries instead of only chart/table primitives
- Group summary config such as:
  - `groupByKey`
  - `fields`
  - per-field summary operations like `latest`, `earliest`, `count`, `sum`, `distinct`
- Date-aware reducers for things like latest milestone completion date
- Optional nested output formatting for "project -> milestones" style breakdowns

Suggested DSL direction:

```json
{
  "type": "table",
  "id": "milestoneSummary",
  "title": "Milestone Summary",
  "dataSource": "projectMilestones",
  "config": {
    "groupByKey": "projectId",
    "summary": [
      { "key": "milestoneName", "op": "distinct" },
      { "key": "completionDate", "op": "latest" },
      { "key": "budgetSpent", "op": "sum" }
    ]
  }
}
```

### 3. Card view

Goal: support record browsing in a richer layout than a plain table.

What needs to be added:

- `cardView` widget type
- Config for title, subtitle, badges, metadata rows, and primary metric
- Optional compact and detailed card templates
- Mobile-friendly wrapping/grid behavior

### 4. Timeline / Gantt chart

Goal: support project and milestone scheduling views.

What needs to be added:

- `startDateKey`, `endDateKey`, `labelKey`, `groupKey`, `statusKey`
- Date normalization and timezone-safe rendering
- Overlap handling and long-label truncation
- Possibly a dedicated renderer instead of pure Recharts

### 5. Harder charts still pending

These are intentionally deferred because they need more custom semantics or better UX tuning:

- `timelineView` / `ganttChart`
- `spiralChart`
- `bubbleChart` with polished legends and size scaling

Some are now partially covered:

- `bubbleChart` can often be modeled with the new `scatterChart` using `zKey`
- `stackedColumnChart` is covered by `stackedBarChart`

## Recommended implementation order

1. Add KPI aggregation to support total budget spend and similar prompts
2. Add grouped raw summarization primitives for milestone/object summaries
3. Add `cardView`
4. Add `timelineView` / `ganttChart`
5. Revisit specialized charts only after the summarization semantics are in place

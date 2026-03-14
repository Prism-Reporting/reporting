# Reporting TODOs

This document captures the next reporting capabilities that should be added after the current V1.2 foundation.

## Newly implemented easy widgets

These are now low-friction options in the DSL and renderer:

- `areaChart`
- `pieChart`
- `doughnutChart`
- `funnelChart`
- `scatterChart`

## Newly implemented KPI enhancements

These are now supported for KPI widgets:

- Full-result-set aggregation via `config.aggregation` with `sum | avg | min | max | count`
- Money and numeric formatting helpers including `currencyCode` and `decimalPlaces`
- Display `prefix` / `suffix`
- Validation that aggregation fields exist on the source query
- Engine-side KPI aggregation without requiring a single pre-aggregated source row

Notes:

- `barChart`, `lineChart`, `stackedBarChart`, `table`, and `kpi` were already supported.
- `stackedBarChart` already covers the common "stacked column chart" use case because it renders a vertical categorical stacked bar visualization.

## Newly implemented grouped raw summarization

These are now supported for table widgets:

- `config.summary` reducers with `sum | avg | min | max | count | latest | earliest | distinct`
- Grouped summary rows via `config.groupByKey`
- Date-aware `latest` / `earliest` reduction for fields like milestone completion dates
- Summary-only tables that infer columns automatically when `config.columns` is omitted

Notes:

- Grouped summaries should use full-result delivery, not paginated table delivery, so reducers see the full filtered dataset.
- `distinct` returns raw arrays in resolved data; the default table renderer displays them as comma-separated values.

## Newly implemented card view

These are now supported for record-browsing widgets:

- `cardView` widget type
- Config for `titleKey`, `subtitleKey`, `badges`, `metadata`, and `primaryMetric`
- Optional `compact` and `detailed` card templates
- Responsive wrapping/grid behavior with mobile-friendly stacking
- Pagination support for card-based browsing on `paginatedList` data sources

## Next TODOs

### 1. Timeline / Gantt chart

Goal: support project and milestone scheduling views.

What needs to be added:

- `startDateKey`, `endDateKey`, `labelKey`, `groupKey`, `statusKey`
- Date normalization and timezone-safe rendering
- Overlap handling and long-label truncation
- Possibly a dedicated renderer instead of pure Recharts

### 2. Harder charts still pending

These are intentionally deferred because they need more custom semantics or better UX tuning:

- `timelineView` / `ganttChart`
- `spiralChart`
- `bubbleChart` with polished legends and size scaling

Some are now partially covered:

- `bubbleChart` can often be modeled with the new `scatterChart` using `zKey`
- `stackedColumnChart` is covered by `stackedBarChart`

## Recommended implementation order

1. Add `timelineView` / `ganttChart`
2. Revisit specialized charts only after the summarization semantics are in place

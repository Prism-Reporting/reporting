import { readFileSync } from "node:fs";
import {
  REPORT_SPEC_VERSION,
  type BaseReportingContext,
  type QueryCatalogEntry,
  type SemanticReportingContext,
  type ValidationContext,
} from "@reporting/core";

export type { BaseReportingContext, QueryCatalogEntry, SemanticReportingContext };

export interface ReportingHostContext {
  queryCatalog?: unknown;
  source?: string;
  tenantId?: string;
}

export interface NormalizedReportingHostContext {
  queryCatalog: QueryCatalogEntry[];
  source?: string;
  tenantId?: string;
}

export interface QueryCatalogLoadResult {
  queries: QueryCatalogEntry[];
  source: "env-json" | "file" | "session" | "none";
  error?: string;
}

export interface ContractResource {
  name: string;
  uri: string;
  title: string;
  description: string;
  mimeType: string;
  text: string;
}

export const supportedFilters = [
  {
    type: "select",
    description: "Single-value selection filter with explicit UI options.",
    requiredFields: ["type", "id", "label", "dataSource", "options"],
    optionalFields: ["groupIds", "paramKey", "required", "defaultValue"],
  },
  {
    type: "multiSelect",
    description: "Multi-value selection filter; value is an array, sent as comma-separated param.",
    requiredFields: ["type", "id", "label", "dataSource", "options"],
    optionalFields: ["groupIds", "paramKey", "required", "defaultValue"],
  },
  {
    type: "dateRange",
    description: "Date range filter that maps user input to from/to query params.",
    requiredFields: ["type", "id", "label", "dataSource"],
    optionalFields: ["groupIds", "paramKeyFrom", "paramKeyTo", "required", "defaultValue"],
  },
  {
    type: "search",
    description: "Free-text search filter mapped to a backend query param.",
    requiredFields: ["type", "id", "label", "dataSource"],
    optionalFields: ["groupIds", "paramKey", "placeholder", "required", "defaultValue"],
  },
  {
    type: "numericRange",
    description: "Numeric range filter with optional min/max/step; maps to two params (from/to).",
    requiredFields: ["type", "id", "label", "dataSource"],
    optionalFields: [
      "groupIds",
      "min",
      "max",
      "step",
      "paramKeyFrom",
      "paramKeyTo",
      "required",
      "defaultValue",
    ],
  },
] as const;

export const supportedWidgets = [
  {
    type: "table",
    description: "Tabular widget for raw rows or grouped summary rows. Provide config.columns for raw tables, or config.summary to derive grouped/object summaries. Optional groupByKey, groupLabelKey, aggregations, groupAggregations, sort, and drillDown. Supports grouped subtotals plus grand-total labeling.",
    requiredFields: ["type", "id", "dataSource", "config.columns or config.summary"],
    optionalFields: [
      "title",
      "groupIds",
      "width",
      "height",
      "config.groupByKey",
      "config.groupLabelKey",
      "config.summary",
      "config.aggregations",
      "config.groupAggregations",
      "config.groupSummaryLabel",
      "config.grandTotalLabel",
      "config.sort",
      "config.drillDown",
    ],
  },
  {
    type: "cardView",
    description: "Record-browsing widget rendered as responsive cards. Configure titleKey, optional subtitleKey, badges, metadata rows, and an optional primaryMetric with compact or detailed templates.",
    requiredFields: ["type", "id", "dataSource", "config.titleKey"],
    optionalFields: [
      "title",
      "groupIds",
      "width",
      "height",
      "config.subtitleKey",
      "config.badges",
      "config.metadata",
      "config.primaryMetric",
      "config.template",
      "config.emptyStateText",
    ],
  },
  {
    type: "barChart",
    description: "Bar chart widget with category and numeric value fields.",
    requiredFields: ["type", "id", "dataSource", "config.categoryKey", "config.valueKey"],
    optionalFields: ["title", "groupIds", "width", "height", "config.series"],
  },
  {
    type: "lineChart",
    description: "Line chart widget with category (x-axis) and value (y-axis); data ordered by category. Optional series for multiple lines.",
    requiredFields: ["type", "id", "dataSource", "config.categoryKey", "config.valueKey"],
    optionalFields: ["title", "groupIds", "width", "height", "config.series"],
  },
  {
    type: "areaChart",
    description: "Area chart widget with category (x-axis) and value (y-axis); optional series for multiple filled trends.",
    requiredFields: ["type", "id", "dataSource", "config.categoryKey", "config.valueKey"],
    optionalFields: ["title", "groupIds", "width", "height", "config.series"],
  },
  {
    type: "spiralChart",
    description: "Spiral chart widget with category labels and numeric values, useful for showing ranked magnitude in a more expressive radial layout.",
    requiredFields: ["type", "id", "dataSource", "config.categoryKey", "config.valueKey"],
    optionalFields: ["title", "groupIds", "width", "height"],
  },
  {
    type: "pieChart",
    description: "Pie chart widget with category labels and a numeric value per slice.",
    requiredFields: ["type", "id", "dataSource", "config.categoryKey", "config.valueKey"],
    optionalFields: ["title", "groupIds", "width", "height"],
  },
  {
    type: "doughnutChart",
    description: "Doughnut chart widget with category labels and a numeric value per slice.",
    requiredFields: ["type", "id", "dataSource", "config.categoryKey", "config.valueKey"],
    optionalFields: ["title", "groupIds", "width", "height"],
  },
  {
    type: "kpi",
    description: "Single value widget that reads one field from the first query row or aggregates the full result set. Optional trend shows a sparkline from first N rows.",
    requiredFields: ["type", "id", "dataSource", "config.valueKey"],
    optionalFields: [
      "title",
      "groupIds",
      "width",
      "height",
      "config.label",
      "config.aggregation",
      "config.format",
      "config.currencyCode",
      "config.decimalPlaces",
      "config.prefix",
      "config.suffix",
      "config.trend",
    ],
  },
  {
    type: "stackedBarChart",
    description: "Stacked bar chart: categoryKey for x-axis, series array defines one stack segment per value key.",
    requiredFields: ["type", "id", "dataSource", "config.categoryKey", "config.series"],
    optionalFields: ["title", "groupIds", "width", "height"],
  },
  {
    type: "funnelChart",
    description: "Funnel chart widget with category labels and numeric values for each stage.",
    requiredFields: ["type", "id", "dataSource", "config.categoryKey", "config.valueKey"],
    optionalFields: ["title", "groupIds", "width", "height"],
  },
  {
    type: "scatterChart",
    description: "Scatter chart widget with x/y numeric fields and optional zKey for basic size encoding.",
    requiredFields: ["type", "id", "dataSource", "config.xKey", "config.yKey"],
    optionalFields: ["title", "groupIds", "width", "height", "config.zKey"],
  },
  {
    type: "bubbleChart",
    description: "Bubble chart widget with x/y position, required zKey sizing, optional labelKey for tooltip labels, and optional seriesKey for grouped colors.",
    requiredFields: ["type", "id", "dataSource", "config.xKey", "config.yKey", "config.zKey"],
    optionalFields: ["title", "groupIds", "width", "height", "config.labelKey", "config.seriesKey"],
  },
  {
    type: "timelineView",
    description: "Timeline widget for dated items. Configure start/end date fields, a label field, and optional group/status keys to cluster milestones or roadmap entries.",
    requiredFields: ["type", "id", "dataSource", "config.startDateKey", "config.endDateKey", "config.labelKey"],
    optionalFields: ["title", "groupIds", "width", "height", "config.groupKey", "config.statusKey"],
  },
  {
    type: "ganttChart",
    description: "Gantt-style scheduling widget that shares the timeline data contract but emphasizes planned ranges and grouped tracks.",
    requiredFields: ["type", "id", "dataSource", "config.startDateKey", "config.endDateKey", "config.labelKey"],
    optionalFields: ["title", "groupIds", "width", "height", "config.groupKey", "config.statusKey"],
  },
] as const;

const reportSpecGuide = `# ReportSpec ${REPORT_SPEC_VERSION}

ReportSpec is the public DSL for AI-authored reporting in Prism Reporting. Agents should produce JSON that matches this contract, then call \`validate_report_spec\` before handing the spec to the rendering runtime.

## Authoring rules

1. Return a JSON object, not prose and not code fences.
2. Use a unique kebab-case \`id\`.
3. Set \`layout\` to \`singleColumn\` or \`twoColumn\`.
4. Define \`dataSources\` as an object keyed by data source id.
5. Every filter and widget \`dataSource\` must reference an existing key in \`dataSources\`.
6. Use only supported filter types: \`select\`, \`multiSelect\`, \`dateRange\`, \`search\`, \`numericRange\`.
7. Use only supported widget types: \`table\`, \`cardView\`, \`barChart\`, \`lineChart\`, \`areaChart\`, \`spiralChart\`, \`pieChart\`, \`doughnutChart\`, \`stackedBarChart\`, \`funnelChart\`, \`scatterChart\`, \`bubbleChart\`, \`timelineView\`, \`ganttChart\`, \`kpi\`.
8. **Filter ids must be unique** within \`filters\`; **widget ids must be unique** within \`widgets\`.
9. **Sections and tabs reference widgets by id**: Every value in \`sections[].widgetIds\` and \`tabs[].widgetIds\` must be exactly one of the \`id\` values from \`spec.widgets\`. Define all widgets in \`widgets\` first (each with a unique \`id\`), then use those same ids in \`sections\` or \`tabs\`; do not reference ids that are not in \`widgets\`.
10. Optional \`groups\` define logical filter scopes. Use \`groups[].widgetIds\` and \`groupIds\` on filters/widgets/sections/tabs when only part of the report should react to a filter.
11. When query metadata is available, use only published query names and field keys.
12. Optional \`presets\`: array of \`{ id, label, filterState }\` for saved filter states (e.g. "This quarter", "Last year"). Hosts can show a dropdown or buttons to apply a preset by setting filter state from \`preset.filterState\`.
13. Optional \`version\`: string (e.g. \`"1.0"\`, \`"2024.03"\`) for report versioning and display (e.g. "Report v1.0").
14. Optional \`refreshInterval\`: number (seconds). When set, the host should re-call \`resolveReport\` after that interval; the engine does not implement timers.
15. Optional \`owner\` and \`author\`: strings (e.g. user id or email) for governance and UI display (e.g. "Owner: {owner}", "By {author}"); pass-through only, no validation.

## Save/load reports

Hosts may persist a report by saving the spec as JSON (e.g. \`serializeReportSpecToJson(spec)\` to localStorage or a server API) and restore it by parsing with \`parseReportSpecFromJson(json)\`. No backend or database is required; persistence is the host's responsibility.

## Data source shape

Each data source value is:

\`\`\`json
{ "name": "tasks", "query": "tasks", "params": { "status": "NEW" } }
\`\`\`

- \`name\`: readable identifier within the report
- \`query\`: backend query name supported by the host
- \`params\`: optional default params merged with filter input
- \`sort\`: optional; single \`{ key: string, direction: "asc" | "desc" }\` or array of same. Applied in-memory after fetch.
- \`limit\`: optional positive integer; max rows after sort. Applied in-memory after fetch.
- \`delivery\`: optional \`{ mode: "paginatedList" | "fullVisual" | "summary", pageSize?: number, maxRows?: number }\`. Use \`paginatedList\` for table/list data, \`fullVisual\` for charts that need the full filtered dataset, and \`summary\` for KPI/aggregate queries. Full-visual queries should return either full rows or \`limitExceeded\` metadata when they cross \`maxRows\`.
- \`pagination\`: legacy optional \`{ pageSize: number, pageParamKey?: string }\`. Prefer \`delivery.mode = "paginatedList"\` for new specs.

## Filters

Each filter must have a **unique string \`id\`**, \`type\`, \`label\`, and \`dataSource\` (either one data source key or an array of keys in \`dataSources\`).

| Type       | Required fields              | Optional fields                                          |
|-----------|------------------------------|----------------------------------------------------------|
| \`select\`   | \`type\`, \`id\`, \`label\`, \`dataSource\`, \`options\` | \`groupIds\`, \`paramKey\`, \`required\`, \`defaultValue\`             |
| \`multiSelect\` | \`type\`, \`id\`, \`label\`, \`dataSource\`, \`options\` | \`groupIds\`, \`paramKey\` (sent as comma-separated), \`required\`, \`defaultValue\` (array) |
| \`dateRange\`| \`type\`, \`id\`, \`label\`, \`dataSource\`          | \`groupIds\`, \`paramKeyFrom\`, \`paramKeyTo\`, \`required\`, \`defaultValue\` |
| \`search\`   | \`type\`, \`id\`, \`label\`, \`dataSource\`          | \`groupIds\`, \`paramKey\`, \`placeholder\`, \`required\`, \`defaultValue\` |
| \`numericRange\` | \`type\`, \`id\`, \`label\`, \`dataSource\`        | \`groupIds\`, \`min\`, \`max\`, \`step\`, \`paramKeyFrom\`, \`paramKeyTo\`, \`required\`, \`defaultValue\` |

- **select** / **multiSelect**: \`options\` must be a **non-empty** array of \`{ value, label }\` objects. Do not use an empty \`options\` array.
- **dateRange**: maps user input to from/to query params.
- **search**: free-text search; \`placeholder\` is UI hint.
- **numericRange**: numeric from/to; optional \`min\`, \`max\`, \`step\`.
- **groupIds**: optional array of logical group ids. Omit it for global filters; set it when only specific widgets, sections, or tabs should respond.

## Widgets

Each widget must have a **unique string \`id\`**, \`type\`, \`dataSource\`, and \`config\` appropriate to the type.

| Type        | Required fields                           | Optional fields                                      |
|------------|-------------------------------------------|------------------------------------------------------|
| \`table\`    | \`type\`, \`id\`, \`dataSource\`, \`config.columns\` or \`config.summary\` | \`title\`, \`groupIds\`, \`width\`, \`height\`, \`config.groupByKey\`, \`config.groupLabelKey\`, \`config.summary\`, \`config.aggregations\`, \`config.groupAggregations\`, \`config.groupSummaryLabel\`, \`config.grandTotalLabel\`, \`config.sort\`, \`config.drillDown\` |
| \`cardView\` | \`type\`, \`id\`, \`dataSource\`, \`config.titleKey\` | \`title\`, \`groupIds\`, \`width\`, \`height\`, \`config.subtitleKey\`, \`config.badges\`, \`config.metadata\`, \`config.primaryMetric\`, \`config.template\`, \`config.emptyStateText\` |
| \`barChart\` | \`type\`, \`id\`, \`dataSource\`, \`config.categoryKey\`, \`config.valueKey\` | \`title\`, \`groupIds\`, \`width\`, \`height\`, \`config.series\`                          |
| \`stackedBarChart\` | \`type\`, \`id\`, \`dataSource\`, \`config.categoryKey\`, \`config.series\` | \`title\`, \`groupIds\`, \`width\`, \`height\` |
| \`lineChart\` | \`type\`, \`id\`, \`dataSource\`, \`config.categoryKey\`, \`config.valueKey\` | \`title\`, \`groupIds\`, \`width\`, \`height\`, \`config.series\` (multiple lines)       |
| \`areaChart\` | \`type\`, \`id\`, \`dataSource\`, \`config.categoryKey\`, \`config.valueKey\` | \`title\`, \`groupIds\`, \`width\`, \`height\`, \`config.series\` (multiple filled areas) |
| \`spiralChart\` | \`type\`, \`id\`, \`dataSource\`, \`config.categoryKey\`, \`config.valueKey\` | \`title\`, \`groupIds\`, \`width\`, \`height\` |
| \`pieChart\` | \`type\`, \`id\`, \`dataSource\`, \`config.categoryKey\`, \`config.valueKey\` | \`title\`, \`groupIds\`, \`width\`, \`height\` |
| \`doughnutChart\` | \`type\`, \`id\`, \`dataSource\`, \`config.categoryKey\`, \`config.valueKey\` | \`title\`, \`groupIds\`, \`width\`, \`height\` |
| \`funnelChart\` | \`type\`, \`id\`, \`dataSource\`, \`config.categoryKey\`, \`config.valueKey\` | \`title\`, \`groupIds\`, \`width\`, \`height\` |
| \`scatterChart\` | \`type\`, \`id\`, \`dataSource\`, \`config.xKey\`, \`config.yKey\` | \`title\`, \`groupIds\`, \`width\`, \`height\`, \`config.zKey\` |
| \`bubbleChart\` | \`type\`, \`id\`, \`dataSource\`, \`config.xKey\`, \`config.yKey\`, \`config.zKey\` | \`title\`, \`groupIds\`, \`width\`, \`height\`, \`config.labelKey\`, \`config.seriesKey\` |
| \`timelineView\` | \`type\`, \`id\`, \`dataSource\`, \`config.startDateKey\`, \`config.endDateKey\`, \`config.labelKey\` | \`title\`, \`groupIds\`, \`width\`, \`height\`, \`config.groupKey\`, \`config.statusKey\` |
| \`ganttChart\` | \`type\`, \`id\`, \`dataSource\`, \`config.startDateKey\`, \`config.endDateKey\`, \`config.labelKey\` | \`title\`, \`groupIds\`, \`width\`, \`height\`, \`config.groupKey\`, \`config.statusKey\` |
| \`kpi\`      | \`type\`, \`id\`, \`dataSource\`, \`config.valueKey\`  | \`title\`, \`groupIds\`, \`width\`, \`height\`, \`config.label\`, \`config.aggregation\`, \`config.format\`, \`config.currencyCode\`, \`config.decimalPlaces\`, \`config.prefix\`, \`config.suffix\`, \`config.trend\` |

- **table**: \`config.columns\` is an array of \`{ key, label, type? }\` (type: \`string\`, \`number\`, \`date\`) for raw row tables. \`config.summary\` is an optional array of \`{ key, op }\` where \`op\` is one of \`sum | avg | min | max | count | latest | earliest | distinct\`; when present, the engine derives one summary row across the whole dataset or one summary row per \`groupByKey\`. If \`config.columns\` is omitted in summary mode, columns are derived automatically. Use \`groupByKey\` to group raw rows or to build grouped summary rows; \`groupLabelKey\` sets the section/header label or alternate group field. \`config.aggregations\` adds a grand-total footer row. \`config.groupAggregations\` adds per-group subtotal rows and requires \`groupByKey\`. Optional \`groupSummaryLabel\` and \`grandTotalLabel\` customize those row labels. \`config.sort\` is optional. \`config.drillDown\` is optional: \`{ urlTemplate: string, paramKeys?: string[], target?: "_self" | "_blank" }\`; placeholders in urlTemplate (e.g. \`{id}\`) are replaced by row values (paramKeys list which row keys map to placeholders). Clicking a row opens the URL (_blank by default). Summary tables and grouped subtotal tables should use full-result delivery rather than paginatedList so reducers see the complete filtered dataset.
- **cardView**: renders each row as a card. \`config.titleKey\` is required. Optional \`subtitleKey\`, \`badges\`, and \`metadata\` are arrays of \`{ key, label? }\` bound to row fields. Optional \`primaryMetric\` is \`{ key, label?, format?, currencyCode?, decimalPlaces?, prefix?, suffix? }\` and uses the same formatting options as KPIs. Optional \`template\` is \`"compact"\` or \`"detailed"\`; omit to use \`"detailed"\`. Optional \`emptyStateText\` customizes the no-results message. \`cardView\` can use paginatedList delivery for record browsing or fullVisual for full result grids.
- **barChart**: \`categoryKey\` and \`valueKey\` are field keys from the query result.
- **stackedBarChart**: \`config.categoryKey\` for x-axis; \`config.series\` is an array of \`{ key, label? }\` (one stack segment per series key).
- **lineChart**: \`categoryKey\` (x-axis) and \`valueKey\` (y-axis); data is ordered by category. Optional \`config.series\` for multiple lines (\`{ key, label }\` per series).
- **areaChart**: same data contract as \`lineChart\`, but rendered as filled trend areas. Optional \`config.series\` for multiple areas.
- **spiralChart** / **pieChart** / **doughnutChart** / **funnelChart**: use \`categoryKey\` and \`valueKey\`.
- **scatterChart**: use \`xKey\` and \`yKey\`; optional \`zKey\` enables basic size encoding.
- **bubbleChart**: use \`xKey\`, \`yKey\`, and required \`zKey\`; optional \`labelKey\` improves tooltip labels and optional \`seriesKey\` groups bubbles by color.
- **timelineView** / **ganttChart**: use \`startDateKey\`, \`endDateKey\`, and \`labelKey\` for dated ranges. Optional \`groupKey\` clusters items into lanes/groups and optional \`statusKey\` surfaces per-item status styling.
- **kpi**: displays one value from the first row by default. Optional \`config.aggregation\`: \`{ key, op }\` with \`op\` in \`sum | avg | min | max | count\` aggregates the full result set before rendering. \`format\` (\`number\`, \`currency\`, \`percent\`, \`plain\`) supports optional \`currencyCode\`, \`decimalPlaces\`, \`prefix\`, and \`suffix\`. Optional \`config.trend\`: \`{ dataKey: string }\`; when set, a sparkline is shown from the first N rows using that dataKey (omitted if no rows).

## Presets (optional)

\`presets\` is an optional array of saved filter states. Each preset has:

- \`id\`: unique string (e.g. \`this-quarter\`)
- \`label\`: display label (e.g. "This quarter")
- \`filterState\`: object keyed by filter id with values matching filter types (string, \`{ from, to }\`, string[] for multiSelect)

The host application reads \`spec.presets\` and can render a dropdown or buttons; when the user selects a preset, set the report filter state to \`preset.filterState\` (or merge with defaults via \`getEffectiveFilterState\`).

## Groups (optional)

\`groups\` is an optional array of logical filter scopes. Each group has:

- \`id\`: unique string used by filters/widgets/sections/tabs in \`groupIds\`
- \`label\`: optional display label for host UIs
- \`widgetIds\`: array of widget ids that belong to the scope

Use groups when only part of a report should respond to a filter. Section ids and tab ids also act as implicit group ids, so a filter can target a whole section or tab by reusing that id in \`groupIds\`.

## Version and refresh

- \`version\` (optional): string such as \`"1.0"\` or \`"2024.03"\`; for display and versioning. When present, \`ResolvedReport.version\` is set so the UI can show e.g. "Report v1.0".
- \`refreshInterval\` (optional): number of seconds. When set, the **host** should re-call \`resolveReport\` after that interval (e.g. with \`setInterval\`). The engine does not implement timers. Hosts may also cache resolved data by \`spec.id\` + filterState with a TTL.

## Ownership (optional)

- \`owner\` (optional): string (e.g. user id or email) for governance; exposed on \`ResolvedReport.owner\` for UI (e.g. "Owner: {owner}").
- \`author\` (optional): string (e.g. user id or email) for display; exposed on \`ResolvedReport.author\` for UI (e.g. "By {author}").

## Audit and policy

Hosts can supply an \`onAudit\` callback to \`resolveReport(spec, dataProvider, filterState, { onAudit })\` to receive a minimal audit event (e.g. \`report_generated\`, outcome \`success\` or \`error\`) for logging. For governance, hosts can pass a \`policy\` function to \`validateReportSpec(spec, context, { policy })\` (and to the MCP server config) to enforce custom rules (e.g. max widgets, allowed query names); policy errors are merged into validation diagnostics.

## Sections (optional)

\`sections\` is an optional array that groups widgets under section headers. Each section has:

- \`id\`: unique string
- \`title\`: optional display title for the section header
- \`widgetIds\`: array of widget ids in display order; **each value must be exactly the \`id\` of an entry in \`spec.widgets\`** (no extra or invented ids).
- \`groupIds\`: optional array of logical group ids inherited by every widget in the section

If \`sections\` is present, the UI renders section headers and then widgets per section. **Widgets not listed in any section** are placed in an "Other" section at the end. If \`sections\` is absent, all widgets are rendered in \`widgets\` array order using the report \`layout\`.

## Layout options (optional)

\`layoutOptions\` is an optional object for grid styling:

- \`columnGap\`: CSS gap value between columns (e.g. \`"1rem"\`, \`"16px"\`)
- \`rowGap\`: CSS gap value between rows

The UI applies these to the report grid container. No engine logic; pass-through only.

## Widget sizing (optional)

Each widget may specify optional sizing hints applied by the UI:

- \`width\`: e.g. \`"100%"\`, \`"50%"\`, \`"400px"\`
- \`height\`: e.g. \`"200px"\`, \`"auto"\`

These are applied as inline styles (or equivalent) on the widget wrapper. Contract and types only; engine passes through.

## Tabs (optional)

\`tabs\` is an optional array for tabbed reports. Each tab has:

- \`id\`: unique string
- \`label\`: display label for the tab
- \`widgetIds\`: array of widget ids to show in that tab; **each value must be exactly the \`id\` of an entry in \`spec.widgets\`** (no extra or invented ids).
- \`groupIds\`: optional array of logical group ids inherited by every widget in the tab

When \`tabs\` is present, **tabs take precedence over sections**: \`sections\` is ignored and the report is rendered as a tab bar with one panel per tab. Each tab panel shows only its listed widgets (in \`widgetIds\` order) using the report \`layout\`. **Widgets not listed in any tab** are placed in an "Other" tab. If \`tabs\` is absent, \`sections\` (if present) or flat \`widgets\` order is used.

## Recommended repair loop

1. Read \`report-spec://v1/guide\` and \`report-spec://v1/schema\`.
2. Read the query catalog if the host publishes one.
3. Draft a ReportSpec JSON object.
4. Call \`validate_report_spec\`.
5. **If invalid, use each diagnostic's \`path\`, \`code\`, and \`suggestion\` to fix the spec, then call \`validate_report_spec\` again.**
6. Repeat until valid.
`;

/** Options for building the report generation rules text (e.g. to inject session-specific query catalog). */
export interface GetReportGenerationRulesOptions {
  /** When provided, a "Session context" section is appended with available query names and param usage. */
  queries?: QueryCatalogEntry[];
  /** Tool name agents should call when they are ready to submit a candidate report spec. */
  submissionToolName?: string;
  /** Optional description appended when submissionToolName is not validate_report_spec. */
  submissionToolDescription?: string;
  /** Whether the guide is embedded inline instead of read from report-spec:// resources. */
  inlineGuide?: boolean;
}

/**
 * Returns the full ReportSpec authoring guide (DSL rules, data source shape, filters, widgets, presets, sections, tabs, repair loop).
 * Import this in agents or MCP clients to provide report generation rules without duplicating DSL documentation.
 * When options.queries is provided, appends a session context section with available query names and a reminder that filter paramKey must match query params.
 */
export function getReportGenerationRules(options?: GetReportGenerationRulesOptions): string {
  const submissionToolName = options?.submissionToolName ?? "validate_report_spec";
  const submissionToolDescription =
    options?.submissionToolDescription ??
    (submissionToolName === "validate_report_spec"
      ? "before handing the spec to the rendering runtime."
      : "That tool validates the spec before it is applied to the rendering runtime.");
  const readGuideStep = options?.inlineGuide
    ? "1. Read the full Report DSL guide included in this prompt."
    : "1. Read `report-spec://v1/guide` and `report-spec://v1/schema`.";
  const submitStep =
    submissionToolName === "validate_report_spec"
      ? "4. Call `validate_report_spec`."
      : `4. Call \`${submissionToolName}\` with the complete report spec.`;
  const repairStep =
    submissionToolName === "validate_report_spec"
      ? "5. **If invalid, use each diagnostic's `path`, `code`, and `suggestion` to fix the spec, then call `validate_report_spec` again.**"
      : `5. **If \`${submissionToolName}\` returns an error, use the diagnostics and error message to fix the spec, then call \`${submissionToolName}\` again.**`;
  const base = reportSpecGuide
    .replace(
      "Agents should produce JSON that matches this contract, then call `validate_report_spec` before handing the spec to the rendering runtime.",
      `Agents should produce JSON that matches this contract, then call \`${submissionToolName}\`. ${submissionToolDescription}`
    )
    .replace(
      "1. Read `report-spec://v1/guide` and `report-spec://v1/schema`.",
      readGuideStep
    )
    .replace("4. Call `validate_report_spec`.", submitStep)
    .replace(
      "5. **If invalid, use each diagnostic's `path`, `code`, and `suggestion` to fix the spec, then call `validate_report_spec` again.**",
      repairStep
    );
  const queries = options?.queries;
  if (queries == null || queries.length === 0) {
    return base;
  }
  const queryNames = queries.map((q) => q.name).join(", ");
  const paramHint = queries.some((q) => q.params && q.params.length > 0)
    ? " For each data source, filter paramKey (or paramKeyFrom/paramKeyTo for date/numeric range) must match one of that query's params."
    : "";
  return `${base}

## Session context

Available query names for \`dataSources.*.query\` (use only these): ${queryNames}.${paramHint}
`;
}

const reportSpecJsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `report-spec://${REPORT_SPEC_VERSION}/schema`,
  title: `ReportSpec ${REPORT_SPEC_VERSION}`,
  type: "object",
  additionalProperties: false,
  required: ["id", "title", "layout", "dataSources", "filters", "widgets"],
  properties: {
    id: {
      type: "string",
      description: "Unique report identifier, typically kebab-case.",
    },
    title: {
      type: "string",
      description: "Human-readable report title.",
    },
    layout: {
      type: "string",
      enum: ["singleColumn", "twoColumn"],
    },
    layoutOptions: {
      type: "object",
      description: "Optional CSS gap values for the report grid.",
      additionalProperties: false,
      properties: {
        columnGap: { type: "string", description: "CSS gap between columns (e.g. 1rem, 16px)." },
        rowGap: { type: "string", description: "CSS gap between rows." },
      },
    },
    sections: {
      type: "array",
      description: "Optional sections: group widgets under titles; order in section = order in widgetIds. Widgets not in any section appear in an Other section.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "widgetIds"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          widgetIds: { type: "array", items: { type: "string" } },
          groupIds: { type: "array", items: { type: "string" } },
        },
      },
    },
    tabs: {
      type: "array",
      description: "Optional tabs: report is tabbed; each tab shows only its widgets. When present, sections are ignored. Widgets not in any tab appear in an Other tab.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "widgetIds"],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          widgetIds: { type: "array", items: { type: "string" } },
          groupIds: { type: "array", items: { type: "string" } },
        },
      },
    },
    groups: {
      type: "array",
      description: "Optional logical groups used to scope filters to subsets of widgets.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "widgetIds"],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          widgetIds: { type: "array", items: { type: "string" } },
        },
      },
    },
    dataSources: {
      type: "object",
      additionalProperties: {
        type: "object",
        additionalProperties: false,
        required: ["name", "query"],
        properties: {
          name: { type: "string" },
          query: { type: "string" },
          params: {
            type: "object",
            additionalProperties: true,
          },
          sort: {
            oneOf: [
              {
                type: "object",
                additionalProperties: false,
                required: ["key", "direction"],
                properties: {
                  key: { type: "string" },
                  direction: { type: "string", enum: ["asc", "desc"] },
                },
              },
              {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["key", "direction"],
                  properties: {
                    key: { type: "string" },
                    direction: { type: "string", enum: ["asc", "desc"] },
                  },
                },
              },
            ],
          },
          limit: { type: "integer", minimum: 1 },
          delivery: {
            type: "object",
            additionalProperties: false,
            required: ["mode"],
            properties: {
              mode: {
                type: "string",
                enum: ["paginatedList", "fullVisual", "summary"],
              },
              pageSize: { type: "integer", minimum: 1 },
              maxRows: { type: "integer", minimum: 1 },
            },
          },
          pagination: {
            type: "object",
            additionalProperties: false,
            required: ["pageSize"],
            properties: {
              pageSize: { type: "integer", minimum: 1 },
              pageParamKey: { type: "string" },
            },
          },
        },
      },
    },
    filters: {
      type: "array",
      items: {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "label", "dataSource", "options"],
            properties: {
              type: { const: "select" },
              id: { type: "string" },
              label: { type: "string" },
              dataSource: {
                oneOf: [
                  { type: "string" },
                  { type: "array", items: { type: "string" }, minItems: 1 },
                ],
              },
              groupIds: { type: "array", items: { type: "string" } },
              paramKey: { type: "string" },
              options: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["value", "label"],
                  properties: {
                    value: { type: "string" },
                    label: { type: "string" },
                  },
                },
              },
              required: { type: "boolean" },
              defaultValue: { type: "string" },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "label", "dataSource", "options"],
            properties: {
              type: { const: "multiSelect" },
              id: { type: "string" },
              label: { type: "string" },
              dataSource: {
                oneOf: [
                  { type: "string" },
                  { type: "array", items: { type: "string" }, minItems: 1 },
                ],
              },
              groupIds: { type: "array", items: { type: "string" } },
              paramKey: { type: "string" },
              options: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["value", "label"],
                  properties: {
                    value: { type: "string" },
                    label: { type: "string" },
                  },
                },
              },
              required: { type: "boolean" },
              defaultValue: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "label", "dataSource"],
            properties: {
              type: { const: "dateRange" },
              id: { type: "string" },
              label: { type: "string" },
              dataSource: {
                oneOf: [
                  { type: "string" },
                  { type: "array", items: { type: "string" }, minItems: 1 },
                ],
              },
              groupIds: { type: "array", items: { type: "string" } },
              paramKeyFrom: { type: "string" },
              paramKeyTo: { type: "string" },
              required: { type: "boolean" },
              defaultValue: {
                type: "object",
                properties: { from: { type: "string" }, to: { type: "string" } },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "label", "dataSource"],
            properties: {
              type: { const: "search" },
              id: { type: "string" },
              label: { type: "string" },
              dataSource: {
                oneOf: [
                  { type: "string" },
                  { type: "array", items: { type: "string" }, minItems: 1 },
                ],
              },
              groupIds: { type: "array", items: { type: "string" } },
              paramKey: { type: "string" },
              placeholder: { type: "string" },
              required: { type: "boolean" },
              defaultValue: { type: "string" },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "label", "dataSource"],
            properties: {
              type: { const: "numericRange" },
              id: { type: "string" },
              label: { type: "string" },
              dataSource: {
                oneOf: [
                  { type: "string" },
                  { type: "array", items: { type: "string" }, minItems: 1 },
                ],
              },
              groupIds: { type: "array", items: { type: "string" } },
              min: { type: "number" },
              max: { type: "number" },
              step: { type: "number" },
              paramKeyFrom: { type: "string" },
              paramKeyTo: { type: "string" },
              required: { type: "boolean" },
              defaultValue: {
                type: "object",
                properties: { from: { type: "number" }, to: { type: "number" } },
              },
            },
          },
        ],
      },
    },
    presets: {
      type: "array",
      description: "Optional named presets (saved filter states) for quick apply.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "filterState"],
        properties: {
          id: { type: "string", description: "Unique preset identifier." },
          label: { type: "string", description: "Display label for the preset." },
          filterState: {
            type: "object",
            additionalProperties: true,
            description: "Filter state keyed by filter id; values match filter types (string, { from, to }, string[]).",
          },
        },
      },
    },
    version: {
      type: "string",
      description: "Optional report version (e.g. '1.0', '2024.03'); for display and versioning.",
    },
    refreshInterval: {
      type: "number",
      minimum: 1,
      description: "Optional refresh interval in seconds; host should re-call resolveReport after this interval.",
    },
    owner: {
      type: "string",
      description: "Optional owner (e.g. user id or email); pass-through for governance and UI (ResolvedReport.owner).",
    },
    author: {
      type: "string",
      description: "Optional author (e.g. user id or email); pass-through for UI display (e.g. 'By {author}').",
    },
    widgets: {
      type: "array",
      items: {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "dataSource", "config"],
            properties: {
              type: { const: "table" },
              id: { type: "string" },
              title: { type: "string" },
              dataSource: { type: "string" },
              groupIds: { type: "array", items: { type: "string" } },
              width: { type: "string", description: "Optional sizing hint (e.g. 100%, 400px). Renderer clamps tables to at least 320px wide." },
              height: { type: "string", description: "Optional sizing hint. Renderer clamps tables to at least 180px tall." },
              config: {
                type: "object",
                additionalProperties: false,
                anyOf: [{ required: ["columns"] }, { required: ["summary"] }],
                properties: {
                  columns: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["key", "label"],
                      properties: {
                        key: { type: "string" },
                        label: { type: "string" },
                        type: {
                          type: "string",
                          enum: ["string", "number", "date"],
                        },
                      },
                    },
                  },
                  groupByKey: {
                    type: "string",
                    description: "Row field key to group by; resolved table will have groups.",
                  },
                  groupLabelKey: {
                    type: "string",
                    description: "Row field key for group section label; defaults to group value.",
                  },
                  summary: {
                    type: "array",
                    description: "Optional summary reducers. Without groupByKey this produces one derived row; with groupByKey it produces one summary row per group.",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["key", "op"],
                      properties: {
                        key: { type: "string" },
                        op: {
                          type: "string",
                          enum: ["sum", "avg", "min", "max", "count", "latest", "earliest", "distinct"],
                        },
                      },
                    },
                  },
                  aggregations: {
                    type: "array",
                    description: "Footer row: aggregated values for listed columns.",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["key", "op"],
                      properties: {
                        key: { type: "string" },
                        op: {
                          type: "string",
                          enum: ["sum", "avg", "min", "max", "count"],
                        },
                      },
                    },
                  },
                  groupAggregations: {
                    type: "array",
                    description: "Optional grouped subtotal aggregations. Requires groupByKey.",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["key", "op"],
                      properties: {
                        key: { type: "string" },
                        op: {
                          type: "string",
                          enum: ["sum", "avg", "min", "max", "count"],
                        },
                      },
                    },
                  },
                  groupSummaryLabel: {
                    type: "string",
                    description: "Optional label for grouped subtotal rows. Defaults to 'Subtotal'.",
                  },
                  grandTotalLabel: {
                    type: "string",
                    description: "Optional label for the grand total footer row. Defaults to 'Grand total'.",
                  },
                  sort: {
                    description: "Widget-level sort; applied after dataSource sort.",
                    oneOf: [
                      {
                        type: "object",
                        additionalProperties: false,
                        required: ["key", "direction"],
                        properties: {
                          key: { type: "string" },
                          direction: { type: "string", enum: ["asc", "desc"] },
                        },
                      },
                      {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: false,
                          required: ["key", "direction"],
                          properties: {
                            key: { type: "string" },
                            direction: { type: "string", enum: ["asc", "desc"] },
                          },
                        },
                      },
                    ],
                  },
                  drillDown: {
                    type: "object",
                    description: "Optional drill-down: open URL with row values substituted; paramKeys list which row keys map to placeholders in urlTemplate.",
                    additionalProperties: false,
                    required: ["urlTemplate"],
                    properties: {
                      urlTemplate: { type: "string", description: "URL with placeholders e.g. {id}, {taskId}." },
                      paramKeys: {
                        type: "array",
                        items: { type: "string" },
                        description: "Row keys that map to placeholders (e.g. [\"id\", \"taskId\"]).",
                      },
                      target: {
                        type: "string",
                        enum: ["_self", "_blank"],
                        description: "Open in same window (_self) or new tab (_blank; default).",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "dataSource", "config"],
            properties: {
              type: { const: "cardView" },
              id: { type: "string" },
              title: { type: "string" },
              dataSource: { type: "string" },
              groupIds: { type: "array", items: { type: "string" } },
              width: { type: "string", description: "Optional sizing hint (e.g. 100%, 400px). Renderer clamps card views to at least 320px wide." },
              height: { type: "string", description: "Optional sizing hint. Renderer clamps card views to at least 220px tall." },
              config: {
                type: "object",
                additionalProperties: false,
                required: ["titleKey"],
                properties: {
                  titleKey: { type: "string", description: "Field key used as the main card title." },
                  subtitleKey: { type: "string", description: "Optional field key rendered under the title." },
                  badges: {
                    type: "array",
                    description: "Optional badges rendered from row field values.",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["key"],
                      properties: {
                        key: { type: "string" },
                        label: { type: "string" },
                      },
                    },
                  },
                  metadata: {
                    type: "array",
                    description: "Optional metadata rows rendered as label/value pairs.",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["key"],
                      properties: {
                        key: { type: "string" },
                        label: { type: "string" },
                      },
                    },
                  },
                  primaryMetric: {
                    type: "object",
                    additionalProperties: false,
                    required: ["key"],
                    properties: {
                      key: { type: "string", description: "Field key rendered as the card's primary metric." },
                      label: { type: "string" },
                      format: {
                        type: "string",
                        enum: ["number", "percent", "currency", "plain"],
                      },
                      currencyCode: { type: "string", description: "ISO 4217 currency code (e.g. USD)." },
                      decimalPlaces: { type: "integer", minimum: 0, description: "Number of decimal places for numeric display." },
                      prefix: { type: "string", description: "Optional text displayed before the formatted metric." },
                      suffix: { type: "string", description: "Optional text displayed after the formatted metric." },
                    },
                  },
                  template: {
                    type: "string",
                    enum: ["compact", "detailed"],
                    description: "Optional card layout template. Defaults to detailed.",
                  },
                  emptyStateText: {
                    type: "string",
                    description: "Optional message shown when no rows are returned.",
                  },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "dataSource", "config"],
            properties: {
              type: { const: "barChart" },
              id: { type: "string" },
              title: { type: "string" },
              dataSource: { type: "string" },
              groupIds: { type: "array", items: { type: "string" } },
              width: { type: "string", description: "Optional sizing hint (e.g. 100%, 400px). Renderer clamps charts to at least 320px wide." },
              height: { type: "string", description: "Optional sizing hint. Renderer clamps charts to at least 260px tall." },
              config: {
                type: "object",
                additionalProperties: false,
                required: ["categoryKey", "valueKey"],
                properties: {
                  categoryKey: { type: "string" },
                  valueKey: { type: "string" },
                  series: {
                    type: "array",
                    minItems: 1,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["key", "label"],
                      properties: {
                        key: { type: "string" },
                        label: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "dataSource", "config"],
            properties: {
              type: { const: "areaChart" },
              id: { type: "string" },
              title: { type: "string" },
              dataSource: { type: "string" },
              groupIds: { type: "array", items: { type: "string" } },
              width: { type: "string", description: "Optional sizing hint (e.g. 100%, 400px). Renderer clamps charts to at least 320px wide." },
              height: { type: "string", description: "Optional sizing hint. Renderer clamps charts to at least 260px tall." },
              config: {
                type: "object",
                additionalProperties: false,
                required: ["categoryKey", "valueKey"],
                properties: {
                  categoryKey: { type: "string" },
                  valueKey: { type: "string" },
                  series: {
                    type: "array",
                    minItems: 1,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["key", "label"],
                      properties: {
                        key: { type: "string" },
                        label: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "dataSource", "config"],
            properties: {
              type: { const: "spiralChart" },
              id: { type: "string" },
              title: { type: "string" },
              dataSource: { type: "string" },
              groupIds: { type: "array", items: { type: "string" } },
              width: { type: "string", description: "Optional sizing hint (e.g. 100%, 400px). Renderer clamps charts to at least 320px wide." },
              height: { type: "string", description: "Optional sizing hint. Renderer clamps charts to at least 260px tall." },
              config: {
                type: "object",
                additionalProperties: false,
                required: ["categoryKey", "valueKey"],
                properties: {
                  categoryKey: { type: "string" },
                  valueKey: { type: "string" },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "dataSource", "config"],
            properties: {
              type: { const: "pieChart" },
              id: { type: "string" },
              title: { type: "string" },
              dataSource: { type: "string" },
              groupIds: { type: "array", items: { type: "string" } },
              width: { type: "string", description: "Optional sizing hint (e.g. 100%, 400px). Renderer clamps charts to at least 320px wide." },
              height: { type: "string", description: "Optional sizing hint. Renderer clamps charts to at least 260px tall." },
              config: {
                type: "object",
                additionalProperties: false,
                required: ["categoryKey", "valueKey"],
                properties: {
                  categoryKey: { type: "string" },
                  valueKey: { type: "string" },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "dataSource", "config"],
            properties: {
              type: { const: "doughnutChart" },
              id: { type: "string" },
              title: { type: "string" },
              dataSource: { type: "string" },
              groupIds: { type: "array", items: { type: "string" } },
              width: { type: "string", description: "Optional sizing hint (e.g. 100%, 400px). Renderer clamps charts to at least 320px wide." },
              height: { type: "string", description: "Optional sizing hint. Renderer clamps charts to at least 260px tall." },
              config: {
                type: "object",
                additionalProperties: false,
                required: ["categoryKey", "valueKey"],
                properties: {
                  categoryKey: { type: "string" },
                  valueKey: { type: "string" },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "dataSource", "config"],
            properties: {
              type: { const: "lineChart" },
              id: { type: "string" },
              title: { type: "string" },
              dataSource: { type: "string" },
              groupIds: { type: "array", items: { type: "string" } },
              width: { type: "string", description: "Optional sizing hint (e.g. 100%, 400px). Renderer clamps charts to at least 320px wide." },
              height: { type: "string", description: "Optional sizing hint. Renderer clamps charts to at least 260px tall." },
              config: {
                type: "object",
                additionalProperties: false,
                required: ["categoryKey", "valueKey"],
                properties: {
                  categoryKey: { type: "string" },
                  valueKey: { type: "string" },
                  series: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["key", "label"],
                      properties: {
                        key: { type: "string" },
                        label: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "dataSource", "config"],
            properties: {
              type: { const: "kpi" },
              id: { type: "string" },
              title: { type: "string" },
              dataSource: { type: "string" },
              groupIds: { type: "array", items: { type: "string" } },
              width: { type: "string", description: "Optional sizing hint (e.g. 100%, 400px). Renderer clamps KPI widgets to at least 180px wide." },
              height: { type: "string", description: "Optional sizing hint. Renderer clamps KPI widgets to at least 80px tall." },
              config: {
                type: "object",
                additionalProperties: false,
                required: ["valueKey"],
                properties: {
                  valueKey: { type: "string" },
                  aggregation: {
                    type: "object",
                    additionalProperties: false,
                    required: ["key", "op"],
                    properties: {
                      key: { type: "string", description: "Field key to aggregate across the full result set." },
                      op: {
                        type: "string",
                        enum: ["sum", "avg", "min", "max", "count"],
                        description: "Aggregation operation applied before rendering the KPI value.",
                      },
                    },
                  },
                  label: { type: "string" },
                  format: {
                    type: "string",
                    enum: ["number", "percent", "currency", "plain"],
                  },
                  currencyCode: { type: "string", description: "ISO 4217 currency code (e.g. USD)." },
                  decimalPlaces: { type: "integer", minimum: 0, description: "Number of decimal places for numeric display." },
                  prefix: { type: "string", description: "Optional text displayed before the formatted KPI value." },
                  suffix: { type: "string", description: "Optional text displayed after the formatted KPI value." },
                  trend: {
                    type: "object",
                    description: "Optional sparkline from first N rows using dataKey.",
                    additionalProperties: false,
                    required: ["dataKey"],
                    properties: {
                      dataKey: { type: "string", description: "Field key for trend values." },
                    },
                  },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "dataSource", "config"],
            properties: {
              type: { const: "stackedBarChart" },
              id: { type: "string" },
              title: { type: "string" },
              dataSource: { type: "string" },
              groupIds: { type: "array", items: { type: "string" } },
              width: { type: "string", description: "Optional sizing hint (e.g. 100%, 400px). Renderer clamps charts to at least 320px wide." },
              height: { type: "string", description: "Optional sizing hint. Renderer clamps charts to at least 260px tall." },
              config: {
                type: "object",
                additionalProperties: false,
                required: ["categoryKey", "series"],
                properties: {
                  categoryKey: { type: "string", description: "Field key for x-axis category." },
                  series: {
                    type: "array",
                    description: "One stack segment per series; each has key (value field) and optional label.",
                    minItems: 1,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["key"],
                      properties: {
                        key: { type: "string" },
                        label: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "dataSource", "config"],
            properties: {
              type: { const: "funnelChart" },
              id: { type: "string" },
              title: { type: "string" },
              dataSource: { type: "string" },
              groupIds: { type: "array", items: { type: "string" } },
              width: { type: "string", description: "Optional sizing hint (e.g. 100%, 400px). Renderer clamps charts to at least 320px wide." },
              height: { type: "string", description: "Optional sizing hint. Renderer clamps charts to at least 260px tall." },
              config: {
                type: "object",
                additionalProperties: false,
                required: ["categoryKey", "valueKey"],
                properties: {
                  categoryKey: { type: "string" },
                  valueKey: { type: "string" },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "dataSource", "config"],
            properties: {
              type: { const: "scatterChart" },
              id: { type: "string" },
              title: { type: "string" },
              dataSource: { type: "string" },
              groupIds: { type: "array", items: { type: "string" } },
              width: { type: "string", description: "Optional sizing hint (e.g. 100%, 400px). Renderer clamps charts to at least 320px wide." },
              height: { type: "string", description: "Optional sizing hint. Renderer clamps charts to at least 260px tall." },
              config: {
                type: "object",
                additionalProperties: false,
                required: ["xKey", "yKey"],
                properties: {
                  xKey: { type: "string" },
                  yKey: { type: "string" },
                  zKey: { type: "string" },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "dataSource", "config"],
            properties: {
              type: { const: "bubbleChart" },
              id: { type: "string" },
              title: { type: "string" },
              dataSource: { type: "string" },
              groupIds: { type: "array", items: { type: "string" } },
              width: { type: "string", description: "Optional sizing hint (e.g. 100%, 400px). Renderer clamps charts to at least 320px wide." },
              height: { type: "string", description: "Optional sizing hint. Renderer clamps charts to at least 260px tall." },
              config: {
                type: "object",
                additionalProperties: false,
                required: ["xKey", "yKey", "zKey"],
                properties: {
                  xKey: { type: "string" },
                  yKey: { type: "string" },
                  zKey: { type: "string" },
                  labelKey: { type: "string" },
                  seriesKey: { type: "string" },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "dataSource", "config"],
            properties: {
              type: { const: "timelineView" },
              id: { type: "string" },
              title: { type: "string" },
              dataSource: { type: "string" },
              groupIds: { type: "array", items: { type: "string" } },
              width: { type: "string", description: "Optional sizing hint (e.g. 100%, 400px). Renderer clamps timeline widgets to at least 320px wide." },
              height: { type: "string", description: "Optional sizing hint. Renderer clamps timeline widgets to at least 260px tall." },
              config: {
                type: "object",
                additionalProperties: false,
                required: ["startDateKey", "endDateKey", "labelKey"],
                properties: {
                  startDateKey: { type: "string" },
                  endDateKey: { type: "string" },
                  labelKey: { type: "string" },
                  groupKey: { type: "string" },
                  statusKey: { type: "string" },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "dataSource", "config"],
            properties: {
              type: { const: "ganttChart" },
              id: { type: "string" },
              title: { type: "string" },
              dataSource: { type: "string" },
              groupIds: { type: "array", items: { type: "string" } },
              width: { type: "string", description: "Optional sizing hint (e.g. 100%, 400px). Renderer clamps gantt widgets to at least 320px wide." },
              height: { type: "string", description: "Optional sizing hint. Renderer clamps gantt widgets to at least 260px tall." },
              config: {
                type: "object",
                additionalProperties: false,
                required: ["startDateKey", "endDateKey", "labelKey"],
                properties: {
                  startDateKey: { type: "string" },
                  endDateKey: { type: "string" },
                  labelKey: { type: "string" },
                  groupKey: { type: "string" },
                  statusKey: { type: "string" },
                },
              },
            },
          },
        ],
      },
    },
  },
};

const exampleBasic = {
  id: "tasks-by-status",
  title: "Tasks by Status",
  layout: "singleColumn",
  dataSources: {
    tasks: {
      name: "tasks",
      query: "tasks",
    },
  },
  filters: [
    {
      type: "select",
      id: "status",
      label: "Status",
      dataSource: "tasks",
      paramKey: "status",
      options: [
        { value: "NEW", label: "New" },
        { value: "INP", label: "In Progress" },
        { value: "CPL", label: "Complete" },
      ],
    },
  ],
  widgets: [
    {
      type: "table",
      id: "tasks-table",
      title: "Tasks",
      dataSource: "tasks",
      config: {
        columns: [
          { key: "name", label: "Task" },
          { key: "status", label: "Status" },
          { key: "assignee", label: "Assignee" },
        ],
      },
    },
  ],
};

const exampleBarChart = {
  id: "tasks-by-owner",
  title: "Tasks by Owner",
  layout: "singleColumn",
  dataSources: {
    tasksByOwner: {
      name: "tasks-by-owner",
      query: "tasksByOwner",
    },
  },
  filters: [
    {
      type: "dateRange",
      id: "dueDate",
      label: "Due Date",
      dataSource: "tasksByOwner",
      paramKeyFrom: "dueFrom",
      paramKeyTo: "dueTo",
    },
  ],
  widgets: [
    {
      type: "barChart",
      id: "tasks-by-owner-chart",
      title: "Tasks by Owner",
      dataSource: "tasksByOwner",
      config: {
        categoryKey: "owner",
        valueKey: "count",
      },
    },
  ],
};

const examplePieChart = {
  id: "tasks-by-status-share",
  title: "Tasks by Status Share",
  layout: "singleColumn",
  dataSources: {
    tasksByStatus: {
      name: "tasks-by-status",
      query: "tasksByStatus",
    },
  },
  filters: [],
  widgets: [
    {
      type: "pieChart",
      id: "tasks-by-status-pie",
      title: "Task Share by Status",
      dataSource: "tasksByStatus",
      config: {
        categoryKey: "status",
        valueKey: "count",
      },
    },
  ],
};

const exampleKpi = {
  id: "active-tasks-kpi",
  title: "Active Tasks",
  layout: "singleColumn",
  dataSources: {
    activeTasks: {
      name: "active-tasks",
      query: "activeTasksSummary",
    },
  },
  filters: [],
  widgets: [
    {
      type: "kpi",
      id: "active-tasks-count",
      title: "Active Tasks",
      dataSource: "activeTasks",
      config: {
        valueKey: "count",
        label: "Open tasks",
        format: "number",
      },
    },
  ],
};

const exampleMultiSource = {
  id: "portfolio-overview",
  title: "Portfolio Overview",
  layout: "twoColumn",
  dataSources: {
    summary: {
      name: "portfolio-summary",
      query: "portfolioSummary",
    },
    tasks: {
      name: "portfolio-tasks",
      query: "portfolioTasks",
    },
  },
  filters: [
    {
      type: "search",
      id: "portfolioSearch",
      label: "Search",
      dataSource: "tasks",
      paramKey: "search",
      placeholder: "Search task name",
    },
  ],
  widgets: [
    {
      type: "kpi",
      id: "portfolio-budget",
      title: "Budget",
      dataSource: "summary",
      config: {
        valueKey: "budget",
        format: "currency",
      },
    },
    {
      type: "table",
      id: "portfolio-tasks-table",
      title: "Portfolio Tasks",
      dataSource: "tasks",
      config: {
        columns: [
          { key: "name", label: "Task" },
          { key: "owner", label: "Owner" },
          { key: "status", label: "Status" },
        ],
      },
    },
  ],
};

const exampleGroupedTable = {
  id: "project-milestones",
  title: "Project Milestones",
  layout: "twoColumn",
  layoutOptions: {
    columnGap: "1.25rem",
    rowGap: "1rem",
  },
  dataSources: {
    milestones: {
      name: "project-milestones",
      query: "projectMilestones",
      delivery: {
        mode: "fullVisual",
        maxRows: 1000,
      },
    },
  },
  filters: [
    {
      type: "multiSelect",
      id: "projectStatus",
      label: "Project Status",
      dataSource: "milestones",
      groupIds: ["project-health"],
      paramKey: "projectStatus",
      options: [
        { value: "on-track", label: "On Track" },
        { value: "at-risk", label: "At Risk" },
        { value: "off-track", label: "Off Track" },
      ],
    },
    {
      type: "numericRange",
      id: "budgetVariance",
      label: "Budget Variance",
      dataSource: "milestones",
      groupIds: ["project-health"],
      min: -100000,
      max: 100000,
      step: 5000,
      paramKeyFrom: "budgetVarianceMin",
      paramKeyTo: "budgetVarianceMax",
    },
  ],
  widgets: [
    {
      type: "table",
      id: "milestone-summary",
      title: "Milestones by Project",
      dataSource: "milestones",
      groupIds: ["project-health"],
      width: "100%",
      config: {
        groupByKey: "projectId",
        groupLabelKey: "projectName",
        columns: [
          { key: "milestoneName", label: "Milestone" },
          { key: "owner", label: "Owner" },
          { key: "plannedDate", label: "Planned", type: "date" },
          { key: "forecastDate", label: "Forecast", type: "date" },
          { key: "budgetVariance", label: "Variance", type: "number" },
        ],
        groupAggregations: [{ key: "budgetVariance", op: "sum" }],
        groupSummaryLabel: "Project subtotal",
        aggregations: [{ key: "budgetVariance", op: "sum" }],
        grandTotalLabel: "Portfolio total",
        sort: [
          { key: "projectName", direction: "asc" },
          { key: "plannedDate", direction: "asc" },
        ],
      },
    },
  ],
  groups: [
    {
      id: "project-health",
      label: "Project Health",
      widgetIds: ["milestone-summary"],
    },
  ],
  sections: [
    {
      id: "portfolio-section",
      title: "Portfolio Health",
      widgetIds: ["milestone-summary"],
      groupIds: ["project-health"],
    },
  ],
  presets: [
    {
      id: "at-risk-only",
      label: "At Risk Only",
      filterState: {
        projectStatus: ["at-risk", "off-track"],
      },
    },
  ],
};

/** Example with select, dateRange, and search filters and table + barChart widgets. */
const exampleMixedFiltersWidgets = {
  id: "tasks-dashboard",
  title: "Tasks Dashboard",
  layout: "twoColumn",
  dataSources: {
    tasks: {
      name: "tasks",
      query: "tasks",
    },
  },
  filters: [
    {
      type: "select",
      id: "status",
      label: "Status",
      dataSource: "tasks",
      paramKey: "status",
      options: [
        { value: "NEW", label: "New" },
        { value: "INP", label: "In Progress" },
        { value: "CPL", label: "Complete" },
      ],
    },
    {
      type: "dateRange",
      id: "dueDate",
      label: "Due Date",
      dataSource: "tasks",
      paramKeyFrom: "dueFrom",
      paramKeyTo: "dueTo",
    },
    {
      type: "search",
      id: "q",
      label: "Search",
      dataSource: "tasks",
      paramKey: "q",
      placeholder: "Search tasks...",
    },
  ],
  widgets: [
    {
      type: "table",
      id: "tasks-table",
      title: "Tasks",
      dataSource: "tasks",
      config: {
        columns: [
          { key: "name", label: "Task" },
          { key: "status", label: "Status" },
          { key: "dueDate", label: "Due", type: "date" },
        ],
      },
    },
    {
      type: "barChart",
      id: "tasks-by-status-chart",
      title: "Tasks by Status",
      dataSource: "tasks",
      config: {
        categoryKey: "status",
        valueKey: "count",
      },
    },
  ],
};

const exampleTimeline = {
  id: "release-plan",
  title: "Release Plan",
  layout: "singleColumn",
  dataSources: {
    roadmap: {
      name: "release-roadmap",
      query: "releaseRoadmap",
      delivery: {
        mode: "fullVisual",
        maxRows: 500,
      },
    },
  },
  filters: [
    {
      type: "dateRange",
      id: "window",
      label: "Timeline Window",
      dataSource: "roadmap",
      paramKeyFrom: "startFrom",
      paramKeyTo: "endTo",
    },
  ],
  widgets: [
    {
      type: "timelineView",
      id: "release-timeline",
      title: "Milestone Timeline",
      dataSource: "roadmap",
      config: {
        startDateKey: "startDate",
        endDateKey: "endDate",
        labelKey: "milestone",
        groupKey: "team",
        statusKey: "status",
      },
    },
    {
      type: "ganttChart",
      id: "release-gantt",
      title: "Delivery Schedule",
      dataSource: "roadmap",
      config: {
        startDateKey: "startDate",
        endDateKey: "endDate",
        labelKey: "milestone",
        groupKey: "workstream",
        statusKey: "status",
      },
    },
  ],
  tabs: [
    {
      id: "timeline",
      label: "Timeline",
      widgetIds: ["release-timeline"],
    },
    {
      id: "schedule",
      label: "Schedule",
      widgetIds: ["release-gantt"],
    },
  ],
};

const changelog = {
  version: REPORT_SPEC_VERSION,
  status: "initial-public-contract",
  notes: [
    "Established versioned MCP resources for ReportSpec authoring.",
    "Published machine-readable schema, examples, and query-catalog resource shape.",
    "Validation now returns structured diagnostics with path, code, message, and suggestion.",
  ],
};

export const parseQueryCatalog = (input: unknown): QueryCatalogEntry[] => {
  if (Array.isArray(input)) {
    return input
      .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
      .map(normalizeQueryCatalogEntry)
      .filter((entry): entry is QueryCatalogEntry => entry !== null);
  }

  if (typeof input === "object" && input !== null) {
    const record = input as Record<string, unknown>;

    if (Array.isArray(record.queries)) {
      return parseQueryCatalog(record.queries);
    }

    return Object.entries(record)
      .map(([name, value]) => {
        if (typeof value !== "object" || value === null) {
          return normalizeQueryCatalogEntry({ name });
        }

        return normalizeQueryCatalogEntry({
          name,
          ...(value as Record<string, unknown>),
        });
      })
      .filter((entry): entry is QueryCatalogEntry => entry !== null);
  }

  return [];
};

const normalizeQueryCatalogEntry = (input: Record<string, unknown>): QueryCatalogEntry | null => {
  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    return null;
  }

  const toStringArray = (value: unknown) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : undefined;

  const fieldShape =
    typeof input.fieldShape === "object" && input.fieldShape !== null && !Array.isArray(input.fieldShape)
      ? (input.fieldShape as QueryCatalogEntry["fieldShape"])
      : undefined;
  const paramShape =
    typeof input.paramShape === "object" && input.paramShape !== null && !Array.isArray(input.paramShape)
      ? (input.paramShape as QueryCatalogEntry["paramShape"])
      : undefined;
  const fields = toStringArray(input.fields) ?? (fieldShape ? Object.keys(fieldShape) : undefined);
  const params = toStringArray(input.params) ?? (paramShape ? Object.keys(paramShape) : undefined);

  return {
    name: input.name,
    description: typeof input.description === "string" ? input.description : undefined,
    ...(fields ? { fields } : {}),
    ...(fieldShape ? { fieldShape } : {}),
    ...(params ? { params } : {}),
    ...(paramShape ? { paramShape } : {}),
    notes: typeof input.notes === "string" ? input.notes : undefined,
  };
};

export function createQueryCatalogLoadResult(
  input: unknown,
  source: QueryCatalogLoadResult["source"] = "session"
): QueryCatalogLoadResult {
  return {
    queries: parseQueryCatalog(input),
    source,
  };
}

export function normalizeReportingHostContext(input: unknown): NormalizedReportingHostContext {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return {
      queryCatalog: [],
    };
  }

  const record = input as Record<string, unknown>;

  return {
    queryCatalog: parseQueryCatalog(record.queryCatalog),
    source: typeof record.source === "string" ? record.source : undefined,
    tenantId: typeof record.tenantId === "string" ? record.tenantId : undefined,
  };
}

/**
 * Converts base reporting context from a provider into the legacy host context shape.
 * Used when a ReportingContextProvider is supplied to the session manager.
 */
export function baseContextToHostContext(base: BaseReportingContext): ReportingHostContext {
  return {
    queryCatalog: { queries: base.queries },
    source: base.source,
    tenantId: base.tenantId,
  };
}

export function loadQueryCatalogFromEnv(env: NodeJS.ProcessEnv = process.env): QueryCatalogLoadResult {
  const rawJson = env.REPORTING_QUERY_CATALOG_JSON;
  if (rawJson) {
    try {
      return {
        queries: parseQueryCatalog(JSON.parse(rawJson)),
        source: "env-json",
      };
    } catch (error) {
      return {
        queries: [],
        source: "env-json",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  const filePath = env.REPORTING_QUERY_CATALOG_PATH;
  if (filePath) {
    try {
      return {
        queries: parseQueryCatalog(JSON.parse(readFileSync(filePath, "utf8"))),
        source: "file",
      };
    } catch (error) {
      return {
        queries: [],
        source: "file",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return {
    queries: [],
    source: "none",
  };
}

export function buildValidationContext(queryCatalog: QueryCatalogEntry[]): ValidationContext {
  return {
    availableQueries: queryCatalog.map((entry) => entry.name),
    availableFields: Object.fromEntries(
      queryCatalog
        .filter((entry) => entry.fields && entry.fields.length > 0)
        .map((entry) => [entry.name, entry.fields ?? []])
    ),
  };
}

export function buildQueryCatalogResourceText(
  queryCatalogResult: QueryCatalogLoadResult,
  hostContext?: NormalizedReportingHostContext
): string {
  if (queryCatalogResult.queries.length > 0) {
    return JSON.stringify(
      {
        version: REPORT_SPEC_VERSION,
        source: queryCatalogResult.source,
        tenantId: hostContext?.tenantId,
        queries: queryCatalogResult.queries,
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      version: REPORT_SPEC_VERSION,
      source: queryCatalogResult.source,
      tenantId: hostContext?.tenantId,
      queries: [],
      note:
        "No query catalog is configured. Set REPORTING_QUERY_CATALOG_JSON or REPORTING_QUERY_CATALOG_PATH to publish tenant-specific query metadata.",
      error: queryCatalogResult.error,
      expectedShape: {
        queries: [
          {
            name: "tasks",
            description: "List tasks for reporting",
            fields: ["name", "status", "owner", "dueDate"],
            params: ["status", "dueFrom", "dueTo"],
          },
        ],
      },
    },
    null,
    2
  );
}

export function getStaticContractResources(): ContractResource[] {
  return [
    {
      name: "report-spec-guide",
      uri: `report-spec://${REPORT_SPEC_VERSION}/guide`,
      title: `ReportSpec ${REPORT_SPEC_VERSION} Guide`,
      description: "Authoring guide for valid ReportSpec documents.",
      mimeType: "text/markdown",
      text: reportSpecGuide,
    },
    {
      name: "report-spec-schema",
      uri: `report-spec://${REPORT_SPEC_VERSION}/schema`,
      title: `ReportSpec ${REPORT_SPEC_VERSION} Schema`,
      description: "Machine-readable JSON Schema for ReportSpec.",
      mimeType: "application/json",
      text: JSON.stringify(reportSpecJsonSchema, null, 2),
    },
    {
      name: "report-spec-example-basic",
      uri: `report-spec://${REPORT_SPEC_VERSION}/examples/basic`,
      title: "Basic ReportSpec Example",
      description: "Minimal valid example with one select filter and one table widget.",
      mimeType: "application/json",
      text: JSON.stringify(exampleBasic, null, 2),
    },
    {
      name: "report-spec-example-bar-chart",
      uri: `report-spec://${REPORT_SPEC_VERSION}/examples/patterns/bar-chart`,
      title: "Bar Chart ReportSpec Example",
      description: "Example using a bar chart widget and date range filter.",
      mimeType: "application/json",
      text: JSON.stringify(exampleBarChart, null, 2),
    },
    {
      name: "report-spec-example-pie-chart",
      uri: `report-spec://${REPORT_SPEC_VERSION}/examples/patterns/pie-chart`,
      title: "Pie Chart ReportSpec Example",
      description: "Example using a pie chart widget for share-of-total reporting.",
      mimeType: "application/json",
      text: JSON.stringify(examplePieChart, null, 2),
    },
    {
      name: "report-spec-example-kpi",
      uri: `report-spec://${REPORT_SPEC_VERSION}/examples/patterns/kpi`,
      title: "KPI ReportSpec Example",
      description: "Example using a KPI widget for summary reporting.",
      mimeType: "application/json",
      text: JSON.stringify(exampleKpi, null, 2),
    },
    {
      name: "report-spec-example-multi-source",
      uri: `report-spec://${REPORT_SPEC_VERSION}/examples/patterns/multi-source`,
      title: "Multi-source ReportSpec Example",
      description: "Example using multiple data sources and mixed widget types.",
      mimeType: "application/json",
      text: JSON.stringify(exampleMultiSource, null, 2),
    },
    {
      name: "report-spec-example-grouped-table",
      uri: `report-spec://${REPORT_SPEC_VERSION}/examples/patterns/grouped-table`,
      title: "Grouped Table ReportSpec Example",
      description:
        "Example using grouped table subtotals, scoped filters, groups, sections, layout options, and presets.",
      mimeType: "application/json",
      text: JSON.stringify(exampleGroupedTable, null, 2),
    },
    {
      name: "report-spec-example-mixed-filters-widgets",
      uri: `report-spec://${REPORT_SPEC_VERSION}/examples/patterns/mixed-filters-widgets`,
      title: "Mixed Filters and Widgets ReportSpec Example",
      description: "Example with select, dateRange, and search filters and table + barChart widgets.",
      mimeType: "application/json",
      text: JSON.stringify(exampleMixedFiltersWidgets, null, 2),
    },
    {
      name: "report-spec-example-timeline",
      uri: `report-spec://${REPORT_SPEC_VERSION}/examples/patterns/timeline`,
      title: "Timeline and Gantt ReportSpec Example",
      description: "Example using timelineView and ganttChart widgets with tabs.",
      mimeType: "application/json",
      text: JSON.stringify(exampleTimeline, null, 2),
    },
    {
      name: "report-spec-changelog",
      uri: `report-spec://${REPORT_SPEC_VERSION}/changelog`,
      title: `ReportSpec ${REPORT_SPEC_VERSION} Changelog`,
      description: "Version notes for the public reporting DSL contract.",
      mimeType: "application/json",
      text: JSON.stringify(changelog, null, 2),
    },
  ];
}

export function getQueryCatalogResource(
  queryCatalogResult: QueryCatalogLoadResult,
  hostContext?: NormalizedReportingHostContext
): ContractResource {
  return {
    name: "report-spec-query-catalog",
    uri: `report-spec://${REPORT_SPEC_VERSION}/query-catalog`,
    title: "Query Catalog",
    description: "Tenant-specific query metadata used for grounding generated report specs.",
    mimeType: "application/json",
    text: buildQueryCatalogResourceText(queryCatalogResult, hostContext),
  };
}

/**
 * Builds a read-only resource for optional semantic context (aliases, examples, hints).
 * For agent grounding only; must not be used to change validation rules.
 */
export function getSemanticContextResource(semantic: SemanticReportingContext): ContractResource {
  return {
    name: "report-spec-semantic-context",
    uri: `report-spec://${REPORT_SPEC_VERSION}/semantic-context`,
    title: "Semantic Context",
    description:
      "Optional aliases, examples, and clarification hints for agent grounding. Does not affect validation.",
    mimeType: "application/json",
    text: JSON.stringify(
      {
        version: REPORT_SPEC_VERSION,
        queryAliases: semantic.queryAliases ?? [],
        fieldAliases: semantic.fieldAliases ?? [],
        examples: semantic.examples ?? [],
        clarificationHints: semantic.clarificationHints ?? [],
      },
      null,
      2
    ),
  };
}

export function getContractResources(
  queryCatalogResult: QueryCatalogLoadResult,
  hostContext?: NormalizedReportingHostContext
): ContractResource[] {
  return [...getStaticContractResources(), getQueryCatalogResource(queryCatalogResult, hostContext)];
}

export function getExampleByPattern(pattern: string) {
  switch (pattern) {
    case "basic":
      return exampleBasic;
    case "barChart":
      return exampleBarChart;
    case "pieChart":
      return examplePieChart;
    case "kpi":
      return exampleKpi;
    case "multiSource":
      return exampleMultiSource;
    case "groupedTable":
      return exampleGroupedTable;
    case "mixedFiltersWidgets":
      return exampleMixedFiltersWidgets;
    case "timeline":
      return exampleTimeline;
    default:
      return null;
  }
}

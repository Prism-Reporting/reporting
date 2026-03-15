# @prism-reporting/core

Core types, validation, and report resolution primitives for Prism Reporting.

## What it includes

- `ReportSpec` types for the reporting DSL
- `validateReportSpec` for structural and context-aware validation
- `resolveReport` for executing a report against your `DataProvider`
- shared reporting context contracts used by the renderer, MCP layer, and agents
- helpers for URL state, JSON serialization, CSV export, and prompt formatting

## Install

```bash
npm install @prism-reporting/core
```

Peer dependency:

```bash
npm install react
```

## Quick example

```ts
import { resolveReport, validateReportSpec, type DataProvider, type ReportSpec } from "@prism-reporting/core";

const spec: ReportSpec = {
  id: "tasks-by-status",
  title: "Tasks by Status",
  layout: "singleColumn",
  dataSources: {
    tasks: {
      name: "tasks",
      query: "tasks",
    },
  },
  filters: [],
  widgets: [
    {
      id: "status-table",
      type: "table",
      dataSource: "tasks",
      config: {
        columns: [
          { key: "name", label: "Task" },
          { key: "status", label: "Status" },
        ],
      },
    },
  ],
};

const provider: DataProvider = {
  async runQuery() {
    return [
      { name: "Draft roadmap", status: "In Progress" },
      { name: "Review milestones", status: "Done" },
    ];
  },
};

const validation = validateReportSpec(spec);
if (!validation.valid) {
  throw new Error(validation.errors.join(", "));
}

const resolved = await resolveReport(spec, provider);
console.log(resolved.widgets[0]);
```

## Main concepts

### `ReportSpec`

The DSL describes:

- data sources and query names
- filters and filter-to-param mapping
- widgets such as tables, cards, charts, KPI, timeline, and gantt views
- layout metadata like sections, tabs, groups, and presets

### `DataProvider`

Your app implements `runQuery(...)`. The package does not talk to your database directly.

### Validation context

You can pass `availableQueries` and `availableFields` to catch bad query names and invalid field references before rendering or saving a report.

## Common exports

- `validateReportSpec`
- `resolveReport`
- `serializeFilterStateToSearchParams`
- `parseFilterStateFromSearchParams`
- `serializeReportSpecToJson`
- `parseReportSpecFromJson`
- `exportTableToCsv`

## Beta status

`@prism-reporting/core` is in beta. The DSL and validation/runtime contracts may still change.

## Links

- Repo: [Prism-Reporting/reporting](https://github.com/Prism-Reporting/reporting)
- Root docs: [README](https://github.com/Prism-Reporting/reporting/blob/main/README.md)
- Package source: [packages/core](https://github.com/Prism-Reporting/reporting/tree/main/packages/core)

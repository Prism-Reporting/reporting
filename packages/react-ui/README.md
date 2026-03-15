# @prism-reporting/react-ui

React components for rendering Prism Reporting `ReportSpec` documents.

## What it includes

- `ReportRenderer` for rendering resolved reports
- built-in widgets for tables, cards, KPI, charts, timeline, and gantt-style views
- a default component registry you can use as-is or replace gradually
- optional exported components for custom rendering scenarios

## Install

```bash
npm install @prism-reporting/react-ui @prism-reporting/core react react-dom recharts
```

## Quick example

```tsx
import { ReportRenderer } from "@prism-reporting/react-ui";
import "@prism-reporting/react-ui/style.css";

export function ReportingScreen({ report }) {
  return <ReportRenderer report={report} />;
}
```

`report` should be a resolved report object produced by `@prism-reporting/core`.

## Included widgets

- tables and grouped summary tables
- card views
- KPI tiles
- bar, stacked bar, line, area, pie, doughnut, spiral, funnel, scatter, and bubble charts
- timeline and gantt-style views

## Styling

The package exports `@prism-reporting/react-ui/style.css` for the default visual treatment.

## Good fit for

- internal reporting dashboards
- reference renderers for ReportSpec-based systems
- apps that want a working reporting UI before replacing pieces with a custom design system

## Beta status

`@prism-reporting/react-ui` is currently experimental and should be treated as a reference UI rather than a final production surface.

## Links

- Repo: [Prism-Reporting/reporting](https://github.com/Prism-Reporting/reporting)
- Root docs: [README](https://github.com/Prism-Reporting/reporting/blob/main/README.md)
- Package source: [packages/react-ui](https://github.com/Prism-Reporting/reporting/tree/main/packages/react-ui)

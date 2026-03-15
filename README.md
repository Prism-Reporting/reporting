# Reporting Platform

React report renderer and declarative spec: build report UIs from a **ReportSpec** (DSL). Use it standalone with hardcoded data or plug in your own data source or AI layer.

## Features

- **Declarative ReportSpec** — Define reports as JSON: data sources, richer filters, layout/grouping primitives, and widgets ranging from grouped tables to KPI, card, chart, timeline, and gantt views. Safe for AI generation; no raw HTML or direct UI library control.
- **Pluggable data** — Implement the `DataProvider` interface to feed data from any backend (REST, Workfront, etc.).
- **React components** — `@reporting/react-ui` renders the spec with tables, cards, charts (Recharts), timelines, tabs/sections, presets, and filter bars. Swap implementations via a component registry (e.g. Ant Design, MUI).
- **Validation & resolution** — Core engine validates specs and resolves reports with filter state and query execution.

## Repository structure

| Path | Description |
|------|-------------|
| `packages/core` | ReportSpec types, validation, resolution engine, and `DataProvider` interface. See [packages/core/README.md](packages/core/README.md) for the spec. |
| `packages/react-ui` | React components that render ReportSpec including grouped tables, cards, charts, timelines/gantt, tabs/sections, and filter bar. Depends on `@reporting/core` and Recharts. |
| `apps/storybook` | Storybook app to develop and preview the renderer. |
| `docs/` | Spec examples, natural-language → ReportSpec mappings, and org/repo setup. |

## Prerequisites

- **Node.js** ≥ 20.19
- **pnpm** (recommended) or npm

## Getting started

```bash
# Install dependencies (from repo root)
pnpm install

# Build core and React UI packages
pnpm run build

# Run Storybook (starts dev server on port 6006)
pnpm run dev
# or
pnpm run storybook
```

## Scripts (root)

| Script | Description |
|--------|-------------|
| `build` | Build `@reporting/core` and `@reporting/react-ui`. |
| `dev` / `storybook` | Start Storybook. |

## Using the renderer

1. Depend on `@reporting/core` and `@reporting/react-ui` (or use the workspace packages).
2. Define a **ReportSpec** (see [packages/core/README.md](packages/core/README.md) for the schema).
3. Implement **DataProvider** and pass it to the engine’s `resolveReport`.
4. Render the resolved report with the React UI components.

The [reporting-portfolio-example](https://github.com/Prism-Reporting/reporting-portfolio-example) repo is the primary fallback demo: it uses mocked project-portfolio data so the reporting flow is easy to understand without external system knowledge. The [reporting-workfront-example](https://github.com/Prism-Reporting/reporting-workfront-example) repo remains the advanced example for a real Adobe Workfront integration.

## Documentation

- [packages/core/README.md](packages/core/README.md) — ReportSpec schema, richer filter/widget variants, grouping/layout primitives, DataProvider, engine API.
- [packages/mcp-server/README.md](packages/mcp-server/README.md) — MCP resources/tools for agent grounding, validation, and example discovery.
- [docs/natural-language-to-spec-examples.md](docs/natural-language-to-spec-examples.md) — Example mappings from natural language to ReportSpec, including grouped tables and timeline/gantt patterns.
- [docs/product-vision.md](docs/product-vision.md) — Project intent, open source posture, and business model direction.
- [docs/GITHUB_ORG_SETUP.md](docs/GITHUB_ORG_SETUP.md) — Prism-Reporting org and repo setup.

## Topics

`reporting` · `react` · `report-renderer` · `declarative-ui` · `storybook`

# Reporting Beta Foundation

Open reporting engine and AI integration foundation built around a declarative **ReportSpec** DSL. Use it standalone with hardcoded data or plug in your own data source, renderer, or agentic workflow.

## Beta status

This project is in a very early stage.

- `@prism-reporting/core`, `@prism-reporting/agent-kit`, and `@prism-reporting/mcp-server` are currently in `beta`.
- `@prism-reporting/react-ui` is an experimental reference UI, not a production-ready reporting surface.
- Breaking changes may happen at any time during this phase.
- External code contributions are not accepted right now while the architecture is still moving quickly.
- If you really need something and it is missing, please open an issue with your use case.
- All merges are expected to go through review and pass CI.

## Stability

| Package | Status | Notes |
|------|------|------|
| `@prism-reporting/core` | Beta foundation | Core DSL, validation, and resolution primitives. |
| `@prism-reporting/agent-kit` | Beta / rapidly evolving | Main AI integration surface and prompt/runtime helpers. |
| `@prism-reporting/mcp-server` | Beta / rapidly evolving | MCP layer and validation/discovery tools. |
| `@prism-reporting/react-ui` | Experimental reference UI | Useful for demos and integration scaffolding, not yet the main differentiator. |

## Features

- **Declarative ReportSpec** — Define reports as JSON: data sources, richer filters, layout/grouping primitives, and widgets ranging from grouped tables to KPI, card, chart, timeline, and gantt views. Safe for AI generation; no raw HTML or direct UI library control.
- **Pluggable data** — Implement the `DataProvider` interface to feed data from any backend (REST, Workfront, etc.).
- **React components** — `@prism-reporting/react-ui` renders the spec with tables, cards, charts (Recharts), timelines, tabs/sections, presets, and filter bars. Swap implementations via a component registry (e.g. Ant Design, MUI).
- **Validation & resolution** — Core engine validates specs and resolves reports with filter state and query execution.
- **Agent kit** — `@prism-reporting/agent-kit` loads AgentSkills-compatible workflows, builds prompt context from the shared reporting contracts, and exposes local report-generation tools for app integrations.

## Repository structure

| Path | Description |
|------|-------------|
| `packages/core` | ReportSpec types, validation, resolution engine, and `DataProvider` interface. See [packages/core/README.md](packages/core/README.md) for the spec. |
| `packages/agent-kit` | Agent runtime helpers, generated AgentSkills support, and local report-generation tools built on top of the shared reporting context. |
| `packages/react-ui` | React components that render ReportSpec including grouped tables, cards, charts, timelines/gantt, tabs/sections, and filter bar. Depends on `@prism-reporting/core` and Recharts. |
| `packages/mcp-server` | MCP resources and tools for report generation, validation, and query metadata discovery. |
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
| `build` | Build `@prism-reporting/core`, `@prism-reporting/react-ui`, `@prism-reporting/mcp-server`, and `@prism-reporting/agent-kit`. |
| `test` | Run the package tests that currently exist for `@prism-reporting/core`, `@prism-reporting/mcp-server`, and `@prism-reporting/agent-kit`. |
| `ci` | Run the root build and test checks together. |
| `dev` / `storybook` | Start Storybook. |

## Using the renderer

1. Depend on `@prism-reporting/core` and `@prism-reporting/react-ui` (or use the workspace packages).
2. Define a **ReportSpec** (see [packages/core/README.md](packages/core/README.md) for the schema).
3. Implement **DataProvider** and pass it to the engine’s `resolveReport`.
4. Render the resolved report with the React UI components.

The [reporting-portfolio-example](https://github.com/Prism-Reporting/reporting-portfolio-example) repo is the primary fallback demo: it uses mocked project-portfolio data so the reporting flow is easy to understand without external system knowledge. The [reporting-workfront-example](https://github.com/Prism-Reporting/reporting-workfront-example) repo remains the advanced example for a real Adobe Workfront integration.

## Documentation

- [packages/core/README.md](packages/core/README.md) — ReportSpec schema, richer filter/widget variants, grouping/layout primitives, DataProvider, engine API.
- [packages/agent-kit](packages/agent-kit) — Agent runtime helpers, generated skills, and local report-generation tools.
- [packages/mcp-server/README.md](packages/mcp-server/README.md) — MCP resources/tools for agent grounding, validation, and example discovery.
- [docs/natural-language-to-spec-examples.md](docs/natural-language-to-spec-examples.md) — Example mappings from natural language to ReportSpec, including grouped tables and timeline/gantt patterns.
- [docs/product-vision.md](docs/product-vision.md) — Project intent, open source posture, and business model direction.
- [docs/GITHUB_ORG_SETUP.md](docs/GITHUB_ORG_SETUP.md) — Prism-Reporting org and repo setup.
- [docs/release-process.md](docs/release-process.md) — Beta release flow, tag-based publishing, and npm publish expectations.

## Contribution policy

This repository is public so the direction is visible early, but we are not accepting external pull requests at this time.

- Open an issue for bugs, missing capabilities, and integration blockers.
- Include reproduction details or concrete use cases whenever possible.
- Unsolicited PRs may be closed without review while the architecture is still changing.
- See [CONTRIBUTING.md](CONTRIBUTING.md) for the current contribution and review policy.

## Topics

`reporting` · `react` · `report-renderer` · `declarative-ui` · `storybook`

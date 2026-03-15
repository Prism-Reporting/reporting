# @prism-reporting/mcp-server

MCP server utilities for exposing Prism Reporting guidance, validation, examples, and query metadata to AI clients.

## What it includes

- a standalone HTTP MCP server
- MCP tools for validating `ReportSpec` payloads
- resources for the reporting DSL guide, schema, examples, changelog, and query catalog
- helpers for wiring host query metadata and semantic context into MCP sessions

## Install

```bash
npm install @prism-reporting/mcp-server @prism-reporting/core
```

## Quick start

Run the standalone server:

```bash
npx reporting-mcp
```

By default it listens on `http://127.0.0.1:7071/mcp`.

You can override the port with:

```bash
REPORTING_MCP_PORT=8080 npx reporting-mcp
```

## Typical tools

- `get_report_spec_guide`
- `validate_report_spec`
- `list_supported_widgets`
- `list_supported_filters`
- `get_report_spec_example`
- `list_available_queries`
- `describe_query`

## Example integration

```ts
import { createReportingMcpSessionManager } from "@prism-reporting/mcp-server";

const sessionManager = createReportingMcpSessionManager({
  contextProvider: {
    async getBaseContext() {
      return {
        source: "my-app",
        queries: [
          {
            name: "tasks",
            description: "List tasks for reporting",
            fields: ["name", "status", "owner"],
          },
        ],
      };
    },
  },
});
```

## When to use this package

Use it when you want an LLM or MCP client to:

- understand the supported Prism Reporting DSL
- validate generated report specs before applying them
- inspect published query metadata from your app
- work from versioned examples instead of ad hoc prompt text

## Beta status

`@prism-reporting/mcp-server` is in beta and may evolve quickly as the reporting/agent workflow matures.

## Links

- Repo: [Prism-Reporting/reporting](https://github.com/Prism-Reporting/reporting)
- Root docs: [README](https://github.com/Prism-Reporting/reporting/blob/main/README.md)
- Package source: [packages/mcp-server](https://github.com/Prism-Reporting/reporting/tree/main/packages/mcp-server)

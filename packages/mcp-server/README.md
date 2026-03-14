# @reporting/mcp-server

MCP server that exposes tools for Prism Reporting:

- **Resources** — Versioned ReportSpec guide, schema, examples, changelog, and query catalog.
- **validate_report_spec** — Validate a ReportSpec object with `@reporting/core`.
- **list_supported_widgets** — Discover the widget primitives supported by the DSL.
- **list_supported_filters** — Discover the filter primitives supported by the DSL.
- **get_report_spec_example** — Fetch a valid example for a common pattern.
- **list_available_queries** — Read tenant-specific query metadata published by the host.
- **describe_query** — Inspect one tenant-specific query definition.

## Prerequisites

- Node.js >= 18
- Built `@reporting/core` (from repo root: `npm run build`).

## Setup

1. Run the server over HTTP:

```bash
npm start
```

By default the server listens on `http://127.0.0.1:7071/mcp`. Override the port with `REPORTING_MCP_PORT`.

## Resources

The server publishes versioned resources under `report-spec://v1/...`:

- `report-spec://v1/guide`
- `report-spec://v1/schema`
- `report-spec://v1/examples/basic`
- `report-spec://v1/examples/patterns/bar-chart`
- `report-spec://v1/examples/patterns/pie-chart`
- `report-spec://v1/examples/patterns/kpi`
- `report-spec://v1/examples/patterns/multi-source`
- `report-spec://v1/changelog`
- `report-spec://v1/query-catalog`

## Tools

- **validate_report_spec**  
  - `spec` (object): ReportSpec to validate.
  - `availableQueries?` (string[]): Optional query names for validation.
  - `availableFields?` (Record<string, string[]>): Optional field names by query.
  - Returns `{ version, valid, errors, diagnostics }`. When the server is created with a `policy` option (see below), the policy is run after structural validation and any policy errors are merged into the response.

- **list_supported_widgets**
  - Returns supported widget types and required fields.

- **list_supported_filters**
  - Returns supported filter types and required fields.

- **get_report_spec_example**
  - `pattern` (`basic` | `barChart` | `pieChart` | `kpi` | `multiSource`): Example pattern to fetch.

- **list_available_queries**
  - Returns query metadata configured by the host.

- **describe_query**
  - `name` (string): Query name to inspect.
  - Returns the query definition, including fields and params when available.

## Policy (governance)

When creating the MCP server you can pass an optional **policy** so `validate_report_spec` enforces host rules (e.g. max widgets, allowed query names). Pass a third argument to `createReportingMcpServer`:

```ts
import { createReportingMcpServer } from "@reporting/mcp-server";
import type { ReportSpec, PolicyResult } from "@reporting/core";

const policy = (spec: ReportSpec): PolicyResult => {
  const errors: { code: string; message: string }[] = [];
  if (spec.widgets.length > 10) {
    errors.push({ code: "max-widgets", message: "At most 10 widgets allowed." });
  }
  return { allowed: errors.length === 0, errors };
};

const { mcpServer } = createReportingMcpServer(hostContext, semanticContext, { policy });
```

Policy errors are merged into the validation diagnostics and set `valid: false` when the policy returns `allowed: false`.

## Session Host Context

Query metadata is session-scoped. The **preferred integration** is to pass a **reporting context provider** (`ReportingContextProvider` from `@reporting/core`) when creating the session manager or standalone server. The MCP layer then obtains base context (and optional semantic context) from the provider for each new session and uses it for the query catalog resource, `list_available_queries`, `describe_query`, and validation defaults for `validate_report_spec`. Validation rules are driven by **base context only**; semantic context is for agent grounding and does not change validation.

**Preferred (context provider):**

```ts
import { createReportingMcpSessionManager } from "@reporting/mcp-server";
import type { ReportingContextProvider } from "@reporting/core";

const provider: ReportingContextProvider = {
  getBaseContext: async () => ({ source: "my-app", queries: [...] }),
  getSemanticContext: async () => ({ queryAliases: [], examples: [] }) ?? null,
};

const sessionManager = createReportingMcpSessionManager({
  contextProvider: provider,
  // optional: getContextProviderInput: (req) => ({ tenantId: req.headers["x-tenant-id"] }),
});
```

**Legacy / fallback:** The `x-reporting-host-context` header is **deprecated**. It is only used when no context provider is supplied (or when the provider fails). **Migration:** Implement a `ReportingContextProvider` (from `@reporting/core`) that returns the same base—and optional semantic—context you previously sent in the header, and pass it as `contextProvider` to `createReportingMcpSessionManager` or `startStandaloneReportingMcpHttpServer`.

Expected header shape (legacy):

```json
{
  "source": "reporting-starter-example",
  "tenantId": "demo-tenant",
  "queryCatalog": {
    "queries": [
      {
        "name": "tasks",
        "description": "List tasks for reporting",
        "fields": ["name", "status", "owner", "dueDate"],
        "params": ["status", "dueFrom", "dueTo"]
      }
    ]
  }
}
```

When session context is present (from provider or legacy header):

- `report-spec://v1/query-catalog` reflects that session's query metadata
- `list_available_queries` and `describe_query` resolve against that session's catalog
- `validate_report_spec` uses the session catalog as its default validation context (base context only)

## Query Catalog Fallback

For local standalone development, the server still supports environment-variable fallback when no session host context is provided:

- `REPORTING_QUERY_CATALOG_JSON`: Inline JSON string.
- `REPORTING_QUERY_CATALOG_PATH`: Path to a JSON file on disk.

Expected shape:

```json
{
  "queries": [
    {
      "name": "tasks",
      "description": "List tasks for reporting",
      "fields": ["name", "status", "owner", "dueDate"],
      "params": ["status", "dueFrom", "dueTo"]
    }
  ]
}
```

When a query catalog is present, `validate_report_spec` also checks:

- `dataSources[*].query` uses a published query name
- widget field references use fields known for that query

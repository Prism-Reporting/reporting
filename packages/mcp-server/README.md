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

1. Run the server over stdio (for Claude Desktop, Cursor, or other MCP clients):

```bash
npm start
# or
node dist/index.js
```

Configure your MCP client to run this command (e.g. in Cursor MCP settings or Claude Desktop config).

## Resources

The server publishes versioned resources under `report-spec://v1/...`:

- `report-spec://v1/guide`
- `report-spec://v1/schema`
- `report-spec://v1/examples/basic`
- `report-spec://v1/examples/patterns/bar-chart`
- `report-spec://v1/examples/patterns/kpi`
- `report-spec://v1/examples/patterns/multi-source`
- `report-spec://v1/changelog`
- `report-spec://v1/query-catalog`

## Tools

- **validate_report_spec**  
  - `spec` (object): ReportSpec to validate.
  - `availableQueries?` (string[]): Optional query names for validation.
  - `availableFields?` (Record<string, string[]>): Optional field names by query.
  - Returns `{ version, valid, errors, diagnostics }`.

- **list_supported_widgets**
  - Returns supported widget types and required fields.

- **list_supported_filters**
  - Returns supported filter types and required fields.

- **get_report_spec_example**
  - `pattern` (`basic` | `barChart` | `kpi` | `multiSource`): Example pattern to fetch.

- **list_available_queries**
  - Returns query metadata configured by the host.

- **describe_query**
  - `name` (string): Query name to inspect.
  - Returns the query definition, including fields and params when available.

## Query Catalog Configuration

To ground report generation against real tenant data, publish a query catalog with one of these environment variables:

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

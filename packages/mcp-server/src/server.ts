import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { REPORT_SPEC_VERSION, validateReportSpec } from "@reporting/core";
import {
  buildValidationContext,
  createQueryCatalogLoadResult,
  getContractResources,
  getExampleByPattern,
  getSemanticContextResource,
  normalizeReportingHostContext,
  supportedFilters,
  supportedWidgets,
  type ReportingHostContext,
  type SemanticReportingContext,
} from "./contract.js";

const jsonResult = (payload: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: JSON.stringify(payload, null, 2),
    },
  ],
});

export function createReportingMcpServer(
  hostContextInput?: ReportingHostContext,
  semanticContext?: SemanticReportingContext | null
) {
  const hostContext = normalizeReportingHostContext(hostContextInput);
  const queryCatalogResult = createQueryCatalogLoadResult(
    { queries: hostContext.queryCatalog },
    hostContext.source ? "session" : "none"
  );
  const baseValidationContext = buildValidationContext(queryCatalogResult.queries);
  const contractResources = [...getContractResources(queryCatalogResult, hostContext)];
  if (semanticContext != null) {
    contractResources.push(getSemanticContextResource(semanticContext));
  }

  const mcpServer = new McpServer({
    name: "reporting-mcp-server",
    version: "0.1.0",
  });

  for (const resource of contractResources) {
    mcpServer.registerResource(
      resource.name,
      resource.uri,
      {
        title: resource.title,
        description: resource.description,
        mimeType: resource.mimeType,
      },
      async () => ({
        contents: [
          {
            uri: resource.uri,
            mimeType: resource.mimeType,
            text: resource.text,
          },
        ],
      })
    );
  }

  mcpServer.registerTool(
    "validate_report_spec",
    {
      title: "Validate Report Spec",
      description:
        "Validate a ReportSpec object against the Prism Reporting DSL contract. Returns versioned validation diagnostics.",
      inputSchema: {
        spec: z.record(z.unknown()).describe("ReportSpec object to validate"),
        availableQueries: z
          .array(z.string())
          .optional()
          .describe("Optional query names to validate dataSource.query against."),
        availableFields: z
          .record(z.array(z.string()))
          .optional()
          .describe("Optional field names by query for validating widget keys."),
      },
    },
    async ({ spec, availableQueries, availableFields }) => {
      try {
        const validation = validateReportSpec(
          spec as unknown as import("@reporting/core").ReportSpec,
          {
            availableQueries: availableQueries ?? baseValidationContext.availableQueries,
            availableFields: availableFields ?? baseValidationContext.availableFields,
          }
        );
        return jsonResult(validation);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({
          version: REPORT_SPEC_VERSION,
          valid: false,
          errors: [message],
          diagnostics: [
            {
              path: "$",
              code: "validation-exception",
              message,
              severity: "error",
              suggestion: "Inspect the input payload and retry validation.",
            },
          ],
        });
      }
    }
  );

  mcpServer.registerTool(
    "list_supported_widgets",
    {
      title: "List Supported Widgets",
      description: "List the widget primitives supported by the ReportSpec DSL.",
    },
    async () =>
      jsonResult({
        version: REPORT_SPEC_VERSION,
        widgets: supportedWidgets,
      })
  );

  mcpServer.registerTool(
    "list_supported_filters",
    {
      title: "List Supported Filters",
      description: "List the filter primitives supported by the ReportSpec DSL.",
    },
    async () =>
      jsonResult({
        version: REPORT_SPEC_VERSION,
        filters: supportedFilters,
      })
  );

  mcpServer.registerTool(
    "get_report_spec_example",
    {
      title: "Get Report Spec Example",
      description: "Return a valid example ReportSpec for a common reporting pattern.",
      inputSchema: {
        pattern: z
          .enum(["basic", "barChart", "kpi", "multiSource"])
          .describe("The example pattern to retrieve."),
      },
    },
    async ({ pattern }) =>
      jsonResult({
        version: REPORT_SPEC_VERSION,
        pattern,
        example: getExampleByPattern(pattern),
      })
  );

  mcpServer.registerTool(
    "list_available_queries",
    {
      title: "List Available Queries",
      description:
        "List tenant-specific queries published by the host for grounding report generation.",
    },
    async () =>
      jsonResult({
        version: REPORT_SPEC_VERSION,
        source: queryCatalogResult.source,
        tenantId: hostContext.tenantId,
        queries: queryCatalogResult.queries,
      })
  );

  mcpServer.registerTool(
    "describe_query",
    {
      title: "Describe Query",
      description:
        "Return tenant-specific query metadata, including fields and params when available.",
      inputSchema: {
        name: z.string().describe("Query name to inspect."),
      },
    },
    async ({ name }) => {
      const query = queryCatalogResult.queries.find((entry) => entry.name === name);

      return jsonResult({
        version: REPORT_SPEC_VERSION,
        found: Boolean(query),
        query,
        availableQueryNames: query
          ? undefined
          : queryCatalogResult.queries.map((entry) => entry.name),
      });
    }
  );

  return {
    mcpServer,
    hostContext,
    queryCatalogResult,
  };
}

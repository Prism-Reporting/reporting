import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  REPORT_SPEC_VERSION,
  validateReportSpec,
  type PolicyResult,
  type ReportSpec,
} from "@prism-reporting/core";
import {
  buildValidationContext,
  createQueryCatalogLoadResult,
  getContractResources,
  getExampleByPattern,
  getReportGenerationRules,
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

export interface ReportingMcpServerOptions {
  /** Optional policy check; when provided, validate_report_spec runs it after structural validation and merges policy errors into the response. */
  policy?: (spec: ReportSpec) => PolicyResult;
}

export function createReportingMcpServer(
  hostContextInput?: ReportingHostContext,
  semanticContext?: SemanticReportingContext | null,
  options?: ReportingMcpServerOptions
) {
  const policy = options?.policy;
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
    "get_report_spec_guide",
    {
      title: "Get Report Spec Guide",
      description:
        "Load the full ReportSpec authoring guide: DSL structure, required fields, delivery modes, filters, widgets, groups, presets, sections, tabs, timeline/gantt patterns, and repair loop. Call this first before building or modifying a report so you know exactly how the report must be generated and what each part means.",
    },
    async () => ({
      content: [
        {
          type: "text" as const,
          text: getReportGenerationRules({ queries: queryCatalogResult.queries }),
        },
      ],
    })
  );

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
      const specId =
        spec != null && typeof spec === "object" && "id" in spec
          ? (spec as { id?: string }).id
          : undefined;

      function buildValidationTrace(
        outcome: "valid" | "invalid",
        diagnosticCount: number,
        diagnostics: Array<{ code: string; suggestion?: string }>
      ) {
        const trace = {
          timestamp: new Date().toISOString(),
          specId,
          outcome,
          diagnosticCount,
        };
        const repairSuggestions =
          outcome === "invalid"
            ? diagnostics
                .map((d) => d.suggestion)
                .filter((s): s is string => s != null && s !== "")
            : undefined;
        const errorCodeSummary =
          outcome === "invalid"
            ? (diagnostics.reduce(
                (acc, d) => {
                  acc[d.code] = (acc[d.code] ?? 0) + 1;
                  return acc;
                },
                {} as Record<string, number>
              ) as Record<string, number>)
            : undefined;
        return { trace, repairSuggestions, errorCodeSummary };
      }

      try {
        const validation = validateReportSpec(
          spec as unknown as ReportSpec,
          {
            availableQueries: availableQueries ?? baseValidationContext.availableQueries,
            availableFields: availableFields ?? baseValidationContext.availableFields,
          },
          policy ? { policy } : undefined
        );
        const outcome = validation.valid ? ("valid" as const) : ("invalid" as const);
        const { trace, repairSuggestions, errorCodeSummary } = buildValidationTrace(
          outcome,
          validation.diagnostics.length,
          validation.diagnostics
        );
        return jsonResult({
          ...validation,
          trace,
          ...(repairSuggestions != null && { repairSuggestions }),
          ...(errorCodeSummary != null && { errorCodeSummary }),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const diagnostics = [
          {
            path: "$",
            code: "validation-exception",
            message,
            severity: "error" as const,
            suggestion: "Inspect the input payload and retry validation.",
          },
        ];
        const { trace, repairSuggestions, errorCodeSummary } = buildValidationTrace(
          "invalid",
          1,
          diagnostics
        );
        return jsonResult({
          version: REPORT_SPEC_VERSION,
          valid: false,
          errors: [message],
          diagnostics,
          trace,
          repairSuggestions,
          errorCodeSummary,
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
          .enum([
            "basic",
            "barChart",
            "pieChart",
            "kpi",
            "multiSource",
            "groupedTable",
            "mixedFiltersWidgets",
            "timeline",
          ])
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

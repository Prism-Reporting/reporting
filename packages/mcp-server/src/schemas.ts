import { z } from "zod";

/**
 * Schema for the "report-spec" UI message data part (type data-report-spec).
 * Use with AI SDK validateUIMessages: dataSchemas: { "report-spec": reportSpecDataPartSchema }.
 */
export const reportSpecDataPartSchema = z.object({
  spec: z.record(z.unknown()).optional(),
  validationMeta: z.record(z.unknown()).optional(),
});

/**
 * Tool input schemas for the reporting MCP server.
 * Use with @ai-sdk/mcp client: client.tools({ schemas: reportingMcpToolSchemas }).
 * Or omit schemas and use client.tools() for schema discovery.
 */
export const reportingMcpToolSchemas = {
  validate_report_spec: {
    inputSchema: z.object({
      spec: z.record(z.unknown()).describe("ReportSpec object to validate"),
      availableQueries: z.array(z.string()).optional(),
      availableFields: z.record(z.array(z.string())).optional(),
    }),
  },
  list_supported_widgets: { inputSchema: z.object({}) },
  list_supported_filters: { inputSchema: z.object({}) },
  get_report_spec_example: {
    inputSchema: z.object({
      pattern: z.enum(["basic", "barChart", "pieChart", "kpi", "multiSource"]).optional(),
    }),
  },
  list_available_queries: { inputSchema: z.object({}) },
  describe_query: {
    inputSchema: z.object({
      name: z.string().describe("Query name to inspect."),
    }),
  },
} as const;

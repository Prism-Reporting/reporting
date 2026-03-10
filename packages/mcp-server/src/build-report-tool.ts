import type { ReportSpec } from "@reporting/core";
import { validateReportSpec, type ValidationContext } from "@reporting/core";
import { z } from "zod";

export { buildValidationContext } from "./contract.js";

/**
 * Context required to execute the generic build_report tool.
 * Clients provide these so the tool can run in any environment (AI SDK, LangChain, etc.).
 */
export interface BuildReportToolContext {
  /**
   * Validate the spec via the reporting MCP server (or equivalent).
   * Typically: (spec) => mcpServer.callTool('validate_report_spec', { spec }) then parse first result.
   */
  validateReportSpecViaMcp(spec: unknown): Promise<{
    valid: boolean;
    diagnostics?: Array<{ message: string }>;
  }>;
  /** Local validation context (availableQueries, availableFields). Use buildValidationContext(queryCatalog) from contract. */
  validationContext: ValidationContext;
  /** Optional metadata attached to the tool result for tracing (model, MCP URL, etc.). */
  meta?: Record<string, unknown>;
}

const dslSchema = z.object({
  dsl: z.string().describe("ReportSpec JSON or markdown code block containing ReportSpec"),
});

export type BuildReportToolInput = z.infer<typeof dslSchema>;

function parseJson(input: string): unknown {
  const t = (typeof input === "string" ? input : "").trim();
  const raw = t.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim() ?? t;
  try {
    return JSON.parse(raw);
  } catch {
    const i = raw.indexOf("{");
    const j = raw.lastIndexOf("}");
    if (i >= 0 && j > i) return JSON.parse(raw.slice(i, j + 1));
    throw new Error("Invalid JSON");
  }
}

/**
 * Generic definition for the build_report tool (SDK-agnostic).
 * Use this to create a tool in your runtime: pass this definition's execute to your
 * framework's tool API (e.g. AI SDK tool(), LangChain, etc.) and provide context at call time.
 *
 * Example (Vercel AI SDK):
 *   const def = getBuildReportToolDefinition();
 *   const buildReport = tool({
 *     description: def.description,
 *     parameters: def.parametersSchema,
 *     execute: (args) => def.execute(args, context),
 *   });
 */
export function getBuildReportToolDefinition() {
  return {
    name: "build_report" as const,
    description:
      "Submit final ReportSpec JSON. Ensure you have loaded the report spec guide first (call get_report_spec_guide) to get the full authoring guide and exact spec shape; then build or modify the report according to that guide. Call build_report when the spec is ready to validate and apply.",
    parametersSchema: dslSchema,
    /**
     * Execute build_report: parse DSL, validate via MCP and locally, return spec + validationMeta.
     * Returns a JSON string so any client can parse and attach to their message format.
     * On success includes optional trace (timestamp, specId, outcome). On validation/runtime
     * failure returns { error, trace } instead of throwing so generation is observable.
     */
    async execute(
      args: BuildReportToolInput,
      context: BuildReportToolContext
    ): Promise<string> {
      const now = () => new Date().toISOString();
      let spec: unknown;
      try {
        spec = parseJson(args.dsl ?? "");
      } catch (parseErr) {
        const message = parseErr instanceof Error ? parseErr.message : String(parseErr);
        return JSON.stringify({
          error: message,
          trace: {
            timestamp: now(),
            specId: undefined,
            outcome: "error" as const,
            errorMessage: message,
          },
        });
      }
      const specId =
        spec != null && typeof spec === "object" && "id" in spec
          ? (spec as { id?: string }).id
          : undefined;

      const v = await context.validateReportSpecViaMcp(spec);
      if (!v.valid) {
        const messages = (v.diagnostics ?? []).map((d) => d.message).join("; ");
        return JSON.stringify({
          error: `build_report rejected invalid ReportSpec: ${messages}`,
          trace: {
            timestamp: now(),
            specId,
            outcome: "error" as const,
            errorMessage: messages,
          },
        });
      }
      try {
        const local = validateReportSpec(spec as ReportSpec, context.validationContext);
        if (!local.valid) {
          const message = local.errors.join("; ");
          return JSON.stringify({
            error: message,
            trace: {
              timestamp: now(),
              specId,
              outcome: "error" as const,
              errorMessage: message,
            },
          });
        }
      } catch (localErr) {
        const message = localErr instanceof Error ? localErr.message : String(localErr);
        return JSON.stringify({
          error: message,
          trace: {
            timestamp: now(),
            specId,
            outcome: "error" as const,
            errorMessage: message,
          },
        });
      }
      return JSON.stringify({
        spec,
        validationMeta: {
          ...context.meta,
          validation: v,
        },
        trace: {
          timestamp: now(),
          specId,
          outcome: "success" as const,
        },
      });
    },
  };
}

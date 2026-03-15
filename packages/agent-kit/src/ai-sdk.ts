import { jsonSchema, stepCountIs, streamText, tool } from "ai";
import type { DataProvider, ReportingContextProvider } from "@reporting/core";
import { createReportingAgentRuntime, type ReportingAgentRuntime } from "./runtime.js";
import { createReportingAgentTools } from "./tools.js";

export interface StreamReportingAgentResponseOptions {
  model: unknown;
  runtime: ReportingAgentRuntime;
  prompt: string;
  messages?: Array<{ role?: string; content?: unknown; parts?: Array<{ type?: string; text?: string }> }>;
  currentSpec?: Record<string, unknown> | null;
  validationErrorText?: string;
  maxSteps?: number;
}

export interface CreateAiSdkReportingAgentOptions {
  contextProvider: ReportingContextProvider;
  dataProvider: DataProvider;
  skillPaths: string[];
  baseInstructions?: string;
  runtimeNotes?: string[];
  submissionToolName?: string;
  submissionToolDescription?: string;
  previewRowLimit?: number;
  profileRowLimit?: number;
}

export function createAiSdkReportingTools(
  contextProvider: ReportingContextProvider,
  dataProvider: DataProvider,
  previewRowLimit?: number,
  profileRowLimit?: number
) {
  const actions = createReportingAgentTools({
    contextProvider,
    dataProvider,
    previewRowLimit,
    profileRowLimit,
  });

  return {
    list_available_queries: tool({
      description: "List the published query catalog for the active reporting context.",
      inputSchema: jsonSchema({
        type: "object",
        properties: {},
      }),
      execute: async () => actions.listAvailableQueries(),
    }),
    describe_query: tool({
      description: "Inspect one published query, including its fields, params, and notes.",
      inputSchema: jsonSchema({
        type: "object",
        properties: {
          name: { type: "string", description: "Canonical query name." },
        },
        required: ["name"],
      }),
      execute: async ({ name }: { name: string }) => actions.describeQuery({ name }),
    }),
    preview_query: tool({
      description:
        "Preview live query rows and optionally profile field values, ranges, null rates, and filter value suggestions after validating the query name, params, and requested fields against the published query catalog.",
      inputSchema: jsonSchema({
        type: "object",
        properties: {
          name: { type: "string", description: "Canonical query name." },
          params: {
            type: "object",
            description: "Optional params using canonical param keys from the query catalog.",
          },
          fields: {
            type: "array",
            items: { type: "string" },
            description: "Optional subset of canonical field keys to return in preview rows and prioritize for profiling.",
          },
          inspect: {
            type: "object",
            properties: {
              includeFieldProfiles: {
                type: "boolean",
                description: "Include field profile summaries for the targeted fields.",
              },
              includeValueOptions: {
                type: "boolean",
                description: "Include low-cardinality distinct values that can inform chart categories or filter options.",
              },
              includeRanges: {
                type: "boolean",
                description: "Include observed min/max for numeric and date fields.",
              },
              includeNullRates: {
                type: "boolean",
                description: "Include null count and null rate for targeted fields.",
              },
              includeParamOptions: {
                type: "boolean",
                description: "Include param suggestions derived from mapped query fields.",
              },
              maxDistinctValues: {
                type: "number",
                description: "Maximum number of distinct values to include for low-cardinality fields.",
              },
            },
          },
        },
        required: ["name"],
      }),
      execute: async ({
        name,
        params,
        fields,
        inspect,
      }: {
        name: string;
        params?: Record<string, unknown>;
        fields?: string[];
        inspect?: {
          includeFieldProfiles?: boolean;
          includeValueOptions?: boolean;
          includeRanges?: boolean;
          includeNullRates?: boolean;
          includeParamOptions?: boolean;
          maxDistinctValues?: number;
        };
      }) => actions.previewQuery({ name, params, fields, inspect }),
    }),
    apply_report_spec: tool({
      description:
        "Replace the current report in the UI with a complete ReportSpec. The spec is validated and dry-run against the real data provider before applying.",
      inputSchema: jsonSchema({
        type: "object",
        properties: {
          spec: {
            type: "object",
            description: "Complete ReportSpec JSON object.",
          },
        },
        required: ["spec"],
      }),
      execute: async ({ spec }: { spec: Record<string, unknown> }) =>
        actions.applyReportSpec({ spec: spec as never }),
    }),
  };
}

export async function streamReportingAgentResponse(
  options: StreamReportingAgentResponseOptions,
  toolSet: ReturnType<typeof createAiSdkReportingTools>
) {
  const system = await options.runtime.buildSystemPrompt({
    currentSpec: options.currentSpec,
    validationErrorText: options.validationErrorText,
  });
  const modelMessages = options.runtime.buildModelMessages({
    prompt: options.prompt,
    messages: options.messages,
    currentSpec: options.currentSpec,
    validationErrorText: options.validationErrorText,
  });

  const result = streamText({
    model: options.model as never,
    system,
    messages: modelMessages,
    tools: toolSet,
    stopWhen: stepCountIs(options.maxSteps ?? 25),
  });

  return result.toUIMessageStreamResponse();
}

export function createAiSdkReportingAgent(options: CreateAiSdkReportingAgentOptions) {
  const runtime = createReportingAgentRuntime({
    contextProvider: options.contextProvider,
    skillPaths: options.skillPaths,
    baseInstructions: options.baseInstructions,
    runtimeNotes: options.runtimeNotes,
    submissionToolName: options.submissionToolName,
    submissionToolDescription: options.submissionToolDescription,
  });
  const tools = createAiSdkReportingTools(
    options.contextProvider,
    options.dataProvider,
    options.previewRowLimit,
    options.profileRowLimit
  );

  return {
    runtime,
    tools,
    streamResponse(input: Omit<StreamReportingAgentResponseOptions, "runtime">) {
      return streamReportingAgentResponse(
        {
          ...input,
          runtime,
        },
        tools
      );
    },
  };
}

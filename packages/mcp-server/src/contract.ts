import { readFileSync } from "node:fs";
import {
  REPORT_SPEC_VERSION,
  type BaseReportingContext,
  type QueryCatalogEntry,
  type SemanticReportingContext,
  type ValidationContext,
} from "@reporting/core";

export type { BaseReportingContext, QueryCatalogEntry, SemanticReportingContext };

export interface ReportingHostContext {
  queryCatalog?: unknown;
  source?: string;
  tenantId?: string;
}

export interface NormalizedReportingHostContext {
  queryCatalog: QueryCatalogEntry[];
  source?: string;
  tenantId?: string;
}

export interface QueryCatalogLoadResult {
  queries: QueryCatalogEntry[];
  source: "env-json" | "file" | "session" | "none";
  error?: string;
}

export interface ContractResource {
  name: string;
  uri: string;
  title: string;
  description: string;
  mimeType: string;
  text: string;
}

export const supportedFilters = [
  {
    type: "select",
    description: "Single-value selection filter with explicit UI options.",
    requiredFields: ["type", "id", "label", "dataSource", "options"],
    optionalFields: ["paramKey"],
  },
  {
    type: "dateRange",
    description: "Date range filter that maps user input to from/to query params.",
    requiredFields: ["type", "id", "label", "dataSource"],
    optionalFields: ["paramKeyFrom", "paramKeyTo"],
  },
  {
    type: "search",
    description: "Free-text search filter mapped to a backend query param.",
    requiredFields: ["type", "id", "label", "dataSource"],
    optionalFields: ["paramKey", "placeholder"],
  },
] as const;

export const supportedWidgets = [
  {
    type: "table",
    description: "Tabular widget for row-oriented query results. Optional groupByKey (e.g. projectName) groups rows; groupLabelKey sets section header label.",
    requiredFields: ["type", "id", "dataSource", "config.columns"],
    optionalFields: ["title", "config.groupByKey", "config.groupLabelKey"],
  },
  {
    type: "barChart",
    description: "Bar chart widget with category and numeric value fields.",
    requiredFields: ["type", "id", "dataSource", "config.categoryKey", "config.valueKey"],
    optionalFields: ["title", "config.series"],
  },
  {
    type: "kpi",
    description: "Single value widget that reads one field from the first query row.",
    requiredFields: ["type", "id", "dataSource", "config.valueKey"],
    optionalFields: ["title", "config.label", "config.format"],
  },
] as const;

const reportSpecGuide = `# ReportSpec ${REPORT_SPEC_VERSION}

ReportSpec is the public DSL for AI-authored reporting in Prism Reporting. Agents should produce JSON that matches this contract, then call \`validate_report_spec\` before handing the spec to the rendering runtime.

## Authoring rules

1. Return a JSON object, not prose and not code fences.
2. Use a unique kebab-case \`id\`.
3. Set \`layout\` to \`singleColumn\` or \`twoColumn\`.
4. Define \`dataSources\` as an object keyed by data source id.
5. Every filter and widget \`dataSource\` must reference an existing key in \`dataSources\`.
6. Use only supported filter types: \`select\`, \`dateRange\`, \`search\`.
7. Use only supported widget types: \`table\`, \`barChart\`, \`kpi\`.
8. Keep filter ids unique and widget ids unique.
9. When query metadata is available, use only published query names and field keys.

## Data source shape

Each data source value is:

\`\`\`json
{ "name": "tasks", "query": "tasks", "params": { "status": "NEW" } }
\`\`\`

- \`name\`: readable identifier within the report
- \`query\`: backend query name supported by the host
- \`params\`: optional default params merged with filter input

## Filters

- \`select\`: requires \`options: [{ value, label }]\`
- \`dateRange\`: optional \`paramKeyFrom\` and \`paramKeyTo\`
- \`search\`: optional \`paramKey\` and \`placeholder\`

## Widgets

- \`table\`: \`config.columns = [{ key, label, type? }]\`; optional \`config.groupByKey\` (e.g. \`projectName\`) to group rows into sections, optional \`config.groupLabelKey\` for section header
- \`barChart\`: \`config.categoryKey\`, \`config.valueKey\`
- \`kpi\`: \`config.valueKey\`, optional \`config.label\` and \`config.format\`

## Recommended repair loop

1. Read \`report-spec://v1/guide\` and \`report-spec://v1/schema\`.
2. Read the query catalog if the host publishes one.
3. Draft a ReportSpec JSON object.
4. Call \`validate_report_spec\`.
5. If invalid, repair using diagnostic \`path\`, \`code\`, and \`suggestion\`.
6. Repeat until valid.
`;

const reportSpecJsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `report-spec://${REPORT_SPEC_VERSION}/schema`,
  title: `ReportSpec ${REPORT_SPEC_VERSION}`,
  type: "object",
  additionalProperties: false,
  required: ["id", "title", "layout", "dataSources", "filters", "widgets"],
  properties: {
    id: {
      type: "string",
      description: "Unique report identifier, typically kebab-case.",
    },
    title: {
      type: "string",
      description: "Human-readable report title.",
    },
    layout: {
      type: "string",
      enum: ["singleColumn", "twoColumn"],
    },
    dataSources: {
      type: "object",
      additionalProperties: {
        type: "object",
        additionalProperties: false,
        required: ["name", "query"],
        properties: {
          name: { type: "string" },
          query: { type: "string" },
          params: {
            type: "object",
            additionalProperties: true,
          },
        },
      },
    },
    filters: {
      type: "array",
      items: {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "label", "dataSource", "options"],
            properties: {
              type: { const: "select" },
              id: { type: "string" },
              label: { type: "string" },
              dataSource: { type: "string" },
              paramKey: { type: "string" },
              options: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["value", "label"],
                  properties: {
                    value: { type: "string" },
                    label: { type: "string" },
                  },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "label", "dataSource"],
            properties: {
              type: { const: "dateRange" },
              id: { type: "string" },
              label: { type: "string" },
              dataSource: { type: "string" },
              paramKeyFrom: { type: "string" },
              paramKeyTo: { type: "string" },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "label", "dataSource"],
            properties: {
              type: { const: "search" },
              id: { type: "string" },
              label: { type: "string" },
              dataSource: { type: "string" },
              paramKey: { type: "string" },
              placeholder: { type: "string" },
            },
          },
        ],
      },
    },
    widgets: {
      type: "array",
      items: {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "dataSource", "config"],
            properties: {
              type: { const: "table" },
              id: { type: "string" },
              title: { type: "string" },
              dataSource: { type: "string" },
              config: {
                type: "object",
                additionalProperties: false,
                required: ["columns"],
                properties: {
                  columns: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["key", "label"],
                      properties: {
                        key: { type: "string" },
                        label: { type: "string" },
                        type: {
                          type: "string",
                          enum: ["string", "number", "date"],
                        },
                      },
                    },
                  },
                  groupByKey: {
                    type: "string",
                    description: "Row field key to group by; resolved table will have groups.",
                  },
                  groupLabelKey: {
                    type: "string",
                    description: "Row field key for group section label; defaults to group value.",
                  },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "dataSource", "config"],
            properties: {
              type: { const: "barChart" },
              id: { type: "string" },
              title: { type: "string" },
              dataSource: { type: "string" },
              config: {
                type: "object",
                additionalProperties: false,
                required: ["categoryKey", "valueKey"],
                properties: {
                  categoryKey: { type: "string" },
                  valueKey: { type: "string" },
                  series: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["key", "label"],
                      properties: {
                        key: { type: "string" },
                        label: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "dataSource", "config"],
            properties: {
              type: { const: "kpi" },
              id: { type: "string" },
              title: { type: "string" },
              dataSource: { type: "string" },
              config: {
                type: "object",
                additionalProperties: false,
                required: ["valueKey"],
                properties: {
                  valueKey: { type: "string" },
                  label: { type: "string" },
                  format: {
                    type: "string",
                    enum: ["number", "percent", "currency"],
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
};

const exampleBasic = {
  id: "tasks-by-status",
  title: "Tasks by Status",
  layout: "singleColumn",
  dataSources: {
    tasks: {
      name: "tasks",
      query: "tasks",
    },
  },
  filters: [
    {
      type: "select",
      id: "status",
      label: "Status",
      dataSource: "tasks",
      paramKey: "status",
      options: [
        { value: "NEW", label: "New" },
        { value: "INP", label: "In Progress" },
        { value: "CPL", label: "Complete" },
      ],
    },
  ],
  widgets: [
    {
      type: "table",
      id: "tasks-table",
      title: "Tasks",
      dataSource: "tasks",
      config: {
        columns: [
          { key: "name", label: "Task" },
          { key: "status", label: "Status" },
          { key: "assignee", label: "Assignee" },
        ],
      },
    },
  ],
};

const exampleBarChart = {
  id: "tasks-by-owner",
  title: "Tasks by Owner",
  layout: "singleColumn",
  dataSources: {
    tasksByOwner: {
      name: "tasks-by-owner",
      query: "tasksByOwner",
    },
  },
  filters: [
    {
      type: "dateRange",
      id: "dueDate",
      label: "Due Date",
      dataSource: "tasksByOwner",
      paramKeyFrom: "dueFrom",
      paramKeyTo: "dueTo",
    },
  ],
  widgets: [
    {
      type: "barChart",
      id: "tasks-by-owner-chart",
      title: "Tasks by Owner",
      dataSource: "tasksByOwner",
      config: {
        categoryKey: "owner",
        valueKey: "count",
      },
    },
  ],
};

const exampleKpi = {
  id: "active-tasks-kpi",
  title: "Active Tasks",
  layout: "singleColumn",
  dataSources: {
    activeTasks: {
      name: "active-tasks",
      query: "activeTasksSummary",
    },
  },
  filters: [],
  widgets: [
    {
      type: "kpi",
      id: "active-tasks-count",
      title: "Active Tasks",
      dataSource: "activeTasks",
      config: {
        valueKey: "count",
        label: "Open tasks",
        format: "number",
      },
    },
  ],
};

const exampleMultiSource = {
  id: "portfolio-overview",
  title: "Portfolio Overview",
  layout: "twoColumn",
  dataSources: {
    summary: {
      name: "portfolio-summary",
      query: "portfolioSummary",
    },
    tasks: {
      name: "portfolio-tasks",
      query: "portfolioTasks",
    },
  },
  filters: [
    {
      type: "search",
      id: "portfolioSearch",
      label: "Search",
      dataSource: "tasks",
      paramKey: "search",
      placeholder: "Search task name",
    },
  ],
  widgets: [
    {
      type: "kpi",
      id: "portfolio-budget",
      title: "Budget",
      dataSource: "summary",
      config: {
        valueKey: "budget",
        format: "currency",
      },
    },
    {
      type: "table",
      id: "portfolio-tasks-table",
      title: "Portfolio Tasks",
      dataSource: "tasks",
      config: {
        columns: [
          { key: "name", label: "Task" },
          { key: "owner", label: "Owner" },
          { key: "status", label: "Status" },
        ],
      },
    },
  ],
};

const changelog = {
  version: REPORT_SPEC_VERSION,
  status: "initial-public-contract",
  notes: [
    "Established versioned MCP resources for ReportSpec authoring.",
    "Published machine-readable schema, examples, and query-catalog resource shape.",
    "Validation now returns structured diagnostics with path, code, message, and suggestion.",
  ],
};

export const parseQueryCatalog = (input: unknown): QueryCatalogEntry[] => {
  if (Array.isArray(input)) {
    return input
      .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
      .map(normalizeQueryCatalogEntry)
      .filter((entry): entry is QueryCatalogEntry => entry !== null);
  }

  if (typeof input === "object" && input !== null) {
    const record = input as Record<string, unknown>;

    if (Array.isArray(record.queries)) {
      return parseQueryCatalog(record.queries);
    }

    return Object.entries(record)
      .map(([name, value]) => {
        if (typeof value !== "object" || value === null) {
          return normalizeQueryCatalogEntry({ name });
        }

        return normalizeQueryCatalogEntry({
          name,
          ...(value as Record<string, unknown>),
        });
      })
      .filter((entry): entry is QueryCatalogEntry => entry !== null);
  }

  return [];
};

const normalizeQueryCatalogEntry = (input: Record<string, unknown>): QueryCatalogEntry | null => {
  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    return null;
  }

  const toStringArray = (value: unknown) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : undefined;

  return {
    name: input.name,
    description: typeof input.description === "string" ? input.description : undefined,
    fields: toStringArray(input.fields),
    params: toStringArray(input.params),
    notes: typeof input.notes === "string" ? input.notes : undefined,
  };
};

export function createQueryCatalogLoadResult(
  input: unknown,
  source: QueryCatalogLoadResult["source"] = "session"
): QueryCatalogLoadResult {
  return {
    queries: parseQueryCatalog(input),
    source,
  };
}

export function normalizeReportingHostContext(input: unknown): NormalizedReportingHostContext {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return {
      queryCatalog: [],
    };
  }

  const record = input as Record<string, unknown>;

  return {
    queryCatalog: parseQueryCatalog(record.queryCatalog),
    source: typeof record.source === "string" ? record.source : undefined,
    tenantId: typeof record.tenantId === "string" ? record.tenantId : undefined,
  };
}

/**
 * Converts base reporting context from a provider into the legacy host context shape.
 * Used when a ReportingContextProvider is supplied to the session manager.
 */
export function baseContextToHostContext(base: BaseReportingContext): ReportingHostContext {
  return {
    queryCatalog: { queries: base.queries },
    source: base.source,
    tenantId: base.tenantId,
  };
}

export function loadQueryCatalogFromEnv(env: NodeJS.ProcessEnv = process.env): QueryCatalogLoadResult {
  const rawJson = env.REPORTING_QUERY_CATALOG_JSON;
  if (rawJson) {
    try {
      return {
        queries: parseQueryCatalog(JSON.parse(rawJson)),
        source: "env-json",
      };
    } catch (error) {
      return {
        queries: [],
        source: "env-json",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  const filePath = env.REPORTING_QUERY_CATALOG_PATH;
  if (filePath) {
    try {
      return {
        queries: parseQueryCatalog(JSON.parse(readFileSync(filePath, "utf8"))),
        source: "file",
      };
    } catch (error) {
      return {
        queries: [],
        source: "file",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return {
    queries: [],
    source: "none",
  };
}

export function buildValidationContext(queryCatalog: QueryCatalogEntry[]): ValidationContext {
  return {
    availableQueries: queryCatalog.map((entry) => entry.name),
    availableFields: Object.fromEntries(
      queryCatalog
        .filter((entry) => entry.fields && entry.fields.length > 0)
        .map((entry) => [entry.name, entry.fields ?? []])
    ),
  };
}

export function buildQueryCatalogResourceText(
  queryCatalogResult: QueryCatalogLoadResult,
  hostContext?: NormalizedReportingHostContext
): string {
  if (queryCatalogResult.queries.length > 0) {
    return JSON.stringify(
      {
        version: REPORT_SPEC_VERSION,
        source: queryCatalogResult.source,
        tenantId: hostContext?.tenantId,
        queries: queryCatalogResult.queries,
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      version: REPORT_SPEC_VERSION,
      source: queryCatalogResult.source,
      tenantId: hostContext?.tenantId,
      queries: [],
      note:
        "No query catalog is configured. Set REPORTING_QUERY_CATALOG_JSON or REPORTING_QUERY_CATALOG_PATH to publish tenant-specific query metadata.",
      error: queryCatalogResult.error,
      expectedShape: {
        queries: [
          {
            name: "tasks",
            description: "List tasks for reporting",
            fields: ["name", "status", "owner", "dueDate"],
            params: ["status", "dueFrom", "dueTo"],
          },
        ],
      },
    },
    null,
    2
  );
}

export function getStaticContractResources(): ContractResource[] {
  return [
    {
      name: "report-spec-guide",
      uri: `report-spec://${REPORT_SPEC_VERSION}/guide`,
      title: `ReportSpec ${REPORT_SPEC_VERSION} Guide`,
      description: "Authoring guide for valid ReportSpec documents.",
      mimeType: "text/markdown",
      text: reportSpecGuide,
    },
    {
      name: "report-spec-schema",
      uri: `report-spec://${REPORT_SPEC_VERSION}/schema`,
      title: `ReportSpec ${REPORT_SPEC_VERSION} Schema`,
      description: "Machine-readable JSON Schema for ReportSpec.",
      mimeType: "application/json",
      text: JSON.stringify(reportSpecJsonSchema, null, 2),
    },
    {
      name: "report-spec-example-basic",
      uri: `report-spec://${REPORT_SPEC_VERSION}/examples/basic`,
      title: "Basic ReportSpec Example",
      description: "Minimal valid example with one select filter and one table widget.",
      mimeType: "application/json",
      text: JSON.stringify(exampleBasic, null, 2),
    },
    {
      name: "report-spec-example-bar-chart",
      uri: `report-spec://${REPORT_SPEC_VERSION}/examples/patterns/bar-chart`,
      title: "Bar Chart ReportSpec Example",
      description: "Example using a bar chart widget and date range filter.",
      mimeType: "application/json",
      text: JSON.stringify(exampleBarChart, null, 2),
    },
    {
      name: "report-spec-example-kpi",
      uri: `report-spec://${REPORT_SPEC_VERSION}/examples/patterns/kpi`,
      title: "KPI ReportSpec Example",
      description: "Example using a KPI widget for summary reporting.",
      mimeType: "application/json",
      text: JSON.stringify(exampleKpi, null, 2),
    },
    {
      name: "report-spec-example-multi-source",
      uri: `report-spec://${REPORT_SPEC_VERSION}/examples/patterns/multi-source`,
      title: "Multi-source ReportSpec Example",
      description: "Example using multiple data sources and mixed widget types.",
      mimeType: "application/json",
      text: JSON.stringify(exampleMultiSource, null, 2),
    },
    {
      name: "report-spec-changelog",
      uri: `report-spec://${REPORT_SPEC_VERSION}/changelog`,
      title: `ReportSpec ${REPORT_SPEC_VERSION} Changelog`,
      description: "Version notes for the public reporting DSL contract.",
      mimeType: "application/json",
      text: JSON.stringify(changelog, null, 2),
    },
  ];
}

export function getQueryCatalogResource(
  queryCatalogResult: QueryCatalogLoadResult,
  hostContext?: NormalizedReportingHostContext
): ContractResource {
  return {
    name: "report-spec-query-catalog",
    uri: `report-spec://${REPORT_SPEC_VERSION}/query-catalog`,
    title: "Query Catalog",
    description: "Tenant-specific query metadata used for grounding generated report specs.",
    mimeType: "application/json",
    text: buildQueryCatalogResourceText(queryCatalogResult, hostContext),
  };
}

/**
 * Builds a read-only resource for optional semantic context (aliases, examples, hints).
 * For agent grounding only; must not be used to change validation rules.
 */
export function getSemanticContextResource(semantic: SemanticReportingContext): ContractResource {
  return {
    name: "report-spec-semantic-context",
    uri: `report-spec://${REPORT_SPEC_VERSION}/semantic-context`,
    title: "Semantic Context",
    description:
      "Optional aliases, examples, and clarification hints for agent grounding. Does not affect validation.",
    mimeType: "application/json",
    text: JSON.stringify(
      {
        version: REPORT_SPEC_VERSION,
        queryAliases: semantic.queryAliases ?? [],
        fieldAliases: semantic.fieldAliases ?? [],
        examples: semantic.examples ?? [],
        clarificationHints: semantic.clarificationHints ?? [],
      },
      null,
      2
    ),
  };
}

export function getContractResources(
  queryCatalogResult: QueryCatalogLoadResult,
  hostContext?: NormalizedReportingHostContext
): ContractResource[] {
  return [...getStaticContractResources(), getQueryCatalogResource(queryCatalogResult, hostContext)];
}

export function getExampleByPattern(pattern: string) {
  switch (pattern) {
    case "basic":
      return exampleBasic;
    case "barChart":
      return exampleBarChart;
    case "kpi":
      return exampleKpi;
    case "multiSource":
      return exampleMultiSource;
    default:
      return null;
  }
}

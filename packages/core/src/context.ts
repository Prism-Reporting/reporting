/**
 * Shared reporting context types and provider contract.
 * Usable by both the MCP package and application code (e.g. starter example).
 * @see STARTER-ALIGNMENT-REQUIREMENTS.md sections 1.4 (context shape) and 8.2
 */

// --- Query catalog entry (base context) ---

/**
 * A single entry in the query catalog. Describes one available query for report authoring and validation.
 */
export interface QueryCatalogEntry {
  /** Canonical query name used in ReportSpec dataSources.query and validation. */
  name: string;
  /** Human-readable description of what the query returns. */
  description?: string;
  /** Field keys returned by this query (used for validation and UI). */
  fields?: string[];
  /** Optional framework-owned field contract. Hosts can declare row shape here and let fields be inferred. */
  fieldShape?: Record<string, QueryFieldContract>;
  /** Parameter names this query accepts (e.g. status, dueFrom, dueTo). */
  params?: string[];
  /** Optional framework-owned parameter contract. Hosts can declare params here and let param names be inferred. */
  paramShape?: Record<string, QueryParamContract>;
  /** Optional notes for implementers or agent grounding. */
  notes?: string;
}

export type QueryScalarType = "string" | "number" | "boolean" | "date";
export type QueryParamType =
  | QueryScalarType
  | "string[]"
  | "number[]"
  | "boolean[]"
  | "date[]";

export type QueryFieldSemanticKind = "dimension" | "measure" | "time" | "id" | "label";
export type QueryFieldWidgetRole =
  | "category"
  | "series"
  | "value"
  | "label"
  | "time"
  | "tooltip";
export type QueryParamSemanticMode = "exact" | "multi" | "search" | "rangeFrom" | "rangeTo";

export interface QueryFieldSemanticContract {
  kind?: QueryFieldSemanticKind;
  groupable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  aggregatable?: boolean;
  preferredWidgetRoles?: QueryFieldWidgetRole[];
  exampleValues?: unknown[];
}

export interface QueryParamSemanticContract {
  mapsToField?: string;
  mode?: QueryParamSemanticMode;
  exampleValues?: unknown[];
}

export interface QueryFieldContract {
  type: QueryScalarType;
  optional?: boolean;
  description?: string;
  semantic?: QueryFieldSemanticContract;
}

export interface QueryParamContract {
  type: QueryParamType;
  optional?: boolean;
  description?: string;
  semantic?: QueryParamSemanticContract;
}

function toSortedUniqueKeys(
  keys: string[] | undefined,
  shape: Record<string, unknown> | undefined
): string[] | undefined {
  const explicitKeys = Array.isArray(keys) ? keys.filter((key) => typeof key === "string" && key.length > 0) : [];
  const shapeKeys =
    shape && typeof shape === "object"
      ? Object.keys(shape).filter((key) => typeof key === "string" && key.length > 0)
      : [];
  const merged = [...new Set([...explicitKeys, ...shapeKeys])];
  return merged.length > 0 ? merged : undefined;
}

function formatExampleValues(values: unknown[] | undefined): string {
  if (!Array.isArray(values) || values.length === 0) return "";
  return values
    .slice(0, 5)
    .map((value) => JSON.stringify(value))
    .join(", ");
}

function formatFieldContractForAgent(fieldName: string, contract: QueryFieldContract): string {
  const parts = [`${fieldName} (${contract.type}${contract.optional ? ", optional" : ""})`];
  const semantic = contract.semantic;
  if (semantic?.kind) parts.push(`kind=${semantic.kind}`);
  if (semantic?.groupable) parts.push("groupable");
  if (semantic?.filterable) parts.push("filterable");
  if (semantic?.sortable) parts.push("sortable");
  if (semantic?.aggregatable) parts.push("aggregatable");
  if (Array.isArray(semantic?.preferredWidgetRoles) && semantic.preferredWidgetRoles.length > 0) {
    parts.push(`roles=${semantic.preferredWidgetRoles.join("/")}`);
  }
  if (contract.description) parts.push(contract.description);
  const examples = formatExampleValues(semantic?.exampleValues);
  if (examples) parts.push(`examples=${examples}`);
  return parts.join("; ");
}

function formatParamContractForAgent(paramName: string, contract: QueryParamContract): string {
  const parts = [`${paramName} (${contract.type}${contract.optional ? ", optional" : ""})`];
  const semantic = contract.semantic;
  if (semantic?.mapsToField) parts.push(`mapsTo=${semantic.mapsToField}`);
  if (semantic?.mode) parts.push(`mode=${semantic.mode}`);
  if (contract.description) parts.push(contract.description);
  const examples = formatExampleValues(semantic?.exampleValues);
  if (examples) parts.push(`examples=${examples}`);
  return parts.join("; ");
}

export function defineQueryCatalog(
  queries: QueryCatalogEntry[]
): { queries: QueryCatalogEntry[] } {
  return {
    queries: queries.map((entry) => ({
      ...entry,
      ...(toSortedUniqueKeys(entry.fields, entry.fieldShape)
        ? { fields: toSortedUniqueKeys(entry.fields, entry.fieldShape) }
        : {}),
      ...(toSortedUniqueKeys(entry.params, entry.paramShape)
        ? { params: toSortedUniqueKeys(entry.params, entry.paramShape) }
        : {}),
    })),
  };
}

// --- Base reporting context ---

/**
 * Base reporting context: deterministic metadata for validation and runtime behavior.
 * Source and tenantId are optional identifiers; the required payload is the query catalog.
 */
export interface BaseReportingContext {
  /** Optional source identifier (e.g. "reporting-starter-example"). */
  source?: string;
  /** Optional tenant or scope identifier. */
  tenantId?: string;
  /** Query catalog: available queries with name, description, fields, params, and optional notes. */
  queries: QueryCatalogEntry[];
}

// --- Semantic context (optional, for AI grounding) ---

/**
 * One alias mapping for a query (e.g. "tasks" → "work items").
 */
export interface QueryAliasEntry {
  /** Canonical query name from the catalog. */
  queryName: string;
  /** Alternative name or phrase the agent may see in user prompts. */
  alias: string;
}

/**
 * One alias mapping for a field (e.g. "assignee" → "owner").
 */
export interface FieldAliasEntry {
  /** Optional scope: query name. If omitted, alias may apply across queries. */
  queryName?: string;
  /** Canonical field key from the query catalog. */
  fieldKey: string;
  /** Alternative name or phrase for the field. */
  alias: string;
}

/**
 * One example for agent grounding (e.g. prompt → report title or summary).
 */
export interface SemanticExampleEntry {
  /** Example user prompt or request. */
  prompt?: string;
  /** Example report title or short description. */
  title?: string;
  /** Longer description or summary. */
  description?: string;
}

/**
 * One clarification hint shown to the agent or user when intent is ambiguous.
 */
export interface ClarificationHintEntry {
  /** Hint text. */
  hint: string;
}

/**
 * Semantic reporting context: optional layer for better AI understanding.
 * Must not silently redefine validation rules; validation is driven by base query metadata.
 */
export interface SemanticReportingContext {
  /** Alternative names or phrases for queries (e.g. for natural language matching). */
  queryAliases?: QueryAliasEntry[];
  /** Alternative names or phrases for fields. */
  fieldAliases?: FieldAliasEntry[];
  /** Example prompts or report descriptions for grounding. */
  examples?: SemanticExampleEntry[];
  /** Hints to disambiguate user intent or guide the agent. */
  clarificationHints?: ClarificationHintEntry[];
}

// --- Context provider interface ---

/**
 * Optional input passed to context provider methods (e.g. request, session, or tenant id).
 * Implementations may ignore it for a single-tenant local provider.
 */
export type ReportingContextProviderInput = unknown;

/**
 * Reporting context provider: supplies base context and optionally semantic context.
 * Implementations may be local (e.g. starter reading from query catalog) or remote.
 * The MCP server and app code can both depend on this interface.
 */
export interface ReportingContextProvider {
  /**
   * Returns the base reporting context (query catalog and optional source/tenant).
   * Used for validation and deterministic runtime behavior.
   */
  getBaseContext(input?: ReportingContextProviderInput): Promise<BaseReportingContext>;

  /**
   * Returns semantic context for agent grounding, or null if not available.
   * Optional: implementations may omit this method for base-only context.
   */
  getSemanticContext?(input?: ReportingContextProviderInput): Promise<SemanticReportingContext | null>;
}

// --- Agent grounding helpers (Section 8.4) ---

/**
 * Turns base reporting context into a short text block for agent prompts.
 * This is deterministic metadata and may be used for query/field grounding.
 */
export function formatBaseReportingContextForAgent(
  baseContext: BaseReportingContext | null | undefined
): string {
  if (!baseContext || !Array.isArray(baseContext.queries) || baseContext.queries.length === 0) {
    return "";
  }

  const lines: string[] = ["Dataset query cards:"];
  for (const query of baseContext.queries) {
    lines.push(`- ${query.name}: ${query.description ?? "No description available."}`);

    if (Array.isArray(query.fields) && query.fields.length > 0) {
      lines.push(`  Fields: ${query.fields.join(", ")}`);
    }

    if (query.fieldShape && Object.keys(query.fieldShape).length > 0) {
      lines.push("  Field details:");
      for (const [fieldName, contract] of Object.entries(query.fieldShape)) {
        lines.push(`  - ${formatFieldContractForAgent(fieldName, contract)}`);
      }
    }

    if (Array.isArray(query.params) && query.params.length > 0) {
      lines.push(`  Params: ${query.params.join(", ")}`);
    }

    if (query.paramShape && Object.keys(query.paramShape).length > 0) {
      lines.push("  Param details:");
      for (const [paramName, contract] of Object.entries(query.paramShape)) {
        lines.push(`  - ${formatParamContractForAgent(paramName, contract)}`);
      }
    }

    if (query.notes) {
      lines.push(`  Notes: ${query.notes}`);
    }
  }

  return lines.join("\n");
}

/**
 * Turns optional semantic reporting context into a short text block for agent system prompts.
 * Use this so apps do not invent ad hoc formats; validation remains driven by base context only.
 * @param semanticContext - Optional semantic context from a provider (examples, clarification hints, etc.).
 * @returns A string to append to the system prompt, or "" if nothing to add.
 */
export function formatReportingContextForAgent(
  semanticContext: SemanticReportingContext | null | undefined
): string {
  if (!semanticContext) return "";
  const parts: string[] = [];
  if (Array.isArray(semanticContext.queryAliases) && semanticContext.queryAliases.length > 0) {
    parts.push(
      "Query aliases:",
      ...semanticContext.queryAliases.map(
        (alias) => `- "${alias.alias}" -> ${alias.queryName}`
      )
    );
  }
  if (Array.isArray(semanticContext.fieldAliases) && semanticContext.fieldAliases.length > 0) {
    parts.push(
      ...(parts.length > 0 ? [""] : []),
      "Field aliases:",
      ...semanticContext.fieldAliases.map((alias) =>
        `- "${alias.alias}" -> ${alias.queryName ? `${alias.queryName}.` : ""}${alias.fieldKey}`
      )
    );
  }
  if (Array.isArray(semanticContext.examples) && semanticContext.examples.length > 0) {
    parts.push(
      ...(parts.length > 0 ? [""] : []),
      "Dataset examples (for grounding):",
      ...semanticContext.examples.map(
        (ex) =>
          `- "${ex.prompt ?? ex.title ?? ""}": ${ex.description ?? ex.title ?? ""}`.trim()
      )
    );
  }
  if (
    Array.isArray(semanticContext.clarificationHints) &&
    semanticContext.clarificationHints.length > 0
  ) {
    parts.push(
      ...(parts.length > 0 ? [""] : []),
      "Hints:",
      ...semanticContext.clarificationHints.map((h) => `- ${h.hint ?? ""}`)
    );
  }
  if (parts.length === 0) return "";
  return parts.join("\n");
}

/**
 * Combines base and semantic reporting context into a single prompt-friendly text block.
 */
export function formatCombinedReportingContextForAgent(
  baseContext: BaseReportingContext | null | undefined,
  semanticContext: SemanticReportingContext | null | undefined
): string {
  const sections = [
    formatBaseReportingContextForAgent(baseContext).trim(),
    formatReportingContextForAgent(semanticContext).trim(),
  ].filter((section) => section.length > 0);

  return sections.join("\n\n");
}

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

export interface QueryFieldContract {
  type: QueryScalarType;
  optional?: boolean;
  description?: string;
}

export interface QueryParamContract {
  type: QueryParamType;
  optional?: boolean;
  description?: string;
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

// --- Agent grounding helper (Section 8.4) ---

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
  if (Array.isArray(semanticContext.examples) && semanticContext.examples.length > 0) {
    parts.push(
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
      "",
      "Hints:",
      ...semanticContext.clarificationHints.map((h) => `- ${h.hint ?? ""}`)
    );
  }
  if (parts.length === 0) return "";
  return "\n\n" + parts.join("\n");
}

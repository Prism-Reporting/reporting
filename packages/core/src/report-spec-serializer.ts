import type { ReportSpec } from "./types.js";

/**
 * Serializes a ReportSpec to a JSON string. Hosts can persist this (e.g. localStorage, server API)
 * and restore a report by parsing with parseReportSpecFromJson.
 */
export function serializeReportSpecToJson(spec: ReportSpec): string {
  return JSON.stringify(spec, null, 0);
}

export type ParseReportSpecResult =
  | { ok: true; spec: ReportSpec }
  | { ok: false; error: string };

/**
 * Parses a JSON string into a ReportSpec. Use after loading persisted spec JSON.
 * Returns { ok: true, spec } on success, or { ok: false, error } when the string
 * is invalid JSON or does not represent a valid ReportSpec shape (required fields present).
 */
export function parseReportSpecFromJson(json: string): ParseReportSpecResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Invalid JSON",
    };
  }

  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "ReportSpec must be a non-null object" };
  }

  const obj = parsed as Record<string, unknown>;
  const required = ["id", "title", "layout", "dataSources", "filters", "widgets"];
  for (const key of required) {
    if (!(key in obj)) {
      return { ok: false, error: `Missing required field: ${key}` };
    }
  }

  if (typeof obj.id !== "string") {
    return { ok: false, error: "ReportSpec.id must be a string" };
  }
  if (typeof obj.title !== "string") {
    return { ok: false, error: "ReportSpec.title must be a string" };
  }
  if (obj.layout !== "singleColumn" && obj.layout !== "twoColumn") {
    return { ok: false, error: "ReportSpec.layout must be 'singleColumn' or 'twoColumn'" };
  }
  if (typeof obj.dataSources !== "object" || obj.dataSources == null || Array.isArray(obj.dataSources)) {
    return { ok: false, error: "ReportSpec.dataSources must be an object" };
  }
  if (!Array.isArray(obj.filters)) {
    return { ok: false, error: "ReportSpec.filters must be an array" };
  }
  if (!Array.isArray(obj.widgets)) {
    return { ok: false, error: "ReportSpec.widgets must be an array" };
  }

  return { ok: true, spec: parsed as ReportSpec };
}

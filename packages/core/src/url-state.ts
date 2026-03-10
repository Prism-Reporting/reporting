import type { FilterSpec } from "./types.js";

/**
 * Serializes filter state to URL search params string (e.g. for shareable links).
 * Uses filter id as param key; multiSelect as comma-separated; date/numeric range as idFrom/idTo.
 * Only includes keys that exist in filterState and have a value; omits empty arrays and empty strings.
 */
export function serializeFilterStateToSearchParams(
  filterState: Record<string, unknown>,
  filterSpecs: FilterSpec[]
): string {
  const specById = new Map(filterSpecs.map((f) => [f.id, f]));
  const params = new URLSearchParams();

  for (const [filterId, value] of Object.entries(filterState)) {
    if (value === undefined || value === null) continue;
    const spec = specById.get(filterId);
    if (!spec) continue;

    if (spec.type === "multiSelect") {
      const arr = Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
      if (arr.length > 0) {
        params.set(filterId, arr.join(","));
      }
    } else if (spec.type === "dateRange" || spec.type === "numericRange") {
      const range = value as { from?: string | number; to?: string | number };
      if (range?.from !== undefined && range.from !== null && String(range.from).trim() !== "") {
        params.set(`${filterId}From`, String(range.from));
      }
      if (range?.to !== undefined && range.to !== null && String(range.to).trim() !== "") {
        params.set(`${filterId}To`, String(range.to));
      }
    } else {
      // select, search
      const s = typeof value === "string" ? value : String(value);
      if (s.trim() !== "") {
        params.set(filterId, s);
      }
    }
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Parses URL search params (or full search string including "?") into filter state.
 * Uses filterSpecs to know param keys and value shapes (string, { from, to }, string[]).
 */
export function parseFilterStateFromSearchParams(
  search: string,
  filterSpecs: FilterSpec[]
): Record<string, unknown> {
  const searchStr = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(searchStr);
  const filterState: Record<string, unknown> = {};
  const specById = new Map(filterSpecs.map((f) => [f.id, f]));

  for (const spec of filterSpecs) {
    const filterId = spec.id;

    if (spec.type === "multiSelect") {
      const raw = params.get(filterId);
      if (raw != null && raw !== "") {
        const arr = raw.split(",").map((s) => s.trim()).filter(Boolean);
        if (arr.length > 0) {
          filterState[filterId] = arr;
        }
      }
    } else if (spec.type === "dateRange") {
      const from = params.get(`${filterId}From`);
      const to = params.get(`${filterId}To`);
      if (from != null || to != null) {
        filterState[filterId] = { from: from ?? "", to: to ?? "" };
      }
    } else if (spec.type === "numericRange") {
      const fromRaw = params.get(`${filterId}From`);
      const toRaw = params.get(`${filterId}To`);
      const fromNum = fromRaw != null && fromRaw !== "" ? Number(fromRaw) : NaN;
      const toNum = toRaw != null && toRaw !== "" ? Number(toRaw) : NaN;
      const from = !Number.isNaN(fromNum) ? fromNum : undefined;
      const to = !Number.isNaN(toNum) ? toNum : undefined;
      if (from !== undefined || to !== undefined) {
        filterState[filterId] = { from, to };
      }
    } else {
      // select, search
      const raw = params.get(filterId);
      if (raw != null && raw !== "") {
        filterState[filterId] = raw;
      }
    }
  }

  return filterState;
}

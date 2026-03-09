import type { FilterBarProps } from "@reporting/core";
import type { FilterSpec } from "@reporting/core";

function SelectFilterControl({
  filter,
  value,
  onChange,
}: {
  filter: Extract<FilterSpec, { type: "select" }>;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const current = String(value ?? "");

  return (
    <div className="report-filter" data-filter-type="select">
      <label htmlFor={filter.id}>{filter.label}</label>
      <select
        id={filter.id}
        value={current}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        <option value="">All</option>
        {(filter.options ?? []).map((opt, i) => (
          <option key={opt?.value ?? `opt-${i}`} value={opt?.value ?? ""}>
            {opt?.label ?? opt?.value ?? ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateRangeFilterControl({
  filter,
  value,
  onChange,
}: {
  filter: Extract<FilterSpec, { type: "dateRange" }>;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const range = (value ?? {}) as { from?: string; to?: string };

  return (
    <div className="report-filter" data-filter-type="dateRange">
      <label htmlFor={`${filter.id}-from`}>{filter.label}</label>
      <div className="report-filter-date-range">
        <input
          id={`${filter.id}-from`}
          type="date"
          value={range.from ?? ""}
          onChange={(e) =>
            onChange({ ...range, from: e.target.value || undefined })
          }
        />
        <span className="report-filter-sep">to</span>
        <input
          id={`${filter.id}-to`}
          type="date"
          value={range.to ?? ""}
          onChange={(e) =>
            onChange({ ...range, to: e.target.value || undefined })
          }
        />
      </div>
    </div>
  );
}

function SearchFilterControl({
  filter,
  value,
  onChange,
}: {
  filter: Extract<FilterSpec, { type: "search" }>;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  return (
    <div className="report-filter" data-filter-type="search">
      <label htmlFor={filter.id}>{filter.label}</label>
      <input
        id={filter.id}
        type="search"
        placeholder={filter.placeholder ?? "Search..."}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    </div>
  );
}

export function FilterBar({
  filters,
  filterState,
  onFilterChange,
}: FilterBarProps) {
  const list = filters ?? [];
  if (list.length === 0) return null;

  return (
    <div className="report-filter-bar" data-testid="filter-bar">
      {list.map((filter) => {
        const value = filterState[filter.id];

        if (filter.type === "select") {
          return (
            <SelectFilterControl
              key={filter.id}
              filter={filter}
              value={value}
              onChange={(v) => onFilterChange(filter.id, v)}
            />
          );
        }
        if (filter.type === "dateRange") {
          return (
            <DateRangeFilterControl
              key={filter.id}
              filter={filter}
              value={value}
              onChange={(v) => onFilterChange(filter.id, v)}
            />
          );
        }
        if (filter.type === "search") {
          return (
            <SearchFilterControl
              key={filter.id}
              filter={filter}
              value={value}
              onChange={(v) => onFilterChange(filter.id, v)}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

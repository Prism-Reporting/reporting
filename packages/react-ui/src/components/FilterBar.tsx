import type { FilterBarProps } from "@prism-reporting/core";
import type { FilterSpec } from "@prism-reporting/core";

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
      <label htmlFor={filter.id}>
        {filter.label}
        {filter.required ? <span className="report-filter-required"> *</span> : null}
      </label>
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
      <label htmlFor={`${filter.id}-from`}>
        {filter.label}
        {filter.required ? <span className="report-filter-required"> *</span> : null}
      </label>
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
      <label htmlFor={filter.id}>
        {filter.label}
        {filter.required ? <span className="report-filter-required"> *</span> : null}
      </label>
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

function MultiSelectFilterControl({
  filter,
  value,
  onChange,
}: {
  filter: Extract<FilterSpec, { type: "multiSelect" }>;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const selected = Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  const toggle = (optValue: string) => {
    const next = selected.includes(optValue)
      ? selected.filter((v) => v !== optValue)
      : [...selected, optValue];
    onChange(next.length > 0 ? next : undefined);
  };

  return (
    <div className="report-filter report-filter-multi-select" data-filter-type="multiSelect">
      <span className="report-filter-label">
        {filter.label}
        {filter.required ? <span className="report-filter-required"> *</span> : null}
      </span>
      <div className="report-filter-options" role="group" aria-label={filter.label}>
        {(filter.options ?? []).map((opt, i) => (
          <label key={opt?.value ?? `opt-${i}`} className="report-filter-option">
            <input
              type="checkbox"
              checked={selected.includes(opt?.value ?? "")}
              onChange={() => toggle(opt?.value ?? "")}
            />
            <span>{opt?.label ?? opt?.value ?? ""}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function NumericRangeFilterControl({
  filter,
  value,
  onChange,
}: {
  filter: Extract<FilterSpec, { type: "numericRange" }>;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const range = (value ?? {}) as { from?: number; to?: number };
  const min = filter.min;
  const max = filter.max;
  const step = filter.step ?? 1;

  const update = (key: "from" | "to", raw: string) => {
    const n = raw === "" ? undefined : Number(raw);
    const next =
      key === "from"
        ? { ...range, from: n !== undefined && !Number.isNaN(n) ? n : undefined }
        : { ...range, to: n !== undefined && !Number.isNaN(n) ? n : undefined };
    const hasValue = next.from !== undefined || next.to !== undefined;
    onChange(hasValue ? next : undefined);
  };

  return (
    <div className="report-filter report-filter-numeric-range" data-filter-type="numericRange">
      <label htmlFor={`${filter.id}-from`}>
        {filter.label}
        {filter.required ? <span className="report-filter-required"> *</span> : null}
      </label>
      <div className="report-filter-numeric-range-inputs">
        <input
          id={`${filter.id}-from`}
          type="number"
          min={min}
          max={max}
          step={step}
          placeholder="Min"
          value={range.from !== undefined && !Number.isNaN(range.from) ? range.from : ""}
          onChange={(e) => update("from", e.target.value)}
        />
        <span className="report-filter-sep">to</span>
        <input
          id={`${filter.id}-to`}
          type="number"
          min={min}
          max={max}
          step={step}
          placeholder="Max"
          value={range.to !== undefined && !Number.isNaN(range.to) ? range.to : ""}
          onChange={(e) => update("to", e.target.value)}
        />
      </div>
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
        if (filter.type === "multiSelect") {
          return (
            <MultiSelectFilterControl
              key={filter.id}
              filter={filter}
              value={value}
              onChange={(v) => onFilterChange(filter.id, v)}
            />
          );
        }
        if (filter.type === "numericRange") {
          return (
            <NumericRangeFilterControl
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

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function SelectFilterControl({ filter, value, onChange, }) {
    const current = String(value ?? "");
    return (_jsxs("div", { className: "report-filter", "data-filter-type": "select", children: [_jsxs("label", { htmlFor: filter.id, children: [filter.label, filter.required ? _jsx("span", { className: "report-filter-required", children: " *" }) : null] }), _jsxs("select", { id: filter.id, value: current, onChange: (e) => onChange(e.target.value || undefined), children: [_jsx("option", { value: "", children: "All" }), (filter.options ?? []).map((opt, i) => (_jsx("option", { value: opt?.value ?? "", children: opt?.label ?? opt?.value ?? "" }, opt?.value ?? `opt-${i}`)))] })] }));
}
function DateRangeFilterControl({ filter, value, onChange, }) {
    const range = (value ?? {});
    return (_jsxs("div", { className: "report-filter", "data-filter-type": "dateRange", children: [_jsxs("label", { htmlFor: `${filter.id}-from`, children: [filter.label, filter.required ? _jsx("span", { className: "report-filter-required", children: " *" }) : null] }), _jsxs("div", { className: "report-filter-date-range", children: [_jsx("input", { id: `${filter.id}-from`, type: "date", value: range.from ?? "", onChange: (e) => onChange({ ...range, from: e.target.value || undefined }) }), _jsx("span", { className: "report-filter-sep", children: "to" }), _jsx("input", { id: `${filter.id}-to`, type: "date", value: range.to ?? "", onChange: (e) => onChange({ ...range, to: e.target.value || undefined }) })] })] }));
}
function SearchFilterControl({ filter, value, onChange, }) {
    return (_jsxs("div", { className: "report-filter", "data-filter-type": "search", children: [_jsxs("label", { htmlFor: filter.id, children: [filter.label, filter.required ? _jsx("span", { className: "report-filter-required", children: " *" }) : null] }), _jsx("input", { id: filter.id, type: "search", placeholder: filter.placeholder ?? "Search...", value: String(value ?? ""), onChange: (e) => onChange(e.target.value || undefined) })] }));
}
function MultiSelectFilterControl({ filter, value, onChange, }) {
    const selected = Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
    const toggle = (optValue) => {
        const next = selected.includes(optValue)
            ? selected.filter((v) => v !== optValue)
            : [...selected, optValue];
        onChange(next.length > 0 ? next : undefined);
    };
    return (_jsxs("div", { className: "report-filter report-filter-multi-select", "data-filter-type": "multiSelect", children: [_jsxs("span", { className: "report-filter-label", children: [filter.label, filter.required ? _jsx("span", { className: "report-filter-required", children: " *" }) : null] }), _jsx("div", { className: "report-filter-options", role: "group", "aria-label": filter.label, children: (filter.options ?? []).map((opt, i) => (_jsxs("label", { className: "report-filter-option", children: [_jsx("input", { type: "checkbox", checked: selected.includes(opt?.value ?? ""), onChange: () => toggle(opt?.value ?? "") }), _jsx("span", { children: opt?.label ?? opt?.value ?? "" })] }, opt?.value ?? `opt-${i}`))) })] }));
}
function NumericRangeFilterControl({ filter, value, onChange, }) {
    const range = (value ?? {});
    const min = filter.min;
    const max = filter.max;
    const step = filter.step ?? 1;
    const update = (key, raw) => {
        const n = raw === "" ? undefined : Number(raw);
        const next = key === "from"
            ? { ...range, from: n !== undefined && !Number.isNaN(n) ? n : undefined }
            : { ...range, to: n !== undefined && !Number.isNaN(n) ? n : undefined };
        const hasValue = next.from !== undefined || next.to !== undefined;
        onChange(hasValue ? next : undefined);
    };
    return (_jsxs("div", { className: "report-filter report-filter-numeric-range", "data-filter-type": "numericRange", children: [_jsxs("label", { htmlFor: `${filter.id}-from`, children: [filter.label, filter.required ? _jsx("span", { className: "report-filter-required", children: " *" }) : null] }), _jsxs("div", { className: "report-filter-numeric-range-inputs", children: [_jsx("input", { id: `${filter.id}-from`, type: "number", min: min, max: max, step: step, placeholder: "Min", value: range.from !== undefined && !Number.isNaN(range.from) ? range.from : "", onChange: (e) => update("from", e.target.value) }), _jsx("span", { className: "report-filter-sep", children: "to" }), _jsx("input", { id: `${filter.id}-to`, type: "number", min: min, max: max, step: step, placeholder: "Max", value: range.to !== undefined && !Number.isNaN(range.to) ? range.to : "", onChange: (e) => update("to", e.target.value) })] })] }));
}
export function FilterBar({ filters, filterState, onFilterChange, }) {
    const list = filters ?? [];
    if (list.length === 0)
        return null;
    return (_jsx("div", { className: "report-filter-bar", "data-testid": "filter-bar", children: list.map((filter) => {
            const value = filterState[filter.id];
            if (filter.type === "select") {
                return (_jsx(SelectFilterControl, { filter: filter, value: value, onChange: (v) => onFilterChange(filter.id, v) }, filter.id));
            }
            if (filter.type === "dateRange") {
                return (_jsx(DateRangeFilterControl, { filter: filter, value: value, onChange: (v) => onFilterChange(filter.id, v) }, filter.id));
            }
            if (filter.type === "search") {
                return (_jsx(SearchFilterControl, { filter: filter, value: value, onChange: (v) => onFilterChange(filter.id, v) }, filter.id));
            }
            if (filter.type === "multiSelect") {
                return (_jsx(MultiSelectFilterControl, { filter: filter, value: value, onChange: (v) => onFilterChange(filter.id, v) }, filter.id));
            }
            if (filter.type === "numericRange") {
                return (_jsx(NumericRangeFilterControl, { filter: filter, value: value, onChange: (v) => onFilterChange(filter.id, v) }, filter.id));
            }
            return null;
        }) }));
}

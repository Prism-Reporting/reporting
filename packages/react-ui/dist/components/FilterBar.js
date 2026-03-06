import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function SelectFilterControl({ filter, value, onChange, }) {
    const current = String(value ?? "");
    return (_jsxs("div", { className: "report-filter", "data-filter-type": "select", children: [_jsx("label", { htmlFor: filter.id, children: filter.label }), _jsxs("select", { id: filter.id, value: current, onChange: (e) => onChange(e.target.value || undefined), children: [_jsx("option", { value: "", children: "All" }), filter.options.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] })] }));
}
function DateRangeFilterControl({ filter, value, onChange, }) {
    const range = (value ?? {});
    return (_jsxs("div", { className: "report-filter", "data-filter-type": "dateRange", children: [_jsx("label", { htmlFor: `${filter.id}-from`, children: filter.label }), _jsxs("div", { className: "report-filter-date-range", children: [_jsx("input", { id: `${filter.id}-from`, type: "date", value: range.from ?? "", onChange: (e) => onChange({ ...range, from: e.target.value || undefined }) }), _jsx("span", { className: "report-filter-sep", children: "to" }), _jsx("input", { id: `${filter.id}-to`, type: "date", value: range.to ?? "", onChange: (e) => onChange({ ...range, to: e.target.value || undefined }) })] })] }));
}
function SearchFilterControl({ filter, value, onChange, }) {
    return (_jsxs("div", { className: "report-filter", "data-filter-type": "search", children: [_jsx("label", { htmlFor: filter.id, children: filter.label }), _jsx("input", { id: filter.id, type: "search", placeholder: filter.placeholder ?? "Search...", value: String(value ?? ""), onChange: (e) => onChange(e.target.value || undefined) })] }));
}
export function FilterBar({ filters, filterState, onFilterChange, }) {
    if (filters.length === 0)
        return null;
    return (_jsx("div", { className: "report-filter-bar", "data-testid": "filter-bar", children: filters.map((filter) => {
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
            return null;
        }) }));
}

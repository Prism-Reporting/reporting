import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function TableWidgetView({ title, data }) {
    const { rows, columns } = data;
    return (_jsxs("div", { className: "report-widget report-table", "data-testid": "table-widget", children: [title && _jsx("h3", { className: "report-widget-title", children: title }), _jsx("div", { className: "report-table-container", children: _jsxs("table", { children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((col) => (_jsx("th", { children: col.label }, col.key))) }) }), _jsx("tbody", { children: rows.map((row, i) => (_jsx("tr", { children: columns.map((col) => (_jsx("td", { children: String(row[col.key] ?? "") }, col.key))) }, i))) })] }) })] }));
}

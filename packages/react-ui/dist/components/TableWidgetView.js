import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { WidgetHeader } from "./WidgetHeader.js";
function TableBody({ rows, columns, }) {
    return (_jsx("tbody", { children: rows.map((row, i) => (_jsx("tr", { children: columns.map((col) => (_jsx("td", { children: String(row[col.key] ?? "") }, col.key))) }, i))) }));
}
export function TableWidgetView({ title, data, queryInfo }) {
    const { rows, columns, groups } = data;
    const useGroups = groups && groups.length > 0;
    return (_jsxs("div", { className: "report-widget report-table", "data-testid": "table-widget", children: [_jsx(WidgetHeader, { title: title, queryInfo: queryInfo }), _jsx("div", { className: "report-table-container", children: useGroups ? (groups.map((group, gIdx) => (_jsxs("div", { className: "report-table-group", children: [_jsx("h4", { className: "report-table-group-title", children: group.label }), _jsxs("table", { children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((col) => (_jsx("th", { children: col.label }, col.key))) }) }), _jsx(TableBody, { rows: group.rows, columns: columns })] })] }, gIdx)))) : (_jsxs("table", { children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((col) => (_jsx("th", { children: col.label }, col.key))) }) }), _jsx(TableBody, { rows: rows, columns: columns })] })) })] }));
}

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { exportTableToCsv } from "@reporting/core";
import { WidgetHeader } from "./WidgetHeader.js";
function buildDrillDownUrl(urlTemplate, row, paramKeys) {
    let url = urlTemplate;
    const keys = paramKeys && paramKeys.length > 0
        ? paramKeys
        : (urlTemplate.match(/\{(\w+)\}/g) ?? []).map((m) => m.slice(1, -1));
    for (const key of keys) {
        const val = row[key];
        const str = val === undefined || val === null ? "" : String(val);
        url = url.replace(new RegExp(`\\{${escapeRegExp(key)}\\}`, "g"), encodeURIComponent(str));
    }
    return url;
}
function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function TableBody({ rows, columns, drillDown, }) {
    const target = drillDown?.target ?? "_blank";
    return (_jsx("tbody", { children: rows.map((row, i) => {
            const url = drillDown
                ? buildDrillDownUrl(drillDown.urlTemplate, row, drillDown.paramKeys)
                : null;
            const handleClick = url && target === "_self"
                ? () => {
                    window.location.href = url;
                }
                : url && target === "_blank"
                    ? () => {
                        window.open(url, "_blank", "noopener,noreferrer");
                    }
                    : undefined;
            const trProps = handleClick
                ? {
                    role: "button",
                    onClick: handleClick,
                    onKeyDown: (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleClick();
                        }
                    },
                    tabIndex: 0,
                    className: "report-table-row-clickable",
                }
                : {};
            return (_jsxs("tr", { ...trProps, children: [columns.map((col) => (_jsx("td", { children: String(row[col.key] ?? "") }, col.key))), drillDown && (_jsx("td", { className: "report-table-drill-cell", children: _jsx("a", { href: url ?? "#", target: target, rel: target === "_blank" ? "noopener noreferrer" : undefined, onClick: (e) => {
                                e.stopPropagation();
                                if (target === "_self") {
                                    e.preventDefault();
                                    window.location.href = url ?? "#";
                                }
                            }, className: "report-table-drill-link", children: "View" }) }))] }, i));
        }) }));
}
function TableFooter({ columns, footer, }) {
    return (_jsx("tfoot", { children: _jsx("tr", { className: "report-table-footer", children: columns.map((col) => (_jsx("td", { children: col.key === "_drill" ? "" : footer[col.key] != null ? String(footer[col.key]) : "" }, col.key))) }) }));
}
function downloadCsv(csv, filename) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
export function TableWidgetView({ title, data, queryInfo }) {
    const { rows, columns, groups, footer, drillDown } = data;
    const useGroups = groups && groups.length > 0;
    const hasFooter = footer && Object.keys(footer).length > 0;
    const showDrillColumn = Boolean(drillDown);
    const flatRows = useGroups
        ? (groups ?? []).flatMap((g) => g.rows)
        : rows;
    const hasData = flatRows.length > 0;
    const displayColumns = showDrillColumn
        ? [...columns, { key: "_drill", label: "" }]
        : columns;
    const handleExportCsv = () => {
        const csv = exportTableToCsv(columns, flatRows);
        const base = (title ?? "table").replace(/[^a-z0-9-_]/gi, "-").replace(/-+/g, "-") || "table";
        downloadCsv(csv, `${base}.csv`);
    };
    const renderTable = (tableRows, includeFooter) => (_jsxs(_Fragment, { children: [_jsx("thead", { children: _jsx("tr", { children: displayColumns.map((col) => (_jsx("th", { children: col.label }, col.key))) }) }), _jsx(TableBody, { rows: tableRows, columns: columns, drillDown: drillDown }), includeFooter && hasFooter && (_jsx(TableFooter, { columns: displayColumns, footer: footer }))] }));
    return (_jsxs("div", { className: "report-widget report-table", "data-testid": "table-widget", children: [_jsxs("div", { className: "report-widget-header-row", children: [_jsx(WidgetHeader, { title: title, queryInfo: queryInfo }), hasData && (_jsx("button", { type: "button", className: "report-table-export-csv", onClick: handleExportCsv, "aria-label": "Export table as CSV", children: "Export CSV" }))] }), _jsx("div", { className: "report-table-container", children: useGroups ? (_jsxs(_Fragment, { children: [groups.map((group, gIdx) => (_jsxs("div", { className: "report-table-group", children: [_jsx("h4", { className: "report-table-group-title", children: group.label }), _jsx("table", { children: renderTable(group.rows, false) })] }, gIdx))), hasFooter && (_jsx("table", { className: "report-table-footer-table", children: _jsx(TableFooter, { columns: displayColumns, footer: footer }) }))] })) : (_jsx("table", { children: renderTable(rows, true) })) })] }));
}

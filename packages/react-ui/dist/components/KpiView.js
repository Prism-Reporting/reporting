import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { WidgetHeader } from "./WidgetHeader.js";
export function KpiView({ title, data, queryInfo }) {
    const { value, label } = data;
    return (_jsxs("div", { className: "report-widget report-kpi", "data-testid": "kpi-widget", children: [_jsx(WidgetHeader, { title: title, queryInfo: queryInfo }), _jsx("div", { className: "report-kpi-value", children: String(value) }), label && _jsx("div", { className: "report-kpi-label", children: label })] }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function KpiView({ title, data }) {
    const { value, label } = data;
    return (_jsxs("div", { className: "report-widget report-kpi", "data-testid": "kpi-widget", children: [title && _jsx("h3", { className: "report-widget-title", children: title }), _jsx("div", { className: "report-kpi-value", children: String(value) }), label && _jsx("div", { className: "report-kpi-label", children: label })] }));
}

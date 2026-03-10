import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, } from "recharts";
import { WidgetHeader } from "./WidgetHeader.js";
function formatKpiValue(value, format, currencyCode, decimalPlaces) {
    if (format === "plain" || format == null) {
        return String(value);
    }
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) {
        return String(value);
    }
    const opts = {};
    if (decimalPlaces != null) {
        opts.minimumFractionDigits = decimalPlaces;
        opts.maximumFractionDigits = decimalPlaces;
    }
    switch (format) {
        case "currency":
            return new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: currencyCode ?? "USD",
                ...opts,
            }).format(num);
        case "percent":
            return new Intl.NumberFormat(undefined, {
                style: "percent",
                ...opts,
            }).format(num);
        case "number":
            return new Intl.NumberFormat(undefined, opts).format(num);
        default:
            return String(value);
    }
}
export function KpiView({ title, data, queryInfo }) {
    const { value, label, format, currencyCode, decimalPlaces, trendData } = data;
    const displayed = formatKpiValue(value, format, currencyCode, decimalPlaces);
    const trendChartData = trendData && trendData.length > 0
        ? trendData.map((v, i) => ({ index: i, value: v }))
        : null;
    return (_jsxs("div", { className: "report-widget report-kpi", "data-testid": "kpi-widget", children: [_jsx(WidgetHeader, { title: title, queryInfo: queryInfo }), _jsxs("div", { className: "report-kpi-content", children: [_jsxs("div", { className: "report-kpi-main", children: [_jsx("div", { className: "report-kpi-value", children: displayed }), label && _jsx("div", { className: "report-kpi-label", children: label })] }), trendChartData && trendChartData.length > 0 && (_jsx("div", { className: "report-kpi-sparkline", "aria-hidden": "true", children: _jsx(ResponsiveContainer, { width: "100%", height: 32, children: _jsxs(AreaChart, { data: trendChartData, margin: { top: 0, right: 0, left: 0, bottom: 0 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "kpi-sparkline-fill", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: "#3b82f6", stopOpacity: 0.4 }), _jsx("stop", { offset: "100%", stopColor: "#3b82f6", stopOpacity: 0 })] }) }), _jsx(XAxis, { dataKey: "index", hide: true }), _jsx(YAxis, { hide: true, domain: ["auto", "auto"] }), _jsx(Tooltip, { content: () => null }), _jsx(Area, { type: "monotone", dataKey: "value", stroke: "#3b82f6", strokeWidth: 1.5, fill: "url(#kpi-sparkline-fill)" })] }) }) }))] })] }));
}

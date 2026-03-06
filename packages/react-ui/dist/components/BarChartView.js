import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, } from "recharts";
const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
];
export function BarChartView({ title, data }) {
    const { data: chartData, categoryKey, valueKey } = data;
    return (_jsxs("div", { className: "report-widget report-bar-chart", "data-testid": "bar-chart-widget", children: [title && _jsx("h3", { className: "report-widget-title", children: title }), _jsx("div", { className: "report-chart-container", children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(RechartsBarChart, { data: chartData, margin: { top: 8, right: 8, left: 8, bottom: 8 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e5e7eb" }), _jsx(XAxis, { dataKey: categoryKey, tick: { fontSize: 12 }, tickLine: false }), _jsx(YAxis, { tick: { fontSize: 12 }, tickLine: false }), _jsx(Tooltip, { contentStyle: { borderRadius: 8, border: "1px solid #e5e7eb" } }), _jsx(Bar, { dataKey: valueKey, fill: "#3b82f6", radius: [4, 4, 0, 0], children: chartData.map((_, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, index))) })] }) }) })] }));
}

export const WIDGET_SIZE_CONSTRAINTS = {
    table: { minWidth: "320px", minHeight: "180px" },
    barChart: { minWidth: "320px", minHeight: "260px" },
    lineChart: { minWidth: "320px", minHeight: "260px" },
    stackedBarChart: { minWidth: "320px", minHeight: "260px" },
    kpi: { minWidth: "180px", minHeight: "80px" },
};
export function getWidgetSizeConstraints(type) {
    return WIDGET_SIZE_CONSTRAINTS[type];
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo } from "react";
import { resolveReport } from "@reporting/core";
const DEFAULT_PAGE_SIZE = 20;
export function ReportRenderer({ spec, dataProvider, registry, pageSize: pageSizeProp = DEFAULT_PAGE_SIZE, }) {
    const [filterState, setFilterState] = useState({});
    const [resolved, setResolved] = useState(null);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const handleFilterChange = useCallback((filterId, value) => {
        setFilterState((prev) => ({ ...prev, [filterId]: value }));
        setPage(1);
    }, []);
    const pageSize = pageSizeProp > 0 ? pageSizeProp : 0;
    const paginationEnabled = pageSize > 0;
    const dataProviderWithPagination = useMemo(() => {
        if (!paginationEnabled)
            return dataProvider;
        return {
            async runQuery(request) {
                const params = { ...request.params, page, pageSize };
                const result = await dataProvider.runQuery({ ...request, params });
                // Unwrap { data, hasMore } from API so the engine receives a plain array
                if (result && typeof result === "object" && "data" in result && Array.isArray(result.data)) {
                    const obj = result;
                    if (typeof obj.hasMore === "boolean")
                        setHasMore(obj.hasMore);
                    return obj.data;
                }
                return Array.isArray(result) ? result : [result];
            },
        };
    }, [dataProvider, page, pageSize, paginationEnabled]);
    useEffect(() => {
        let cancelled = false;
        resolveReport(spec, dataProviderWithPagination, filterState)
            .then((r) => {
            if (!cancelled) {
                setResolved(r);
                setError(null);
            }
        })
            .catch((err) => {
            if (!cancelled) {
                setError(err instanceof Error ? err.message : String(err));
                setResolved(null);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [spec, dataProviderWithPagination, filterState]);
    const FilterBarComponent = registry.filterBar;
    const TableComponent = registry.table;
    const BarChartComponent = registry.barChart;
    const KpiComponent = registry.kpi;
    if (error) {
        return (_jsxs("div", { className: "report-error", "data-testid": "report-error", children: [_jsx("strong", { children: "Error:" }), " ", error] }));
    }
    if (!resolved) {
        return (_jsx("div", { className: "report-loading", "data-testid": "report-loading", children: "Loading..." }));
    }
    const layout = spec.layout;
    const isTwoColumn = layout === "twoColumn";
    const half = Math.ceil(resolved.widgets.length / 2);
    return (_jsxs("div", { className: "report-container", "data-report-id": spec.id, children: [_jsx("header", { className: "report-header", children: _jsx("h1", { className: "report-title", children: spec.title }) }), spec.filters.length > 0 && (_jsx("div", { className: "report-filters", children: _jsx(FilterBarComponent, { filters: spec.filters, filterState: filterState, onFilterChange: handleFilterChange }) })), _jsxs("div", { className: `report-main report-layout-${layout}`, "data-layout": layout, children: [isTwoColumn ? (_jsxs("div", { className: "report-grid report-grid-two", children: [_jsx("div", { className: "report-column", children: resolved.widgets.slice(0, half).map((w) => (_jsx(ReportWidget, { widget: w, registry: {
                                        table: TableComponent,
                                        barChart: BarChartComponent,
                                        kpi: KpiComponent,
                                        filterBar: FilterBarComponent,
                                    } }, w.spec.id))) }), _jsx("div", { className: "report-column", children: resolved.widgets.slice(half).map((w) => (_jsx(ReportWidget, { widget: w, registry: {
                                        table: TableComponent,
                                        barChart: BarChartComponent,
                                        kpi: KpiComponent,
                                        filterBar: FilterBarComponent,
                                    } }, w.spec.id))) })] })) : (_jsx("div", { className: "report-column", children: resolved.widgets.map((w) => (_jsx(ReportWidget, { widget: w, registry: {
                                table: TableComponent,
                                barChart: BarChartComponent,
                                kpi: KpiComponent,
                                filterBar: FilterBarComponent,
                            } }, w.spec.id))) })), paginationEnabled && (_jsxs("nav", { className: "report-pagination", "aria-label": "Pagination", children: [_jsx("button", { type: "button", className: "report-pagination-prev", disabled: page <= 1, onClick: () => setPage((p) => Math.max(1, p - 1)), children: "Previous" }), _jsxs("span", { className: "report-pagination-page", children: ["Page ", page] }), _jsx("button", { type: "button", className: "report-pagination-next", disabled: !hasMore, onClick: () => setPage((p) => p + 1), children: "Next" })] }))] })] }));
}
function ReportWidget({ widget, registry, }) {
    const { spec, data } = widget;
    if (data.type === "table") {
        return (_jsx(registry.table, { title: spec.title, data: data.data }));
    }
    if (data.type === "barChart") {
        return (_jsx(registry.barChart, { title: spec.title, data: data.data }));
    }
    if (data.type === "kpi") {
        return (_jsx(registry.kpi, { title: spec.title, data: data.data }));
    }
    return null;
}

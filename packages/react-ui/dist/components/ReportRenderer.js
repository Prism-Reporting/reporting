import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo } from "react";
import { resolveReport, getWidgetGroupIds, filterAppliesToGroupIds, buildParamsForDataSource, } from "@reporting/core";
const DEFAULT_PAGE_SIZE = 20;
const MAX_VISUALIZATION_ROWS = 1000;
export function ReportRenderer({ spec, dataProvider, registry, pageSize: pageSizeProp = DEFAULT_PAGE_SIZE, }) {
    const [filterState, setFilterState] = useState({});
    const [resolved, setResolved] = useState(null);
    const [error, setError] = useState(null);
    const [widgetOverrides, setWidgetOverrides] = useState({});
    const [loadingWidgetIds, setLoadingWidgetIds] = useState({});
    useEffect(() => {
        let cancelled = false;
        resolveReport(spec, dataProvider, filterState)
            .then((r) => {
            if (!cancelled) {
                setResolved(r);
                setError(null);
                setWidgetOverrides({});
                setLoadingWidgetIds({});
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
    }, [spec, dataProvider]);
    const layout = spec.layout;
    const layoutOptions = spec.layoutOptions;
    const gridStyle = useMemo(() => {
        const s = {};
        if (layoutOptions?.columnGap)
            s.columnGap = layoutOptions.columnGap;
        if (layoutOptions?.rowGap)
            s.rowGap = layoutOptions.rowGap;
        return Object.keys(s).length ? s : undefined;
    }, [layoutOptions?.columnGap, layoutOptions?.rowGap]);
    const [activeTabId, setActiveTabId] = useState(null);
    useEffect(() => {
        if (resolved?.tabs && resolved.tabs.length > 0) {
            const firstId = resolved.tabs[0].id;
            setActiveTabId((prev) => (resolved.tabs.some((t) => t.id === prev) ? prev : firstId));
        }
        else {
            setActiveTabId(null);
        }
    }, [resolved?.tabs]);
    const FilterBarComponent = registry.filterBar;
    const TableComponent = registry.table;
    const BarChartComponent = registry.barChart;
    const StackedBarChartComponent = registry.stackedBarChart;
    const LineChartComponent = registry.lineChart;
    const KpiComponent = registry.kpi;
    const registryRef = useMemo(() => ({
        table: TableComponent,
        barChart: BarChartComponent,
        stackedBarChart: StackedBarChartComponent,
        lineChart: LineChartComponent,
        kpi: KpiComponent,
        filterBar: FilterBarComponent,
    }), [
        TableComponent,
        BarChartComponent,
        StackedBarChartComponent,
        LineChartComponent,
        KpiComponent,
        FilterBarComponent,
    ]);
    const handlePageChange = useCallback(async (widgetId, nextPage) => {
        const widget = spec.widgets.find((candidate) => candidate.id === widgetId);
        if (!widget)
            return;
        const ds = spec.dataSources[widget.dataSource];
        if (!ds)
            return;
        const normalizedPage = Math.max(1, nextPage);
        const fallbackPageSize = ds.delivery?.pageSize ?? ds.pagination?.pageSize ?? (pageSizeProp > 0 ? pageSizeProp : undefined);
        setLoadingWidgetIds((prev) => ({ ...prev, [widgetId]: true }));
        try {
            const partial = await resolveReport({
                ...spec,
                widgets: [widget],
            }, {
                async runQuery(request) {
                    if (request.execution?.deliveryMode !== "paginatedList") {
                        return dataProvider.runQuery(request);
                    }
                    return dataProvider.runQuery({
                        ...request,
                        execution: {
                            ...request.execution,
                            page: normalizedPage,
                            ...(request.execution.pageSize != null
                                ? { pageSize: request.execution.pageSize }
                                : fallbackPageSize != null
                                    ? { pageSize: fallbackPageSize }
                                    : {}),
                        },
                        context: {
                            ...(request.context ?? {}),
                            widgetId,
                            dataSource: widget.dataSource,
                        },
                    });
                },
            }, filterState);
            const partialWidget = partial.widgets[0];
            const partialQuery = partial.queries.find((query) => query.widgetId === widgetId) ?? partial.queries[0];
            if (!partialWidget)
                return;
            setWidgetOverrides((prev) => ({
                ...prev,
                [widgetId]: {
                    widget: partialWidget,
                    ...(partialQuery ? { queryInfo: partialQuery } : {}),
                },
            }));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setLoadingWidgetIds((prev) => {
                const next = { ...prev };
                delete next[widgetId];
                return next;
            });
        }
    }, [dataProvider, filterState, pageSizeProp, spec]);
    const handleFilterChange = useCallback((filterId, value) => {
        setFilterState((prev) => {
            const nextState = { ...prev, [filterId]: value };
            if (!resolved) {
                return nextState;
            }
            const affectedWidgets = spec.widgets.filter((widget) => {
                const groupIds = getWidgetGroupIds(spec, widget.id);
                const previousParams = buildParamsForDataSource(widget.dataSource, spec, prev, groupIds);
                const nextParams = buildParamsForDataSource(widget.dataSource, spec, nextState, groupIds);
                return !areParamsEqual(previousParams, nextParams);
            });
            if (affectedWidgets.length === 0) {
                return nextState;
            }
            const affectedWidgetIds = new Set(affectedWidgets.map((widget) => widget.id));
            setLoadingWidgetIds((current) => ({
                ...current,
                ...Object.fromEntries(affectedWidgets.map((widget) => [widget.id, true])),
            }));
            setWidgetOverrides((current) => {
                const nextOverrides = { ...current };
                for (const widgetId of affectedWidgetIds) {
                    delete nextOverrides[widgetId];
                }
                return nextOverrides;
            });
            void resolveReport({
                ...spec,
                widgets: affectedWidgets,
            }, dataProvider, nextState)
                .then((partial) => {
                setResolved((currentResolved) => {
                    if (!currentResolved)
                        return currentResolved;
                    return mergeResolvedSubset(currentResolved, partial);
                });
                setError(null);
            })
                .catch((err) => {
                setError(err instanceof Error ? err.message : String(err));
            })
                .finally(() => {
                setLoadingWidgetIds((current) => {
                    const nextLoading = { ...current };
                    for (const widgetId of affectedWidgetIds) {
                        delete nextLoading[widgetId];
                    }
                    return nextLoading;
                });
            });
            return nextState;
        });
    }, [dataProvider, resolved, spec]);
    const renderWidgets = useCallback((widgets, resolvedQueries, parentGroupIds = []) => {
        const isTwoColumn = layout === "twoColumn";
        const half = Math.ceil(widgets.length / 2);
        return isTwoColumn ? (_jsxs("div", { className: "report-grid report-grid-two", style: gridStyle, children: [_jsx("div", { className: "report-column", children: widgets.slice(0, half).map((w) => (_jsx(ReportWidget, { widget: widgetOverrides[w.spec.id]?.widget ?? w, queryInfo: widgetOverrides[w.spec.id]?.queryInfo ??
                            resolvedQueries.find((q) => q.widgetId === w.spec.id) ??
                            resolvedQueries.find((q) => q.dataSource === w.spec.dataSource), filters: spec.filters, filterState: filterState, onFilterChange: handleFilterChange, parentGroupIds: parentGroupIds, reportSpec: spec, registry: registryRef, onPageChange: handlePageChange, loading: Boolean(loadingWidgetIds[w.spec.id]) }, w.spec.id))) }), _jsx("div", { className: "report-column", children: widgets.slice(half).map((w) => (_jsx(ReportWidget, { widget: widgetOverrides[w.spec.id]?.widget ?? w, queryInfo: widgetOverrides[w.spec.id]?.queryInfo ??
                            resolvedQueries.find((q) => q.widgetId === w.spec.id) ??
                            resolvedQueries.find((q) => q.dataSource === w.spec.dataSource), filters: spec.filters, filterState: filterState, onFilterChange: handleFilterChange, parentGroupIds: parentGroupIds, reportSpec: spec, registry: registryRef, onPageChange: handlePageChange, loading: Boolean(loadingWidgetIds[w.spec.id]) }, w.spec.id))) })] })) : (_jsx("div", { className: "report-grid report-grid-one", style: gridStyle, children: _jsx("div", { className: "report-column", children: widgets.map((w) => (_jsx(ReportWidget, { widget: widgetOverrides[w.spec.id]?.widget ?? w, queryInfo: widgetOverrides[w.spec.id]?.queryInfo ??
                        resolvedQueries.find((q) => q.widgetId === w.spec.id) ??
                        resolvedQueries.find((q) => q.dataSource === w.spec.dataSource), filters: spec.filters, filterState: filterState, onFilterChange: handleFilterChange, parentGroupIds: parentGroupIds, reportSpec: spec, registry: registryRef, onPageChange: handlePageChange, loading: Boolean(loadingWidgetIds[w.spec.id]) }, w.spec.id))) }) }));
    }, [
        filterState,
        gridStyle,
        handleFilterChange,
        handlePageChange,
        layout,
        loadingWidgetIds,
        registryRef,
        spec,
        widgetOverrides,
    ]);
    if (error) {
        return (_jsxs("div", { className: "report-error", "data-testid": "report-error", children: [_jsx("strong", { children: "Error:" }), " ", error] }));
    }
    if (!resolved) {
        return (_jsx("div", { className: "report-loading", "data-testid": "report-loading", children: "Loading..." }));
    }
    const mainContent = resolved.tabs && resolved.tabs.length > 0 ? (_jsxs("div", { className: "report-tabs", children: [_jsx("div", { className: "report-tab-list", role: "tablist", children: resolved.tabs.map((tab) => (_jsx("button", { type: "button", role: "tab", "aria-selected": activeTabId === tab.id, className: `report-tab ${activeTabId === tab.id ? "report-tab-active" : ""}`, onClick: () => setActiveTabId(tab.id), children: tab.label }, tab.id))) }), resolved.tabs.map((tab) => (_jsx("div", { role: "tabpanel", hidden: activeTabId !== tab.id, className: "report-tab-panel", "aria-labelledby": undefined, children: activeTabId === tab.id && (_jsxs(_Fragment, { children: [_jsx(ScopedFilterBar, { filters: getScopedFilters(spec.filters, getContainerGroupIds(spec, "tab", tab.id)), filterState: filterState, onFilterChange: handleFilterChange, filterBar: FilterBarComponent, label: getScopedFilterLabel(spec, "tab", tab.id, tab.label) }), renderWidgets(tab.widgets, resolved.queries, getContainerGroupIds(spec, "tab", tab.id))] })) }, tab.id)))] })) : resolved.sections && resolved.sections.length > 0 ? (_jsx("div", { className: "report-sections", children: resolved.sections.map((section) => (_jsxs("section", { className: "report-section", "aria-labelledby": section.title ? `section-${section.id}` : undefined, children: [section.title && (_jsx("h2", { id: `section-${section.id}`, className: "report-section-title", children: section.title })), _jsx(ScopedFilterBar, { filters: getScopedFilters(spec.filters, getContainerGroupIds(spec, "section", section.id)), filterState: filterState, onFilterChange: handleFilterChange, filterBar: FilterBarComponent, label: getScopedFilterLabel(spec, "section", section.id, section.title) }), renderWidgets(section.widgets, resolved.queries, getContainerGroupIds(spec, "section", section.id))] }, section.id))) })) : (renderWidgets(resolved.widgets, resolved.queries));
    return (_jsxs("div", { className: "report-container", "data-report-id": spec.id, children: [_jsxs("header", { className: "report-header", children: [_jsx("div", { className: "report-header-title-row", children: _jsx("h1", { className: "report-title", children: spec.title }) }), resolved.version && (_jsxs("p", { className: "report-version", "aria-label": "Report version", children: ["v", resolved.version] }))] }), getGlobalFilters(spec.filters).length > 0 && (_jsx("div", { className: "report-filters", children: _jsx(FilterBarComponent, { filters: getGlobalFilters(spec.filters), filterState: filterState, onFilterChange: handleFilterChange }) })), _jsx("div", { className: `report-main report-layout-${layout}`, "data-layout": layout, children: mainContent })] }));
}
function ReportWidget({ widget, queryInfo, filters, filterState, onFilterChange, parentGroupIds, reportSpec, registry, onPageChange, loading, }) {
    const { spec, data } = widget;
    const pagination = queryInfo?.pagination;
    const paginationSummary = pagination ? buildPaginationSummary(pagination, queryInfo.rowCount) : null;
    const blockReason = getVisualizationBlockReason(widget, queryInfo);
    const widgetGroupIds = getWidgetGroupIds(reportSpec, spec.id);
    const scopedFilters = getWidgetScopedFilters(filters, widgetGroupIds, parentGroupIds);
    let content = null;
    if (data.type === "table") {
        content = (_jsxs(_Fragment, { children: [_jsx(registry.table, { title: spec.title, data: data.data, queryInfo: queryInfo }), pagination && (_jsxs("nav", { className: "report-pagination", "aria-label": `${spec.title ?? spec.id} pagination`, children: [_jsx("button", { type: "button", className: "report-pagination-prev", disabled: loading || pagination.page <= 1, onClick: () => onPageChange(spec.id, pagination.page - 1), children: "Previous" }), _jsx("span", { className: "report-pagination-page", children: paginationSummary }), _jsx("button", { type: "button", className: "report-pagination-next", disabled: loading || !pagination.hasMore, onClick: () => onPageChange(spec.id, pagination.page + 1), children: loading ? "Loading..." : "Next" })] }))] }));
    }
    else if (data.type === "barChart") {
        content = blockReason ? (_jsx(VisualizationBlockedState, { title: spec.title, message: blockReason })) : (_jsx(registry.barChart, { title: spec.title, data: data.data, queryInfo: queryInfo }));
    }
    else if (data.type === "stackedBarChart") {
        content = blockReason ? (_jsx(VisualizationBlockedState, { title: spec.title, message: blockReason })) : (_jsx(registry.stackedBarChart, { title: spec.title, data: data.data, queryInfo: queryInfo }));
    }
    else if (data.type === "lineChart") {
        content = blockReason ? (_jsx(VisualizationBlockedState, { title: spec.title, message: blockReason })) : (_jsx(registry.lineChart, { title: spec.title, data: data.data, queryInfo: queryInfo }));
    }
    else if (data.type === "kpi") {
        content = blockReason ? (_jsx(VisualizationBlockedState, { title: spec.title, message: blockReason, compact: true })) : (_jsx(registry.kpi, { title: spec.title, data: data.data, queryInfo: queryInfo }));
    }
    if (!content)
        return null;
    return (_jsxs("div", { className: `report-widget-wrapper report-widget-wrapper-${spec.type}`, children: [_jsx(ScopedFilterBar, { filters: scopedFilters, filterState: filterState, onFilterChange: onFilterChange, filterBar: registry.filterBar, label: spec.title ?? spec.id, compact: true }), content] }));
}
function VisualizationBlockedState({ title, message, compact = false, }) {
    return (_jsxs("div", { className: "report-widget report-visualization-blocked", children: [_jsx("div", { className: "report-widget-header", children: title ? _jsx("h3", { className: "report-widget-title", children: title }) : _jsx("span", {}) }), _jsxs("div", { className: `report-visualization-blocked-body${compact ? " report-visualization-blocked-body-compact" : ""}`, children: [_jsxs("div", { className: "report-visualization-skeleton", "aria-hidden": "true", children: [_jsx("span", { className: "report-visualization-skeleton-line report-visualization-skeleton-line-1" }), _jsx("span", { className: "report-visualization-skeleton-line report-visualization-skeleton-line-2" }), _jsx("span", { className: "report-visualization-skeleton-line report-visualization-skeleton-line-3" }), _jsx("span", { className: "report-visualization-skeleton-bar report-visualization-skeleton-bar-1" }), _jsx("span", { className: "report-visualization-skeleton-bar report-visualization-skeleton-bar-2" }), _jsx("span", { className: "report-visualization-skeleton-bar report-visualization-skeleton-bar-3" }), _jsx("span", { className: "report-visualization-skeleton-bar report-visualization-skeleton-bar-4" })] }), _jsx("div", { className: "report-visualization-overlay", children: _jsx("p", { children: message }) })] })] }));
}
function buildPaginationSummary(pagination, rowCount) {
    const from = rowCount === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
    const to = rowCount === 0 ? 0 : from + rowCount - 1;
    const totalPages = pagination.totalPages ?? (pagination.pageSize > 0 ? Math.ceil(pagination.totalCount / pagination.pageSize) || 1 : 1);
    if (pagination.totalCount > 0) {
        return `Showing ${from}-${to} of ${pagination.totalCount} (page ${pagination.page} of ${totalPages})`;
    }
    return `Page ${pagination.page} of ${totalPages}`;
}
function getVisualizationBlockReason(widget, queryInfo) {
    if (widget.data.type === "table")
        return null;
    if (queryInfo?.limitExceeded) {
        return (queryInfo.limitExceeded.message ??
            `This visualization would include ${queryInfo.limitExceeded.totalCount.toLocaleString()} rows, which is above the supported limit of ${queryInfo.limitExceeded.limit.toLocaleString()}. Narrow the filters or use an aggregated query.`);
    }
    const totalRowCount = queryInfo?.pagination?.totalCount ?? queryInfo?.rowCount ?? 0;
    const totalPages = queryInfo?.pagination?.totalPages ?? (queryInfo?.pagination?.pageSize && queryInfo.pagination.pageSize > 0 ? Math.ceil((queryInfo.pagination.totalCount ?? 0) / queryInfo.pagination.pageSize) || 1 : 1);
    const isIncompleteDueToPagination = Boolean(queryInfo?.pagination &&
        (queryInfo.pagination.page > 1 ||
            queryInfo.pagination.hasMore ||
            (totalPages > 1 && queryInfo.pagination.page < totalPages) ||
            queryInfo.pagination.totalCount > queryInfo.rowCount));
    if (isIncompleteDueToPagination) {
        return "This visualization is based on paginated data, so not all rows are available. Narrow the filters or use an aggregated query.";
    }
    if (totalRowCount > MAX_VISUALIZATION_ROWS) {
        return `This visualization supports up to ${MAX_VISUALIZATION_ROWS.toLocaleString()} rows. Narrow the filters or use an aggregated query.`;
    }
    return null;
}
function mergeResolvedSubset(current, partial) {
    const widgetById = new Map(partial.widgets.map((widget) => [widget.spec.id, widget]));
    const widgets = current.widgets.map((widget) => widgetById.get(widget.spec.id) ?? widget);
    const queryByWidgetId = new Map(partial.queries
        .filter((query) => typeof query.widgetId === "string")
        .map((query) => [query.widgetId, query]));
    const queries = current.queries.map((query) => {
        if (!query.widgetId)
            return query;
        return queryByWidgetId.get(query.widgetId) ?? query;
    });
    const mapWidgets = (items) => {
        if (!items)
            return items;
        return items.map((item) => ({
            ...item,
            widgets: item.widgets.map((widget) => widgetById.get(widget.spec.id) ?? widget),
        }));
    };
    return {
        ...current,
        filterState: partial.filterState,
        widgets,
        queries,
        ...(current.sections ? { sections: mapWidgets(current.sections) } : {}),
        ...(current.tabs ? { tabs: mapWidgets(current.tabs) } : {}),
    };
}
function getGlobalFilters(filters) {
    return filters.filter((filter) => !Array.isArray(filter.groupIds) || filter.groupIds.length === 0);
}
function getScopedFilters(filters, groupIds) {
    if (groupIds.length === 0)
        return [];
    return filters.filter((filter) => Array.isArray(filter.groupIds) &&
        filter.groupIds.length > 0 &&
        filterAppliesToGroupIds(filter, groupIds));
}
function getWidgetScopedFilters(filters, widgetGroupIds, parentGroupIds) {
    const parentFilterIds = new Set(getScopedFilters(filters, parentGroupIds).map((filter) => filter.id));
    return getScopedFilters(filters, widgetGroupIds).filter((filter) => !parentFilterIds.has(filter.id));
}
function getContainerGroupIds(spec, kind, id) {
    const ownIds = [id];
    const container = kind === "tab"
        ? spec.tabs?.find((tab) => tab.id === id)
        : spec.sections?.find((section) => section.id === id);
    const inheritedIds = Array.isArray(container?.groupIds) ? container.groupIds : [];
    return Array.from(new Set([...ownIds, ...inheritedIds]));
}
function getScopedFilterLabel(spec, kind, id, fallback) {
    if (fallback && fallback.trim() !== "")
        return fallback;
    const group = spec.groups?.find((candidate) => candidate.id === id);
    if (group?.label && group.label.trim() !== "")
        return group.label;
    return kind === "tab" ? "this tab" : "this section";
}
function ScopedFilterBar({ filters, filterState, onFilterChange, filterBar: FilterBarComponent, label, compact = false, }) {
    if (filters.length === 0)
        return null;
    return (_jsxs("div", { className: `report-scoped-filters${compact ? " report-scoped-filters-compact" : ""}`, children: [_jsxs("p", { className: "report-scoped-filters-note", children: ["Filters for ", label, ". Prefer global filters unless this view needs extra detail."] }), _jsx(FilterBarComponent, { filters: filters, filterState: filterState, onFilterChange: onFilterChange })] }));
}
function areParamsEqual(left, right) {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    if (leftKeys.length !== rightKeys.length)
        return false;
    return leftKeys.every((key, index) => {
        if (key !== rightKeys[index])
            return false;
        return stringifyComparableValue(left[key]) === stringifyComparableValue(right[key]);
    });
}
function stringifyComparableValue(value) {
    if (value === undefined)
        return "undefined";
    if (value === null)
        return "null";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    return JSON.stringify(value);
}

import { useState, useEffect, useCallback, useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";
import type {
  ReportSpec,
  DataProvider,
  ResolvedQueryExecution,
  FilterSpec,
} from "@reporting/core";
import {
  resolveReport,
  getWidgetGroupIds,
  filterAppliesToGroupIds,
  buildParamsForDataSource,
} from "@reporting/core";
import type { ComponentRegistry, ResolvedReport } from "@reporting/core";

const DEFAULT_PAGE_SIZE = 20;
const MAX_VISUALIZATION_ROWS = 1000;

export interface ReportRendererProps {
  spec: ReportSpec;
  dataProvider: DataProvider;
  registry: ComponentRegistry;
  /** Optional fallback page size for paginatedList data sources that omit delivery.pageSize. */
  pageSize?: number;
}

export function ReportRenderer({
  spec,
  dataProvider,
  registry,
  pageSize: pageSizeProp = DEFAULT_PAGE_SIZE,
}: ReportRendererProps) {
  const [filterState, setFilterState] = useState<Record<string, unknown>>({});
  const [resolved, setResolved] = useState<ResolvedReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [widgetOverrides, setWidgetOverrides] = useState<
    Record<string, { widget: ResolvedReport["widgets"][0]; queryInfo?: ResolvedQueryExecution }>
  >({});
  const [loadingWidgetIds, setLoadingWidgetIds] = useState<Record<string, boolean>>({});

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
  const gridStyle = useMemo((): CSSProperties | undefined => {
    const s: CSSProperties = {};
    if (layoutOptions?.columnGap) s.columnGap = layoutOptions.columnGap;
    if (layoutOptions?.rowGap) s.rowGap = layoutOptions.rowGap;
    return Object.keys(s).length ? s : undefined;
  }, [layoutOptions?.columnGap, layoutOptions?.rowGap]);

  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  useEffect(() => {
    if (resolved?.tabs && resolved.tabs.length > 0) {
      const firstId = resolved.tabs[0].id;
      setActiveTabId((prev) => (resolved.tabs!.some((t) => t.id === prev) ? prev : firstId));
    } else {
      setActiveTabId(null);
    }
  }, [resolved?.tabs]);

  const FilterBarComponent = registry.filterBar;
  const TableComponent = registry.table;
  const BarChartComponent = registry.barChart;
  const StackedBarChartComponent = registry.stackedBarChart;
  const LineChartComponent = registry.lineChart;
  const KpiComponent = registry.kpi;
  const registryRef = useMemo(
    () => ({
      table: TableComponent,
      barChart: BarChartComponent,
      stackedBarChart: StackedBarChartComponent,
      lineChart: LineChartComponent,
      kpi: KpiComponent,
      filterBar: FilterBarComponent,
    }),
    [
      TableComponent,
      BarChartComponent,
      StackedBarChartComponent,
      LineChartComponent,
      KpiComponent,
      FilterBarComponent,
    ]
  );

  const handlePageChange = useCallback(
    async (widgetId: string, nextPage: number) => {
      const widget = spec.widgets.find((candidate) => candidate.id === widgetId);
      if (!widget) return;

      const ds = spec.dataSources[widget.dataSource];
      if (!ds) return;

      const normalizedPage = Math.max(1, nextPage);
      const fallbackPageSize =
        ds.delivery?.pageSize ?? ds.pagination?.pageSize ?? (pageSizeProp > 0 ? pageSizeProp : undefined);

      setLoadingWidgetIds((prev) => ({ ...prev, [widgetId]: true }));

      try {
        const partial = await resolveReport(
          buildPartialReportSpec(spec, [widget.id]),
          {
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
          },
          filterState
        );

        const partialWidget = partial.widgets[0];
        const partialQuery =
          partial.queries.find((query) => query.widgetId === widgetId) ?? partial.queries[0];

        if (!partialWidget) return;

        setWidgetOverrides((prev) => ({
          ...prev,
          [widgetId]: {
            widget: partialWidget,
            ...(partialQuery ? { queryInfo: partialQuery } : {}),
          },
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoadingWidgetIds((prev) => {
          const next = { ...prev };
          delete next[widgetId];
          return next;
        });
      }
    },
    [dataProvider, filterState, pageSizeProp, spec]
  );

  const handleFilterChange = useCallback(
    (filterId: string, value: unknown) => {
      setFilterState((prev) => {
        const nextState = { ...prev, [filterId]: value };

        if (!resolved) {
          return nextState;
        }

        const affectedWidgets = spec.widgets.filter((widget) => {
          const groupIds = getWidgetGroupIds(spec, widget.id);
          const previousParams = buildParamsForDataSource(
            widget.dataSource,
            spec,
            prev,
            groupIds
          );
          const nextParams = buildParamsForDataSource(
            widget.dataSource,
            spec,
            nextState,
            groupIds
          );
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

        void resolveReport(
          buildPartialReportSpec(
            spec,
            affectedWidgets.map((widget) => widget.id)
          ),
          dataProvider,
          nextState
        )
          .then((partial) => {
            setResolved((currentResolved) => {
              if (!currentResolved) return currentResolved;
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
    },
    [dataProvider, resolved, spec]
  );

  const renderWidgets = useCallback(
    (
      widgets: ResolvedReport["widgets"],
      resolvedQueries: ResolvedReport["queries"],
      parentGroupIds: string[] = []
    ) => {
      const isTwoColumn = layout === "twoColumn";
      const half = Math.ceil(widgets.length / 2);
      return isTwoColumn ? (
        <div className="report-grid report-grid-two" style={gridStyle}>
          <div className="report-column">
            {widgets.slice(0, half).map((w) => (
              <ReportWidget
                key={w.spec.id}
                widget={widgetOverrides[w.spec.id]?.widget ?? w}
                queryInfo={
                  widgetOverrides[w.spec.id]?.queryInfo ??
                  resolvedQueries.find((q) => q.widgetId === w.spec.id) ??
                  resolvedQueries.find((q) => q.dataSource === w.spec.dataSource)
                }
                filters={spec.filters}
                filterState={filterState}
                onFilterChange={handleFilterChange}
                parentGroupIds={parentGroupIds}
                reportSpec={spec}
                registry={registryRef}
                onPageChange={handlePageChange}
                loading={Boolean(loadingWidgetIds[w.spec.id])}
              />
            ))}
          </div>
          <div className="report-column">
            {widgets.slice(half).map((w) => (
              <ReportWidget
                key={w.spec.id}
                widget={widgetOverrides[w.spec.id]?.widget ?? w}
                queryInfo={
                  widgetOverrides[w.spec.id]?.queryInfo ??
                  resolvedQueries.find((q) => q.widgetId === w.spec.id) ??
                  resolvedQueries.find((q) => q.dataSource === w.spec.dataSource)
                }
                filters={spec.filters}
                filterState={filterState}
                onFilterChange={handleFilterChange}
                parentGroupIds={parentGroupIds}
                reportSpec={spec}
                registry={registryRef}
                onPageChange={handlePageChange}
                loading={Boolean(loadingWidgetIds[w.spec.id])}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="report-grid report-grid-one" style={gridStyle}>
          <div className="report-column">
            {widgets.map((w) => (
              <ReportWidget
                key={w.spec.id}
                widget={widgetOverrides[w.spec.id]?.widget ?? w}
                queryInfo={
                  widgetOverrides[w.spec.id]?.queryInfo ??
                  resolvedQueries.find((q) => q.widgetId === w.spec.id) ??
                  resolvedQueries.find((q) => q.dataSource === w.spec.dataSource)
                }
                filters={spec.filters}
                filterState={filterState}
                onFilterChange={handleFilterChange}
                parentGroupIds={parentGroupIds}
                reportSpec={spec}
                registry={registryRef}
                onPageChange={handlePageChange}
                loading={Boolean(loadingWidgetIds[w.spec.id])}
              />
            ))}
          </div>
        </div>
      );
    },
    [
      filterState,
      gridStyle,
      handleFilterChange,
      handlePageChange,
      layout,
      loadingWidgetIds,
      registryRef,
      spec,
      widgetOverrides,
    ]
  );

  if (error) {
    return (
      <div className="report-error" data-testid="report-error">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!resolved) {
    return (
      <div className="report-loading" data-testid="report-loading">
        Loading...
      </div>
    );
  }

  const mainContent =
    resolved.tabs && resolved.tabs.length > 0 ? (
      <div className="report-tabs">
        <div className="report-tab-list" role="tablist">
          {resolved.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTabId === tab.id}
              className={`report-tab ${activeTabId === tab.id ? "report-tab-active" : ""}`}
              onClick={() => setActiveTabId(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {resolved.tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            hidden={activeTabId !== tab.id}
            className="report-tab-panel"
            aria-labelledby={undefined}
          >
            {activeTabId === tab.id && (
              <>
                <ScopedFilterBar
                  filters={getScopedFilters(spec.filters, getContainerGroupIds(spec, "tab", tab.id))}
                  filterState={filterState}
                  onFilterChange={handleFilterChange}
                  filterBar={FilterBarComponent}
                  label={getScopedFilterLabel(spec, "tab", tab.id, tab.label)}
                />
                {renderWidgets(
                  tab.widgets,
                  resolved.queries,
                  getContainerGroupIds(spec, "tab", tab.id)
                )}
              </>
            )}
          </div>
        ))}
      </div>
    ) : resolved.sections && resolved.sections.length > 0 ? (
      <div className="report-sections">
        {resolved.sections.map((section) => (
          <section key={section.id} className="report-section" aria-labelledby={section.title ? `section-${section.id}` : undefined}>
            {section.title && (
              <h2 id={`section-${section.id}`} className="report-section-title">
                {section.title}
              </h2>
            )}
            <ScopedFilterBar
              filters={getScopedFilters(spec.filters, getContainerGroupIds(spec, "section", section.id))}
              filterState={filterState}
              onFilterChange={handleFilterChange}
              filterBar={FilterBarComponent}
              label={getScopedFilterLabel(spec, "section", section.id, section.title)}
            />
            {renderWidgets(
              section.widgets,
              resolved.queries,
              getContainerGroupIds(spec, "section", section.id)
            )}
          </section>
        ))}
      </div>
    ) : (
      renderWidgets(resolved.widgets, resolved.queries)
    );

  return (
    <div className="report-container" data-report-id={spec.id}>
      <header className="report-header">
        <div className="report-header-title-row">
          <h1 className="report-title">{spec.title}</h1>
        </div>
        {resolved.version && (
          <p className="report-version" aria-label="Report version">
            v{resolved.version}
          </p>
        )}
      </header>

      {getGlobalFilters(spec.filters).length > 0 && (
        <div className="report-filters">
          <FilterBarComponent
            filters={getGlobalFilters(spec.filters)}
            filterState={filterState}
            onFilterChange={handleFilterChange}
          />
        </div>
      )}

      <div className={`report-main report-layout-${layout}`} data-layout={layout}>
        {mainContent}
      </div>
    </div>
  );
}

function ReportWidget({
  widget,
  queryInfo,
  filters,
  filterState,
  onFilterChange,
  parentGroupIds,
  reportSpec,
  registry,
  onPageChange,
  loading,
}: {
  widget: ResolvedReport["widgets"][0];
  queryInfo?: ResolvedReport["queries"][0];
  filters: FilterSpec[];
  filterState: Record<string, unknown>;
  onFilterChange: (filterId: string, value: unknown) => void;
  parentGroupIds: string[];
  reportSpec: ReportSpec;
  registry: ComponentRegistry;
  onPageChange: (widgetId: string, nextPage: number) => void;
  loading: boolean;
}) {
  const { spec, data } = widget;
  const pagination = queryInfo?.pagination;
  const paginationSummary = pagination ? buildPaginationSummary(pagination, queryInfo.rowCount) : null;
  const blockReason = getVisualizationBlockReason(widget, queryInfo);
  const widgetGroupIds = getWidgetGroupIds(reportSpec, spec.id);
  const scopedFilters = getWidgetScopedFilters(filters, widgetGroupIds, parentGroupIds);

  let content: ReactNode = null;
  if (data.type === "table") {
    content = (
      <>
        <registry.table
          title={spec.title}
          data={data.data}
          queryInfo={queryInfo}
        />
        {pagination && (
          <nav className="report-pagination" aria-label={`${spec.title ?? spec.id} pagination`}>
            <button
              type="button"
              className="report-pagination-prev"
              disabled={loading || pagination.page <= 1}
              onClick={() => onPageChange(spec.id, pagination.page - 1)}
            >
              Previous
            </button>
            <span className="report-pagination-page">{paginationSummary}</span>
            <button
              type="button"
              className="report-pagination-next"
              disabled={loading || !pagination.hasMore}
              onClick={() => onPageChange(spec.id, pagination.page + 1)}
            >
              {loading ? "Loading..." : "Next"}
            </button>
          </nav>
        )}
      </>
    );
  } else if (data.type === "barChart") {
    content = blockReason ? (
      <VisualizationBlockedState title={spec.title} message={blockReason} />
    ) : (
      <registry.barChart
        title={spec.title}
        data={data.data}
        queryInfo={queryInfo}
      />
    );
  } else if (data.type === "stackedBarChart") {
    content = blockReason ? (
      <VisualizationBlockedState title={spec.title} message={blockReason} />
    ) : (
      <registry.stackedBarChart
        title={spec.title}
        data={data.data}
        queryInfo={queryInfo}
      />
    );
  } else if (data.type === "lineChart") {
    content = blockReason ? (
      <VisualizationBlockedState title={spec.title} message={blockReason} />
    ) : (
      <registry.lineChart
        title={spec.title}
        data={data.data}
        queryInfo={queryInfo}
      />
    );
  } else if (data.type === "kpi") {
    content = blockReason ? (
      <VisualizationBlockedState title={spec.title} message={blockReason} compact />
    ) : (
      <registry.kpi
        title={spec.title}
        data={data.data}
        queryInfo={queryInfo}
      />
    );
  }

  if (!content) return null;
  return (
    <div className={`report-widget-wrapper report-widget-wrapper-${spec.type}`}>
      <ScopedFilterBar
        filters={scopedFilters}
        filterState={filterState}
        onFilterChange={onFilterChange}
        filterBar={registry.filterBar}
        label={spec.title ?? spec.id}
        compact
      />
      {content}
    </div>
  );
}

function VisualizationBlockedState({
  title,
  message,
  compact = false,
}: {
  title?: string;
  message: string;
  compact?: boolean;
}) {
  return (
    <div className="report-widget report-visualization-blocked">
      <div className="report-widget-header">
        {title ? <h3 className="report-widget-title">{title}</h3> : <span />}
      </div>
      <div
        className={`report-visualization-blocked-body${compact ? " report-visualization-blocked-body-compact" : ""}`}
      >
        <div className="report-visualization-skeleton" aria-hidden="true">
          <span className="report-visualization-skeleton-line report-visualization-skeleton-line-1" />
          <span className="report-visualization-skeleton-line report-visualization-skeleton-line-2" />
          <span className="report-visualization-skeleton-line report-visualization-skeleton-line-3" />
          <span className="report-visualization-skeleton-bar report-visualization-skeleton-bar-1" />
          <span className="report-visualization-skeleton-bar report-visualization-skeleton-bar-2" />
          <span className="report-visualization-skeleton-bar report-visualization-skeleton-bar-3" />
          <span className="report-visualization-skeleton-bar report-visualization-skeleton-bar-4" />
        </div>
        <div className="report-visualization-overlay">
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
}

function buildPaginationSummary(
  pagination: NonNullable<ResolvedQueryExecution["pagination"]>,
  rowCount: number
): string {
  const from = rowCount === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const to = rowCount === 0 ? 0 : from + rowCount - 1;
  const totalPages = pagination.totalPages ?? (pagination.pageSize > 0 ? Math.ceil(pagination.totalCount / pagination.pageSize) || 1 : 1);
  if (pagination.totalCount > 0) {
    return `Showing ${from}-${to} of ${pagination.totalCount} (page ${pagination.page} of ${totalPages})`;
  }
  return `Page ${pagination.page} of ${totalPages}`;
}

function getVisualizationBlockReason(
  widget: ResolvedReport["widgets"][0],
  queryInfo?: ResolvedReport["queries"][0]
): string | null {
  if (widget.data.type === "table") return null;

  if (queryInfo?.limitExceeded) {
    return (
      queryInfo.limitExceeded.message ??
      `This visualization would include ${queryInfo.limitExceeded.totalCount.toLocaleString()} rows, which is above the supported limit of ${queryInfo.limitExceeded.limit.toLocaleString()}. Narrow the filters or use an aggregated query.`
    );
  }

  const totalRowCount = queryInfo?.pagination?.totalCount ?? queryInfo?.rowCount ?? 0;
  const totalPages = queryInfo?.pagination?.totalPages ?? (queryInfo?.pagination?.pageSize && queryInfo.pagination.pageSize > 0 ? Math.ceil((queryInfo.pagination.totalCount ?? 0) / queryInfo.pagination.pageSize) || 1 : 1);
  const isIncompleteDueToPagination = Boolean(
    queryInfo?.pagination &&
      (queryInfo.pagination.page > 1 ||
        queryInfo.pagination.hasMore ||
        (totalPages > 1 && queryInfo.pagination.page < totalPages) ||
        queryInfo.pagination.totalCount > queryInfo.rowCount)
  );

  if (isIncompleteDueToPagination) {
    return "This visualization is based on paginated data, so not all rows are available. Narrow the filters or use an aggregated query.";
  }

  if (totalRowCount > MAX_VISUALIZATION_ROWS) {
    return `This visualization supports up to ${MAX_VISUALIZATION_ROWS.toLocaleString()} rows. Narrow the filters or use an aggregated query.`;
  }

  return null;
}

function mergeResolvedSubset(
  current: ResolvedReport,
  partial: ResolvedReport
): ResolvedReport {
  const widgetById = new Map(partial.widgets.map((widget) => [widget.spec.id, widget]));
  const widgets = current.widgets.map((widget) => widgetById.get(widget.spec.id) ?? widget);

  const queryByWidgetId = new Map(
    partial.queries
      .filter((query): query is ResolvedQueryExecution & { widgetId: string } => typeof query.widgetId === "string")
      .map((query) => [query.widgetId, query])
  );
  const queries = current.queries.map((query) => {
    if (!query.widgetId) return query;
    return queryByWidgetId.get(query.widgetId) ?? query;
  });

  const mapWidgets = <T extends { id: string; widgets: ResolvedReport["widgets"] }>(items?: T[]) => {
    if (!items) return items;
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

function buildPartialReportSpec(spec: ReportSpec, widgetIds: string[]): ReportSpec {
  const requestedWidgetIds = new Set(widgetIds);
  const widgets = spec.widgets.filter((widget) => requestedWidgetIds.has(widget.id));
  const includedWidgetIds = new Set(widgets.map((widget) => widget.id));

  const pruneContainer = <
    T extends {
      id: string;
      widgetIds: string[];
      groupIds?: string[];
    },
  >(
    containers: T[] | undefined
  ): T[] | undefined => {
    if (!containers) return undefined;

    const pruned = containers
      .map((container) => {
        const matchingWidgetIds = container.widgetIds.filter((id) => includedWidgetIds.has(id));
        if (matchingWidgetIds.length === 0) return null;
        return {
          ...container,
          widgetIds: matchingWidgetIds,
        };
      })
      .filter((container): container is T => container !== null);

    return pruned.length > 0 ? pruned : undefined;
  };

  const tabs = pruneContainer(spec.tabs);
  const sections = pruneContainer(spec.sections);
  const groups = pruneContainer(spec.groups);

  return {
    ...spec,
    widgets,
    ...(tabs ? { tabs } : { tabs: undefined }),
    ...(sections ? { sections } : { sections: undefined }),
    ...(groups ? { groups } : { groups: undefined }),
  };
}

function getGlobalFilters(filters: FilterSpec[]): FilterSpec[] {
  return filters.filter((filter) => !Array.isArray(filter.groupIds) || filter.groupIds.length === 0);
}

function getScopedFilters(filters: FilterSpec[], groupIds: string[]): FilterSpec[] {
  if (groupIds.length === 0) return [];
  return filters.filter(
    (filter) =>
      Array.isArray(filter.groupIds) &&
      filter.groupIds.length > 0 &&
      filterAppliesToGroupIds(filter, groupIds)
  );
}

function getWidgetScopedFilters(
  filters: FilterSpec[],
  widgetGroupIds: string[],
  parentGroupIds: string[]
): FilterSpec[] {
  const parentFilterIds = new Set(getScopedFilters(filters, parentGroupIds).map((filter) => filter.id));
  return getScopedFilters(filters, widgetGroupIds).filter((filter) => !parentFilterIds.has(filter.id));
}

function getContainerGroupIds(
  spec: ReportSpec,
  kind: "tab" | "section",
  id: string
): string[] {
  const ownIds = [id];
  const container =
    kind === "tab"
      ? spec.tabs?.find((tab) => tab.id === id)
      : spec.sections?.find((section) => section.id === id);
  const inheritedIds = Array.isArray(container?.groupIds) ? container.groupIds : [];
  return Array.from(new Set([...ownIds, ...inheritedIds]));
}

function getScopedFilterLabel(
  spec: ReportSpec,
  kind: "tab" | "section",
  id: string,
  fallback?: string
): string {
  if (fallback && fallback.trim() !== "") return fallback;
  const group = spec.groups?.find((candidate) => candidate.id === id);
  if (group?.label && group.label.trim() !== "") return group.label;
  return kind === "tab" ? "this tab" : "this section";
}

function ScopedFilterBar({
  filters,
  filterState,
  onFilterChange,
  filterBar: FilterBarComponent,
  label,
  compact = false,
}: {
  filters: FilterSpec[];
  filterState: Record<string, unknown>;
  onFilterChange: (filterId: string, value: unknown) => void;
  filterBar: ComponentRegistry["filterBar"];
  label: string;
  compact?: boolean;
}) {
  if (filters.length === 0) return null;

  return (
    <div className={`report-scoped-filters${compact ? " report-scoped-filters-compact" : ""}`}>
      <p className="report-scoped-filters-note">
        Filters for {label}. Prefer global filters unless this view needs extra detail.
      </p>
      <FilterBarComponent
        filters={filters}
        filterState={filterState}
        onFilterChange={onFilterChange}
      />
    </div>
  );
}

function areParamsEqual(left: Record<string, unknown>, right: Record<string, unknown>): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (leftKeys.length !== rightKeys.length) return false;

  return leftKeys.every((key, index) => {
    if (key !== rightKeys[index]) return false;
    return stringifyComparableValue(left[key]) === stringifyComparableValue(right[key]);
  });
}

function stringifyComparableValue(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

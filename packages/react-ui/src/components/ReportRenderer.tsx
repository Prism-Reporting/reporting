import { useState, useEffect, useCallback, useMemo } from "react";
import type { ReportSpec, DataProvider } from "@reporting/core";
import { resolveReport } from "@reporting/core";
import type { ComponentRegistry, ResolvedReport } from "@reporting/core";

const DEFAULT_PAGE_SIZE = 20;

export interface ReportRendererProps {
  spec: ReportSpec;
  dataProvider: DataProvider;
  registry: ComponentRegistry;
  /** Optional page size for pagination (default 20). Omit or set to 0 to disable pagination. */
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const handleFilterChange = useCallback((filterId: string, value: unknown) => {
    setFilterState((prev) => ({ ...prev, [filterId]: value }));
    setPage(1);
  }, []);

  const pageSize = pageSizeProp > 0 ? pageSizeProp : 0;
  const paginationEnabled = pageSize > 0;

  const dataProviderWithPagination = useMemo(() => {
    if (!paginationEnabled) return dataProvider;
    return {
      async runQuery(request: { name: string; params?: Record<string, unknown> }) {
        const params = { ...request.params, page, pageSize };
        const result = await dataProvider.runQuery({ ...request, params });
        // Unwrap { data, hasMore } from API so the engine receives a plain array
        if (result && typeof result === "object" && "data" in result && Array.isArray((result as { data: unknown }).data)) {
          const obj = result as { data: unknown[]; hasMore?: boolean };
          if (typeof obj.hasMore === "boolean") setHasMore(obj.hasMore);
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

  const layout = spec.layout;
  const isTwoColumn = layout === "twoColumn";
  const half = Math.ceil(resolved.widgets.length / 2);

  return (
    <div className="report-container" data-report-id={spec.id}>
      <header className="report-header">
        <h1 className="report-title">{spec.title}</h1>
      </header>

      {spec.filters.length > 0 && (
        <div className="report-filters">
          <FilterBarComponent
            filters={spec.filters}
            filterState={filterState}
            onFilterChange={handleFilterChange}
          />
        </div>
      )}

      <div
        className={`report-main report-layout-${layout}`}
        data-layout={layout}
      >
        {isTwoColumn ? (
          <div className="report-grid report-grid-two">
            <div className="report-column">
              {resolved.widgets.slice(0, half).map((w) => (
                <ReportWidget
                  key={w.spec.id}
                  widget={w}
                  queryInfo={resolved.queries.find((query) => query.dataSource === w.spec.dataSource)}
                  registry={{
                    table: TableComponent,
                    barChart: BarChartComponent,
                    kpi: KpiComponent,
                    filterBar: FilterBarComponent,
                  }}
                />
              ))}
            </div>
            <div className="report-column">
              {resolved.widgets.slice(half).map((w) => (
                <ReportWidget
                  key={w.spec.id}
                  widget={w}
                  queryInfo={resolved.queries.find((query) => query.dataSource === w.spec.dataSource)}
                  registry={{
                    table: TableComponent,
                    barChart: BarChartComponent,
                    kpi: KpiComponent,
                    filterBar: FilterBarComponent,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="report-column">
            {resolved.widgets.map((w) => (
              <ReportWidget
                key={w.spec.id}
                widget={w}
                queryInfo={resolved.queries.find((query) => query.dataSource === w.spec.dataSource)}
                registry={{
                  table: TableComponent,
                  barChart: BarChartComponent,
                  kpi: KpiComponent,
                  filterBar: FilterBarComponent,
                }}
              />
            ))}
          </div>
        )}

      {paginationEnabled && (
        <nav className="report-pagination" aria-label="Pagination">
          <button
            type="button"
            className="report-pagination-prev"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="report-pagination-page">Page {page}</span>
          <button
            type="button"
            className="report-pagination-next"
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </nav>
      )}
      </div>
    </div>
  );
}

function ReportWidget({
  widget,
  queryInfo,
  registry,
}: {
  widget: ResolvedReport["widgets"][0];
  queryInfo?: ResolvedReport["queries"][0];
  registry: ComponentRegistry;
}) {
  const { spec, data } = widget;

  if (data.type === "table") {
    return (
      <registry.table
        title={spec.title}
        data={data.data}
        queryInfo={queryInfo}
      />
    );
  }
  if (data.type === "barChart") {
    return (
      <registry.barChart
        title={spec.title}
        data={data.data}
        queryInfo={queryInfo}
      />
    );
  }
  if (data.type === "kpi") {
    return (
      <registry.kpi
        title={spec.title}
        data={data.data}
        queryInfo={queryInfo}
      />
    );
  }
  return null;
}

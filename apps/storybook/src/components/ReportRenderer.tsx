import { useState, useEffect, useCallback } from "react";
import type { ReportSpec, DataProvider } from "@reporting/core";
import { resolveReport } from "@reporting/core";
import type { ComponentRegistry, ResolvedReport } from "@reporting/core";

export interface ReportRendererProps {
  spec: ReportSpec;
  dataProvider: DataProvider;
  registry: ComponentRegistry;
}

export function ReportRenderer({
  spec,
  dataProvider,
  registry,
}: ReportRendererProps) {
  const [filterState, setFilterState] = useState<Record<string, unknown>>({});
  const [resolved, setResolved] = useState<ResolvedReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilterChange = useCallback((filterId: string, value: unknown) => {
    setFilterState((prev) => ({ ...prev, [filterId]: value }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    resolveReport(spec, dataProvider, filterState)
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
  }, [spec, dataProvider, filterState]);

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
      </div>
    </div>
  );
}

function ReportWidget({
  widget,
  registry,
}: {
  widget: ResolvedReport["widgets"][0];
  registry: ComponentRegistry;
}) {
  const { spec, data } = widget;

  if (data.type === "table") {
    return (
      <registry.table
        title={spec.title}
        data={data.data}
      />
    );
  }
  if (data.type === "barChart") {
    return (
      <registry.barChart
        title={spec.title}
        data={data.data}
      />
    );
  }
  if (data.type === "kpi") {
    return (
      <registry.kpi
        title={spec.title}
        data={data.data}
      />
    );
  }
  return null;
}

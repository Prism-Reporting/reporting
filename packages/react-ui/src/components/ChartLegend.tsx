interface ChartLegendItem {
  color: string;
  label: string;
}

export interface ChartLegendProps {
  items: ChartLegendItem[];
}

export function ChartLegend({ items }: ChartLegendProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="report-chart-legend" aria-label="Chart legend">
      {items.map((item) => (
        <div key={`${item.label}-${item.color}`} className="report-chart-legend-item">
          <span
            className="report-chart-legend-swatch"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          <span className="report-chart-legend-label" title={item.label}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

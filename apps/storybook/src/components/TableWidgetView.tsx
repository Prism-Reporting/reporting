import type { TableWidgetProps } from "@reporting/core";

export function TableWidgetView({ title, data }: TableWidgetProps) {
  const { rows, columns } = data;

  return (
    <div className="report-widget report-table" data-testid="table-widget">
      {title && <h3 className="report-widget-title">{title}</h3>}
      <div className="report-table-container">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key}>{String(row[col.key] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

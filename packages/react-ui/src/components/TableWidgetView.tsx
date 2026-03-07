import type { TableWidgetProps } from "@reporting/core";
import { WidgetHeader } from "./WidgetHeader.js";

function TableBody({
  rows,
  columns,
}: {
  rows: Record<string, unknown>[];
  columns: Array<{ key: string; label: string }>;
}) {
  return (
    <tbody>
      {rows.map((row, i) => (
        <tr key={i}>
          {columns.map((col) => (
            <td key={col.key}>{String(row[col.key] ?? "")}</td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function TableWidgetView({ title, data, queryInfo }: TableWidgetProps) {
  const { rows, columns, groups } = data;
  const useGroups = groups && groups.length > 0;

  return (
    <div className="report-widget report-table" data-testid="table-widget">
      <WidgetHeader title={title} queryInfo={queryInfo} />
      <div className="report-table-container">
        {useGroups ? (
          groups!.map((group, gIdx) => (
            <div key={gIdx} className="report-table-group">
              <h4 className="report-table-group-title">{group.label}</h4>
              <table>
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <TableBody rows={group.rows} columns={columns} />
              </table>
            </div>
          ))
        ) : (
          <table>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <TableBody rows={rows} columns={columns} />
          </table>
        )}
      </div>
    </div>
  );
}

import type { TableWidgetProps } from "@reporting/core";
import { exportTableToCsv } from "@reporting/core";
import { WidgetHeader } from "./WidgetHeader.js";

function buildDrillDownUrl(
  urlTemplate: string,
  row: Record<string, unknown>,
  paramKeys?: string[]
): string {
  let url = urlTemplate;
  const keys =
    paramKeys && paramKeys.length > 0
      ? paramKeys
      : (urlTemplate.match(/\{(\w+)\}/g) ?? []).map((m) => m.slice(1, -1));
  for (const key of keys) {
    const val = row[key];
    const str = val === undefined || val === null ? "" : String(val);
    url = url.replace(new RegExp(`\\{${escapeRegExp(key)}\\}`, "g"), encodeURIComponent(str));
  }
  return url;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function TableBody({
  rows,
  columns,
  drillDown,
}: {
  rows: Record<string, unknown>[];
  columns: Array<{ key: string; label: string }>;
  drillDown?: {
    urlTemplate: string;
    paramKeys?: string[];
    target?: "_self" | "_blank";
  };
}) {
  const target = drillDown?.target ?? "_blank";
  return (
    <tbody>
      {rows.map((row, i) => {
        const url = drillDown
          ? buildDrillDownUrl(drillDown.urlTemplate, row, drillDown.paramKeys)
          : null;
        const handleClick =
          url && target === "_self"
            ? () => {
                window.location.href = url;
              }
            : url && target === "_blank"
              ? () => {
                  window.open(url, "_blank", "noopener,noreferrer");
                }
              : undefined;
        const trProps = handleClick
          ? {
              role: "button" as const,
              onClick: handleClick,
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick();
                }
              },
              tabIndex: 0,
              className: "report-table-row-clickable",
            }
          : {};
        return (
          <tr key={i} {...trProps}>
            {columns.map((col) => (
              <td key={col.key}>{String(row[col.key] ?? "")}</td>
            ))}
            {drillDown && (
              <td className="report-table-drill-cell">
                <a
                  href={url ?? "#"}
                  target={target}
                  rel={target === "_blank" ? "noopener noreferrer" : undefined}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (target === "_self") {
                      e.preventDefault();
                      window.location.href = url ?? "#";
                    }
                  }}
                  className="report-table-drill-link"
                >
                  View
                </a>
              </td>
            )}
          </tr>
        );
      })}
    </tbody>
  );
}

function TableFooter({
  columns,
  footer,
}: {
  columns: Array<{ key: string; label: string }>;
  footer: Record<string, unknown>;
}) {
  return (
    <tfoot>
      <tr className="report-table-footer">
        {columns.map((col) => (
          <td key={col.key}>
            {col.key === "_drill" ? "" : footer[col.key] != null ? String(footer[col.key]) : ""}
          </td>
        ))}
      </tr>
    </tfoot>
  );
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function TableWidgetView({
  title,
  data,
  queryInfo,
  collapsed = false,
  onToggleCollapse,
}: TableWidgetProps) {
  const { rows, columns, groups, footer, drillDown } = data;
  const useGroups = groups && groups.length > 0;
  const hasFooter = footer && Object.keys(footer).length > 0;
  const showDrillColumn = Boolean(drillDown);

  const flatRows = useGroups
    ? (groups ?? []).flatMap((g) => g.rows)
    : rows;
  const hasData = flatRows.length > 0;
  const displayColumns = showDrillColumn
    ? [...columns, { key: "_drill", label: "" }]
    : columns;

  const handleExportCsv = () => {
    const csv = exportTableToCsv(columns, flatRows);
    const base = (title ?? "table").replace(/[^a-z0-9-_]/gi, "-").replace(/-+/g, "-") || "table";
    downloadCsv(csv, `${base}.csv`);
  };

  const renderTable = (
    tableRows: Record<string, unknown>[],
    includeFooter: boolean
  ) => (
    <>
      <thead>
        <tr>
          {displayColumns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <TableBody
        rows={tableRows}
        columns={columns}
        drillDown={drillDown}
      />
      {includeFooter && hasFooter && (
        <TableFooter columns={displayColumns} footer={footer!} />
      )}
    </>
  );

  return (
    <div
      className={`report-widget report-table${collapsed ? " report-widget-collapsed" : ""}`}
      data-testid="table-widget"
    >
      <WidgetHeader
        title={title}
        queryInfo={queryInfo}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        actions={
          hasData && !collapsed ? (
            <button
              type="button"
              className="report-table-export-csv"
              onClick={handleExportCsv}
              aria-label="Export table as CSV"
            >
              Export CSV
            </button>
          ) : null
        }
      />
      {!collapsed && (
        <div className="report-table-container">
          {useGroups ? (
            <>
              {groups!.map((group, gIdx) => (
                <div key={gIdx} className="report-table-group">
                  <h4 className="report-table-group-title">{group.label}</h4>
                  <table>{renderTable(group.rows, false)}</table>
                </div>
              ))}
              {hasFooter && (
                <table className="report-table-footer-table">
                  <TableFooter columns={displayColumns} footer={footer!} />
                </table>
              )}
            </>
          ) : (
            <table>{renderTable(rows, true)}</table>
          )}
        </div>
      )}
    </div>
  );
}

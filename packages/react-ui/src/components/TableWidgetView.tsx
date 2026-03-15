import { Fragment } from "react";
import type { TableWidgetProps } from "@prism-reporting/core";
import { exportTableToCsv } from "@prism-reporting/core";
import { WidgetHeader } from "./WidgetHeader.js";
import {
  type ConditionalFormattingMatch,
  getTableCellConditionalFormatting,
  getTableRowConditionalFormatting,
} from "./conditionalFormatting.js";

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

function formatCellValue(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) {
    return value.map((item) => formatCellValue(item)).join(", ");
  }
  return String(value);
}

function buildHighlightProps(
  match: ConditionalFormattingMatch | undefined,
  className?: string
): {
  className?: string;
  "data-highlight-tone"?: string;
  "data-highlight-label"?: string;
} {
  const nextClassName = [className, match ? "report-conditional-highlight" : ""]
    .filter(Boolean)
    .join(" ");

  return {
    ...(nextClassName ? { className: nextClassName } : {}),
    ...(match ? { "data-highlight-tone": match.tone } : {}),
    ...(match?.label ? { "data-highlight-label": match.label } : {}),
  };
}

function TableBody({
  rows,
  columns,
  drillDown,
  conditionalFormatting,
}: {
  rows: Record<string, unknown>[];
  columns: Array<{ key: string; label: string }>;
  drillDown?: {
    urlTemplate: string;
    paramKeys?: string[];
    target?: "_self" | "_blank";
  };
  conditionalFormatting?: TableWidgetProps["data"]["conditionalFormatting"];
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
        const rowHighlight = getTableRowConditionalFormatting(conditionalFormatting, row);
        return (
          <tr
            key={i}
            {...trProps}
            {...buildHighlightProps(rowHighlight, trProps.className)}
          >
            {columns.map((col) => (
              <td
                key={col.key}
                {...buildHighlightProps(
                  getTableCellConditionalFormatting(conditionalFormatting, row, col.key)
                )}
              >
                {formatCellValue(row[col.key])}
              </td>
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
  label,
}: {
  columns: Array<{ key: string; label: string }>;
  footer: Record<string, unknown>;
  label?: string;
}) {
  const labelColumn = columns.find((col) => col.key !== "_drill")?.key;
  return (
    <tfoot>
      <tr className="report-table-footer report-table-grand-total-row">
        {columns.map((col) => (
          <td key={col.key}>
            {col.key === "_drill"
              ? ""
              : col.key === labelColumn
                ? formatCellValue(footer[col.key] ?? label)
                : formatCellValue(footer[col.key])}
          </td>
        ))}
      </tr>
    </tfoot>
  );
}

function TableSummaryRow({
  columns,
  summaryRow,
  label,
  className,
}: {
  columns: Array<{ key: string; label: string }>;
  summaryRow: Record<string, unknown>;
  label: string;
  className: string;
}) {
  const labelColumn = columns.find((col) => col.key !== "_drill")?.key;

  return (
    <tr className={className}>
      {columns.map((col) => (
        <td key={col.key}>
          {col.key === "_drill"
            ? ""
            : col.key === labelColumn
              ? formatCellValue(summaryRow[col.key] ?? label)
              : formatCellValue(summaryRow[col.key])}
        </td>
      ))}
    </tr>
  );
}

function GroupedTableBody({
  groups,
  columns,
  drillDown,
  groupSummaryLabel,
  conditionalFormatting,
}: {
  groups: Array<{ label: string; rows: Record<string, unknown>[]; summaryRow?: Record<string, unknown> }>;
  columns: Array<{ key: string; label: string }>;
  drillDown?: {
    urlTemplate: string;
    paramKeys?: string[];
    target?: "_self" | "_blank";
  };
  groupSummaryLabel?: string;
  conditionalFormatting?: TableWidgetProps["data"]["conditionalFormatting"];
}) {
  const displayColumns = drillDown
    ? [...columns, { key: "_drill", label: "" }]
    : columns;
  const colspan = displayColumns.length;

  return (
    <tbody>
      {groups.map((group, index) => (
        <Fragment key={`${group.label}-${index}`}>
          <tr className="report-table-group-header-row">
            <td colSpan={colspan} className="report-table-group-header-cell">
              {group.label}
            </td>
          </tr>
          {group.rows.map((row, rowIndex) => {
            const url = drillDown
              ? buildDrillDownUrl(drillDown.urlTemplate, row, drillDown.paramKeys)
              : null;
            const target = drillDown?.target ?? "_blank";
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
            const rowHighlight = getTableRowConditionalFormatting(conditionalFormatting, row);

            return (
              <tr
                key={`${group.label}-${rowIndex}`}
                {...trProps}
                {...buildHighlightProps(rowHighlight, trProps.className)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    {...buildHighlightProps(
                      getTableCellConditionalFormatting(conditionalFormatting, row, col.key)
                    )}
                  >
                    {formatCellValue(row[col.key])}
                  </td>
                ))}
                {drillDown ? (
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
                ) : null}
              </tr>
            );
          })}
          {group.summaryRow ? (
            <TableSummaryRow
              columns={displayColumns}
              summaryRow={group.summaryRow}
              label={groupSummaryLabel ?? "Subtotal"}
              className="report-table-subtotal-row"
            />
          ) : null}
        </Fragment>
      ))}
    </tbody>
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
  const { rows, columns, groups, footer, footerLabel, groupSummaryLabel, drillDown, conditionalFormatting } =
    data;
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
        conditionalFormatting={conditionalFormatting}
      />
      {includeFooter && hasFooter && (
        <TableFooter columns={displayColumns} footer={footer!} label={footerLabel} />
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
        conditionalFormatting={conditionalFormatting}
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
            <table>
              <thead>
                <tr>
                  {displayColumns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <GroupedTableBody
                groups={groups!}
                columns={columns}
                drillDown={drillDown}
                groupSummaryLabel={groupSummaryLabel}
                conditionalFormatting={conditionalFormatting}
              />
              {hasFooter ? (
                <TableFooter columns={displayColumns} footer={footer!} label={footerLabel} />
              ) : null}
            </table>
          ) : (
            <table>{renderTable(rows, true)}</table>
          )}
        </div>
      )}
    </div>
  );
}

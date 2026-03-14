import type { CardViewProps } from "@reporting/core";
import { WidgetHeader } from "./WidgetHeader.js";
import { formatMetricValue, stringifyDisplayValue } from "./formatDisplayValue.js";

function getBadgeValues(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.map((item) => stringifyDisplayValue(item)).filter(Boolean);
  }
  const stringValue = stringifyDisplayValue(value);
  return stringValue ? [stringValue] : [];
}

export function CardView({
  title,
  data,
  queryInfo,
  collapsed = false,
  onToggleCollapse,
}: CardViewProps) {
  const { rows, titleKey, subtitleKey, badges, metadata, primaryMetric, template, emptyStateText } =
    data;

  return (
    <div
      className={`report-widget report-card-view${collapsed ? " report-widget-collapsed" : ""}`}
      data-testid="card-view-widget"
    >
      <WidgetHeader
        title={title}
        queryInfo={queryInfo}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
      />
      {!collapsed && (
        rows.length > 0 ? (
          <div className={`report-card-grid report-card-grid-${template}`}>
            {rows.map((row, index) => {
              const heading = stringifyDisplayValue(row[titleKey]) || "Untitled";
              const subtitle =
                subtitleKey != null ? stringifyDisplayValue(row[subtitleKey]) : "";
              const metricValue =
                primaryMetric != null
                  ? row[primaryMetric.key]
                  : undefined;
              const formattedMetric =
                primaryMetric != null && (typeof metricValue === "number" || typeof metricValue === "string")
                  ? formatMetricValue(
                      metricValue,
                      primaryMetric.format,
                      primaryMetric.currencyCode,
                      primaryMetric.decimalPlaces,
                      primaryMetric.prefix,
                      primaryMetric.suffix
                    )
                  : metricValue != null
                    ? stringifyDisplayValue(metricValue)
                    : "";

              return (
                <article
                  key={index}
                  className={`report-card report-card-${template}`}
                >
                  <div className="report-card-topline">
                    <div className="report-card-heading-block">
                      <h4 className="report-card-title">{heading}</h4>
                      {subtitle ? <p className="report-card-subtitle">{subtitle}</p> : null}
                    </div>
                    {primaryMetric != null && formattedMetric ? (
                      <div className="report-card-metric">
                        {primaryMetric.label ? (
                          <span className="report-card-metric-label">{primaryMetric.label}</span>
                        ) : null}
                        <strong className="report-card-metric-value">{formattedMetric}</strong>
                      </div>
                    ) : null}
                  </div>

                  {badges && badges.length > 0 ? (
                    <div className="report-card-badges">
                      {badges.flatMap((badge) =>
                        getBadgeValues(row[badge.key]).map((badgeValue) => (
                          <span
                            key={`${badge.key}-${badgeValue}`}
                            className="report-card-badge"
                            title={badge.label}
                          >
                            {badgeValue}
                          </span>
                        ))
                      )}
                    </div>
                  ) : null}

                  {metadata && metadata.length > 0 ? (
                    <dl className="report-card-metadata">
                      {metadata.map((field) => {
                        const value = stringifyDisplayValue(row[field.key]);
                        if (!value) return null;
                        return (
                          <div key={field.key} className="report-card-metadata-row">
                            <dt>{field.label}</dt>
                            <dd>{value}</dd>
                          </div>
                        );
                      })}
                    </dl>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="report-card-empty">
            {emptyStateText ?? "No records match the current filters."}
          </div>
        )
      )}
    </div>
  );
}

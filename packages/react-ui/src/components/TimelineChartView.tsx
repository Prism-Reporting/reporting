import type { CSSProperties } from "react";
import type { TimelineChartProps } from "@prism-reporting/core";
import { WidgetHeader } from "./WidgetHeader.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function formatTickLabel(value: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function buildTicks(startMs: number, endMs: number): number[] {
  const range = Math.max(endMs - startMs, DAY_IN_MS);
  const tickCount = Math.min(6, Math.max(2, Math.round(range / DAY_IN_MS / 7) + 1));
  return Array.from({ length: tickCount }, (_, index) => {
    if (tickCount === 1) return startMs;
    return startMs + (range * index) / (tickCount - 1);
  });
}

function getStatusColor(status: string | undefined): string | undefined {
  if (!status) return undefined;
  const normalized = status.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized.includes("done") || normalized.includes("complete")) return "#15803d";
  if (normalized.includes("risk") || normalized.includes("blocked")) return "#b91c1c";
  if (normalized.includes("progress") || normalized.includes("active")) return "#2563eb";
  if (normalized.includes("plan") || normalized.includes("todo")) return "#d97706";

  let hash = 0;
  for (const char of normalized) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `hsl(${hash % 360} 65% 45%)`;
}

export function TimelineChartView({
  title,
  data,
  queryInfo,
  collapsed = false,
  onToggleCollapse,
}: TimelineChartProps) {
  const ticks = buildTicks(data.rangeStartMs, data.rangeEndMs);
  const totalRangeMs = Math.max(data.rangeEndMs - data.rangeStartMs, DAY_IN_MS);

  return (
    <div
      className={`report-widget report-timeline-chart${collapsed ? " report-widget-collapsed" : ""}`}
      data-testid="timeline-chart-widget"
    >
      <WidgetHeader
        title={title}
        queryInfo={queryInfo}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
      />
      {!collapsed && (
        data.items.length > 0 ? (
          <div className="report-timeline-shell">
            <div className="report-timeline-axis">
              <div className="report-timeline-axis-label" aria-hidden="true" />
              <div className="report-timeline-axis-track">
                {ticks.map((tick) => {
                  const left = ((tick - data.rangeStartMs) / totalRangeMs) * 100;
                  return (
                    <div
                      key={tick}
                      className="report-timeline-tick"
                      style={{ left: `${left}%` }}
                    >
                      <span className="report-timeline-tick-label">{formatTickLabel(tick)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="report-timeline-groups">
              {data.groups.map((group) => (
                <section
                  key={group.key}
                  className="report-timeline-group"
                  style={{ ["--timeline-lanes" as string]: String(group.laneCount) }}
                >
                  <div className="report-timeline-group-label" title={group.label}>
                    {group.label}
                  </div>
                  <div className="report-timeline-group-track">
                    {ticks.map((tick) => {
                      const left = ((tick - data.rangeStartMs) / totalRangeMs) * 100;
                      return (
                        <span
                          key={`${group.key}-${tick}`}
                          className="report-timeline-grid-line"
                          style={{ left: `${left}%` }}
                          aria-hidden="true"
                        />
                      );
                    })}
                    {group.items.map((item) => {
                      const left = ((item.startMs - data.rangeStartMs) / totalRangeMs) * 100;
                      const width = Math.max(
                        ((item.endMs - item.startMs) / totalRangeMs) * 100,
                        1.75
                      );
                      const barStyle: CSSProperties = {
                        left: `${left}%`,
                        width: `${width}%`,
                        top: `calc(${item.lane} * 2.35rem + 0.4rem)`,
                      };
                      const statusColor = getStatusColor(item.status);
                      if (statusColor) {
                        barStyle.backgroundColor = `${statusColor}1a`;
                        barStyle.borderColor = statusColor;
                        barStyle.color = statusColor;
                      }

                      return (
                        <article
                          key={item.id}
                          className="report-timeline-bar"
                          style={barStyle}
                          title={`${item.label}: ${formatTickLabel(item.startMs)} - ${formatTickLabel(item.endMs)}`}
                        >
                          <span className="report-timeline-bar-label">{item.label}</span>
                          {item.status ? (
                            <span className="report-timeline-bar-status">{item.status}</span>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : (
          <div className="report-timeline-empty">
            No scheduled items match the current filters.
          </div>
        )
      )}
    </div>
  );
}

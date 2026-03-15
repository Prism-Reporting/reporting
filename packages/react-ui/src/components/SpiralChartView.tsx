import type { SpiralChartProps } from "@reporting/core";
import { WidgetHeader } from "./WidgetHeader.js";
import { ChartLegend } from "./ChartLegend.js";

const SPIRAL_COLORS = [
  "#2563eb",
  "#0891b2",
  "#0f766e",
  "#65a30d",
  "#ca8a04",
  "#dc2626",
  "#9333ea",
  "#db2777",
];

const SVG_WIDTH = 520;
const SVG_HEIGHT = 360;
const CENTER_X = 194;
const CENTER_Y = SVG_HEIGHT / 2;
const BASE_RADIUS = 26;
const RADIUS_STEP = 16;
const START_ANGLE = -90;
const MAX_SWEEP = 300;

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const radians = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 ${largeArcFlag} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

export function SpiralChartView({
  title,
  data,
  queryInfo,
  collapsed = false,
  onToggleCollapse,
}: SpiralChartProps) {
  const { data: chartData, categoryKey, valueKey } = data;
  const values = chartData.map((row) => Math.max(toNumber(row[valueKey]) ?? 0, 0));
  const maxValue = values.reduce((highest, value) => Math.max(highest, value), 0);
  const safeMaxValue = maxValue > 0 ? maxValue : 1;

  const segments = chartData.map((row, index) => {
    const value = values[index] ?? 0;
    const sweep = 28 + (value / safeMaxValue) * (MAX_SWEEP - 28);
    const startAngle = START_ANGLE + index * 14;
    const endAngle = startAngle + sweep;
    const radius = BASE_RADIUS + index * RADIUS_STEP;
    const color = SPIRAL_COLORS[index % SPIRAL_COLORS.length];
    const label = String(row[categoryKey] ?? "");
    const path = describeArc(CENTER_X, CENTER_Y, radius, startAngle, endAngle);
    const labelPosition = polarToCartesian(CENTER_X, CENTER_Y, radius + 18, endAngle);

    return {
      color,
      label,
      value,
      path,
      labelPosition,
      labelAnchor: (labelPosition.x >= CENTER_X ? "start" : "end") as "start" | "end",
    };
  });

  return (
    <div
      className={`report-widget report-spiral-chart${collapsed ? " report-widget-collapsed" : ""}`}
      data-testid="spiral-chart-widget"
    >
      <WidgetHeader
        title={title}
        queryInfo={queryInfo}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
      />
      {!collapsed && (
        <div className="report-chart-body report-spiral-chart-body">
          <div className="report-spiral-chart-canvas">
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              role="img"
              aria-label={title ?? "Spiral chart"}
              className="report-spiral-chart-svg"
            >
              <defs>
                <linearGradient id="spiral-chart-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#eff6ff" />
                  <stop offset="100%" stopColor="#f8fafc" />
                </linearGradient>
              </defs>
              <rect
                x="0"
                y="0"
                width={SVG_WIDTH}
                height={SVG_HEIGHT}
                rx="24"
                fill="url(#spiral-chart-glow)"
              />
              {segments.map((segment) => (
                <g key={`${segment.label}-${segment.value}`}>
                  <path
                    d={segment.path}
                    stroke={segment.color}
                    strokeWidth="12"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <text
                    x={segment.labelPosition.x}
                    y={segment.labelPosition.y}
                    textAnchor={segment.labelAnchor}
                    className="report-spiral-chart-label"
                  >
                    {segment.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <ChartLegend
            items={segments.map((segment) => ({
              color: segment.color,
              label: `${segment.label} (${segment.value})`,
            }))}
          />
        </div>
      )}
    </div>
  );
}

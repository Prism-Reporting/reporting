import type { ReactNode } from "react";
import type { ResolvedQueryExecution } from "@reporting/core";
import { ResolvedQueryInspector } from "./ResolvedQueryInspector.js";

export interface WidgetHeaderProps {
  title?: string;
  queryInfo?: ResolvedQueryExecution;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  actions?: ReactNode;
}

export function WidgetHeader({
  title,
  queryInfo,
  collapsed = false,
  onToggleCollapse,
  actions,
}: WidgetHeaderProps) {
  if (!title && !queryInfo && !onToggleCollapse && !actions) return null;

  return (
    <div className="report-widget-header">
      {title ? <h3 className="report-widget-title">{title}</h3> : <div />}
      <div className="report-widget-header-actions">
        {!collapsed && queryInfo ? <ResolvedQueryInspector queries={[queryInfo]} compact /> : null}
        {actions}
        {onToggleCollapse ? (
          <button
            type="button"
            className="report-widget-collapse-toggle"
            aria-expanded={!collapsed}
            aria-label={collapsed ? `Expand ${title ?? "widget"}` : `Collapse ${title ?? "widget"}`}
            onClick={onToggleCollapse}
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

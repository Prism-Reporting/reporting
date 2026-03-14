import type { ReportSpec } from "./types.js";

/** Loose shape for runtime spec (partial or plain object). */
interface SpecLike {
  id?: string;
  title?: string;
  layout?: string;
  dataSources?: Record<
    string,
    {
      query?: string;
      params?: unknown;
      delivery?: { mode?: string };
    }
  >;
  filters?: Array<{ id?: string; label?: string; type?: string; dataSource?: string; paramKey?: string }>;
  widgets?: Array<{ id?: string; title?: string; type?: string; dataSource?: string; config?: Record<string, unknown> }>;
}

/**
 * Converts a report spec object to human-readable text wrapped in `<ReportSpec>` tags.
 * Use this to inject the current report into a system prompt so the LLM can refer to it.
 *
 * @param spec - Report spec (id, title, layout, dataSources, filters, widgets); accepts partial shape
 * @returns Human-readable description wrapped in `<ReportSpec>...</ReportSpec>`, or empty string if spec is invalid
 */
export function formatReportSpecForPrompt(spec: Partial<ReportSpec> | SpecLike | null | undefined): string {
  if (spec == null || typeof spec !== "object" || Array.isArray(spec)) {
    return "";
  }
  const s = spec as SpecLike;
  const lines: string[] = [];

  lines.push(`Title: ${s.title ?? s.id ?? "Untitled"}`);
  lines.push(`Layout: ${s.layout ?? "singleColumn"}`);

  const dataSources = s.dataSources ?? {};
  const dsNames = Object.keys(dataSources);
  if (dsNames.length > 0) {
    lines.push("Data sources:");
    dsNames.forEach((name) => {
      const ds = dataSources[name];
      const query = ds?.query ?? name;
      const delivery = ds?.delivery?.mode ? ` [delivery: ${ds.delivery.mode}]` : "";
      const params = ds?.params ? ` (params: ${JSON.stringify(ds.params)})` : "";
      lines.push(`  - ${name}: query "${query}"${delivery}${params}`);
    });
  } else {
    lines.push("Data sources: none");
  }

  const filters = s.filters ?? [];
  if (filters.length > 0) {
    lines.push("Filters:");
    filters.forEach((f) => {
      const label = f.label ?? f.id ?? "filter";
      const type = f.type ? ` [${f.type}]` : "";
      const dataSource = f.dataSource ? ` → ${f.dataSource}.${f.paramKey ?? ""}` : "";
      lines.push(`  - ${label}${type}${dataSource}`);
    });
  } else {
    lines.push("Filters: none");
  }

  const widgets = s.widgets ?? [];
  if (widgets.length > 0) {
    lines.push("Widgets:");
    widgets.forEach((w) => {
      const title = w.title ?? w.id ?? "widget";
      const type = w.type ? ` [${w.type}]` : "";
      const dataSource = w.dataSource ? ` (data: ${w.dataSource})` : "";
      lines.push(`  - ${title}${type}${dataSource}`);
      const config = w.config as
        | {
            columns?: Array<{ key?: string; label?: string; type?: string }>;
            groupByKey?: string;
            summary?: Array<{ key?: string; op?: string }>;
            titleKey?: string;
            subtitleKey?: string;
            badges?: Array<{ key?: string; label?: string }>;
            metadata?: Array<{ key?: string; label?: string }>;
            primaryMetric?: {
              key?: string;
              label?: string;
              format?: string;
            };
            template?: string;
            valueKey?: string;
            aggregation?: { key?: string; op?: string };
            prefix?: string;
            suffix?: string;
          }
        | undefined;
      if (config?.columns?.length) {
        config.columns.forEach((col) => {
          const key = col.key ?? col.label;
          const label = col.label ?? col.key;
          const typeHint = col.type ? ` (${col.type})` : "";
          lines.push(`      Column: ${label ?? key}${typeHint}`);
        });
      }
      if (config?.groupByKey) {
        lines.push(`      Group by: ${config.groupByKey}`);
      }
      if (config?.summary?.length) {
        config.summary.forEach((item) => {
          if (item.key && item.op) {
            lines.push(`      Summary: ${item.op}(${item.key})`);
          }
        });
      }
      if (config?.titleKey) {
        lines.push(`      Card title: ${config.titleKey}`);
      }
      if (config?.subtitleKey) {
        lines.push(`      Card subtitle: ${config.subtitleKey}`);
      }
      if (config?.badges?.length) {
        config.badges.forEach((badge) => {
          if (badge.key) {
            lines.push(`      Badge: ${badge.label ?? badge.key}`);
          }
        });
      }
      if (config?.metadata?.length) {
        config.metadata.forEach((field) => {
          if (field.key) {
            lines.push(`      Metadata: ${field.label ?? field.key}`);
          }
        });
      }
      if (config?.primaryMetric?.key) {
        lines.push(`      Primary metric: ${config.primaryMetric.label ?? config.primaryMetric.key}`);
      }
      if (config?.template) {
        lines.push(`      Card template: ${config.template}`);
      }
      if (config?.valueKey != null) {
        lines.push(`      Value: ${config.valueKey}`);
      }
      if (config?.aggregation?.key && config?.aggregation?.op) {
        lines.push(`      Aggregate: ${config.aggregation.op}(${config.aggregation.key})`);
      }
      if (config?.prefix != null) {
        lines.push(`      Prefix: ${config.prefix}`);
      }
      if (config?.suffix != null) {
        lines.push(`      Suffix: ${config.suffix}`);
      }
    });
  } else {
    lines.push("Widgets: none");
  }

  const body = lines.join("\n");
  return `<ReportSpec>\n${body}\n</ReportSpec>`;
}

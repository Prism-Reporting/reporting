import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface GenerateReportAgentSkillOptions {
  outputDir: string;
  skillId?: string;
  toolNames?: {
    listAvailableQueries?: string;
    describeQuery?: string;
    previewQuery?: string;
    applyReportSpec?: string;
  };
}

function buildSkillMarkdown(options: Required<NonNullable<GenerateReportAgentSkillOptions["toolNames"]>>) {
  return `---
name: reporting-report-generation
description: Generate and refine Prism Reporting ReportSpec documents using the local reporting context, bounded query preview, and validation-aware repair loop.
---

# Reporting report generation

Use this skill when the user wants to create, modify, simplify, or explain a report in Prism Reporting.

## Workflow

1. Call \`${options.listAvailableQueries}\` to inspect the published query catalog before choosing a query.
2. If more than one query might satisfy the request, call \`${options.describeQuery}\` on the candidate queries and compare their fields, params, semantic hints, and notes before you choose one.
3. Call \`${options.describeQuery}\` for every query you plan to use so you work from canonical fields, params, semantic metadata, and notes.
4. Before you generate any DSL content that depends on actual record values, call \`${options.previewQuery}\` against the intended query to verify the values exist in real data and that the resulting behavior will make sense.
5. Use targeted \`${options.previewQuery}\` calls with \`fields\` and \`inspect\` options when you need to understand likely chart axes, filter value options, ranges, thresholds, grouping values, conditional formatting rules, drill-down placeholders, or other concrete values from records.
6. Keep preview usage purposeful: inspect the fields that matter, use profiling when metadata is not enough, and treat the returned field profiles and param insights as evidence before you draft DSL.
7. For every chart, timeline, funnel, scatter, bubble, pie, bar, line, area, or other visual widget whose behavior depends on concrete query output, run \`${options.previewQuery}\` for that widget's underlying query before you finalize the spec.
8. If multiple visual widgets use different queries or different params, preview each unique query-plus-param combination before you call \`${options.applyReportSpec}\`.
9. When you are changing a report based on query output, wait for the required \`${options.previewQuery}\` result before you draft or submit the next spec.
10. Draft a complete ReportSpec JSON object. Use only canonical query names, field keys, and param keys from the reporting context.
11. Submit the full spec with \`${options.applyReportSpec}\` using the \`spec\` field.
12. If \`${options.applyReportSpec}\` returns \`applied: false\`, repair the full spec using the validation and dry-run feedback, then retry until it succeeds.

## Authoring rules

- Prefer metadata inspection before previewing rows.
- Use preview rows, field profiles, and param insights to confirm field values, filter behavior, conditional rules, ranges, and dataset shape, not as a substitute for canonical metadata.
- When the user intent is ambiguous, compare candidate queries with \`${options.describeQuery}\` before you commit to a data source.
- When choosing chart axes, filters, thresholds, or grouping keys, prefer targeted \`${options.previewQuery}\` calls with \`fields\` and \`inspect\` instead of broad unguided previews.
- Never emit DSL content that depends on concrete record values until you have verified those values through \`${options.previewQuery}\`.
- Before calling \`${options.applyReportSpec}\`, make sure every chart or other visual widget that depends on concrete query output is backed by a completed \`${options.previewQuery}\` for its query and params.
- Do not call \`${options.applyReportSpec}\` for a data-grounded change until the required \`${options.previewQuery}\` call has completed and you have incorporated what it returned.
- If a filter, conditional rule, grouping choice, or other generated behavior depends on actual values from records, verify that the chosen values are present and that the resulting filtering or rendering will make sense before drafting the final spec.
- Always send the complete report spec when you call \`${options.applyReportSpec}\`.
- Never invent query names, field keys, or params.
- When the user asks to modify the current report, preserve valid parts and change only what is needed.
`;
}

export async function generateReportAgentSkill(
  options: GenerateReportAgentSkillOptions
): Promise<{ skillDir: string; skillFile: string }> {
  const skillId = options.skillId ?? "reporting-report-generation";
  const skillDir = path.join(options.outputDir, skillId);
  const skillFile = path.join(skillDir, "SKILL.md");
  const toolNames = {
    listAvailableQueries: options.toolNames?.listAvailableQueries ?? "list_available_queries",
    describeQuery: options.toolNames?.describeQuery ?? "describe_query",
    previewQuery: options.toolNames?.previewQuery ?? "preview_query",
    applyReportSpec: options.toolNames?.applyReportSpec ?? "apply_report_spec",
  };

  await mkdir(skillDir, { recursive: true });
  await writeFile(skillFile, buildSkillMarkdown(toolNames), "utf8");
  return { skillDir, skillFile };
}

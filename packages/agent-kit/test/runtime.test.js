import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { createReportingAgentRuntime } from "../dist/runtime.js";
import { createReportingAgentTools } from "../dist/tools.js";
import { generateReportAgentSkill } from "../dist/skills.js";

describe("@prism-reporting/agent-kit", () => {
  let tempDir = "";

  before(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "reporting-agent-kit-"));
  });

  after(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  function createContextProvider() {
    return {
      async getBaseContext() {
        return {
          source: "agent-kit-test",
          tenantId: "demo",
          queries: [
            {
              name: "tasks",
              description: "Task list",
              fields: ["name", "status", "owner", "count", "createdAt"],
              params: ["status", "owner"],
              fieldShape: {
                name: {
                  type: "string",
                  semantic: {
                    kind: "label",
                    filterable: true,
                    sortable: true,
                    preferredWidgetRoles: ["label", "tooltip"],
                  },
                },
                status: {
                  type: "string",
                  semantic: {
                    kind: "dimension",
                    groupable: true,
                    filterable: true,
                    sortable: true,
                    preferredWidgetRoles: ["category", "series"],
                    exampleValues: ["OPEN", "DONE"],
                  },
                },
                owner: {
                  type: "string",
                  semantic: {
                    kind: "dimension",
                    filterable: true,
                    sortable: true,
                    preferredWidgetRoles: ["category", "tooltip"],
                  },
                },
                count: {
                  type: "number",
                  semantic: {
                    kind: "measure",
                    aggregatable: true,
                    preferredWidgetRoles: ["value"],
                  },
                },
                createdAt: {
                  type: "date",
                  semantic: {
                    kind: "time",
                    filterable: true,
                    sortable: true,
                    preferredWidgetRoles: ["time", "category"],
                  },
                },
              },
              paramShape: {
                status: {
                  type: "string",
                  optional: true,
                  semantic: {
                    mapsToField: "status",
                    mode: "multi",
                    exampleValues: ["OPEN", "DONE"],
                  },
                },
                owner: {
                  type: "string",
                  optional: true,
                  semantic: {
                    mapsToField: "owner",
                    mode: "exact",
                  },
                },
              },
              notes: "Use for task reporting.",
            },
          ],
        };
      },
      async getSemanticContext() {
        return {
          fieldAliases: [{ queryName: "tasks", fieldKey: "status", alias: "task stage" }],
          clarificationHints: [{ hint: "Prefer metadata before previewing rows." }],
        };
      },
    };
  }

  it("generates a deterministic AgentSkills folder", async () => {
    const generated = await generateReportAgentSkill({
      outputDir: tempDir,
    });
    const first = await readFile(generated.skillFile, "utf8");

    const secondGenerated = await generateReportAgentSkill({
      outputDir: tempDir,
    });
    const second = await readFile(secondGenerated.skillFile, "utf8");

    assert.equal(first, second);
    assert.match(first, /^---/);
    assert.match(first, /preview_query/);
    assert.match(first, /generate any DSL content that depends on actual record values/i);
    assert.match(first, /If more than one query might satisfy the request, call `describe_query` on the candidate queries/i);
    assert.match(first, /Use targeted `preview_query` calls with `fields` and `inspect` options/i);
    assert.match(first, /For every chart, timeline, funnel, scatter, bubble, pie, bar, line, area, or other visual widget/i);
    assert.match(first, /preview each unique query-plus-param combination before you call `apply_report_spec`/i);
    assert.match(first, /wait for the required `preview_query` result before you draft or submit the next spec/i);
    assert.match(first, /thresholds, grouping values, conditional formatting rules, drill-down placeholders/i);
    assert.match(first, /Never emit DSL content that depends on concrete record values until you have verified those values/i);
    assert.match(first, /Before calling `apply_report_spec`, make sure every chart or other visual widget/i);
    assert.match(first, /Do not call `apply_report_spec`.*required `preview_query` call has completed/i);
    assert.match(first, /apply_report_spec/);
  });

  it("loads SKILL.md into the composed system prompt with shared guide and context", async () => {
    const { skillFile } = await generateReportAgentSkill({ outputDir: tempDir });
    const runtime = createReportingAgentRuntime({
      contextProvider: createContextProvider(),
      skillPaths: [skillFile],
      runtimeNotes: ["Test runtime note."],
      submissionToolName: "apply_report_spec",
    });

    const prompt = await runtime.buildSystemPrompt();

    assert.match(prompt, /Loaded agent skill instructions:/);
    assert.match(prompt, /inspect the published query catalog/i);
    assert.match(prompt, /Before you generate any DSL content that depends on actual record values/i);
    assert.match(prompt, /Field details:/);
    assert.match(prompt, /Param details:/);
    assert.match(prompt, /Report DSL guide:/);
    assert.match(prompt, /Dataset context:/);
    assert.match(prompt, /Dataset query cards:/);
    assert.match(prompt, /Field aliases:/);
    assert.match(prompt, /apply_report_spec/);
  });

  it("reflects provider-backed queries through list and describe tools", async () => {
    const tools = createReportingAgentTools({
      contextProvider: createContextProvider(),
      dataProvider: {
        async runQuery() {
          return [];
        },
      },
    });

    const listPayload = await tools.listAvailableQueries();
    const describePayload = await tools.describeQuery({ name: "tasks" });

    assert.equal(listPayload.source, "agent-kit-test");
    assert.deepEqual(
      listPayload.queries.map((query) => query.name),
      ["tasks"]
    );
    assert.equal(describePayload.found, true);
    assert.equal(describePayload.query?.name, "tasks");
  });

  it("supports targeted previews, live profiling, and legacy preview behavior", async () => {
    const tools = createReportingAgentTools({
      contextProvider: createContextProvider(),
      previewRowLimit: 2,
      profileRowLimit: 4,
      dataProvider: {
        async runQuery({ params }) {
          const rows = [
            { name: "Task A", status: "OPEN", owner: "Ava", count: 1, createdAt: "2026-03-01" },
            { name: "Task B", status: "OPEN", owner: "Ava", count: 3, createdAt: "2026-03-02" },
            { name: "Task C", status: "DONE", owner: "Bea", count: 2, createdAt: "2026-03-03" },
            { name: "Task D", status: "DONE", owner: "Cam", count: 4, createdAt: "2026-03-04" },
          ];
          const filtered = params?.status ? rows.filter((row) => row.status === params.status) : rows;
          return {
            kind: "rows",
            data: filtered,
            totalCount: filtered.length,
          };
        },
      },
    });

    const invalid = await tools.previewQuery({
      name: "tasks",
      params: { badParam: "x" },
    });
    const invalidField = await tools.previewQuery({
      name: "tasks",
      fields: ["badField"],
    });
    const profiled = await tools.previewQuery({
      name: "tasks",
      params: { status: "OPEN" },
      fields: ["status", "count", "createdAt"],
      inspect: {
        includeFieldProfiles: true,
        includeValueOptions: true,
        includeRanges: true,
        includeNullRates: true,
        includeParamOptions: true,
        maxDistinctValues: 3,
      },
    });
    const legacy = await tools.previewQuery({
      name: "tasks",
      params: { status: "OPEN" },
    });

    assert.equal(invalid.ok, false);
    assert.match(invalid.error, /does not accept params/);
    assert.equal(invalidField.ok, false);
    assert.match(invalidField.error, /does not expose fields/);
    assert.equal(profiled.ok, true);
    assert.equal(profiled.previewLimit, 2);
    assert.equal(profiled.rows.length, 2);
    assert.deepEqual(Object.keys(profiled.rows[0]), ["status", "count", "createdAt"]);
    assert.equal(profiled.inspectedRowCount, 2);
    assert.equal(profiled.profileScope, "boundedLiveData");
    assert.deepEqual(profiled.fieldProfiles.status.distinctValues, ["OPEN"]);
    assert.equal(profiled.fieldProfiles.status.nullCount, 0);
    assert.equal(profiled.fieldProfiles.count.observedMin, 1);
    assert.equal(profiled.fieldProfiles.count.observedMax, 3);
    assert.equal(profiled.fieldProfiles.createdAt.observedMin, "2026-03-01");
    assert.equal(profiled.fieldProfiles.createdAt.observedMax, "2026-03-02");
    assert.equal(profiled.paramInsights.status.mapsToField, "status");
    assert.deepEqual(profiled.paramInsights.status.suggestedValues, ["OPEN"]);
    assert.equal(legacy.ok, true);
    assert.equal(legacy.previewLimit, 2);
    assert.equal(legacy.rows.length, 2);
    assert.equal(legacy.fieldProfiles, undefined);
    assert.equal(legacy.rows[0].owner, "Ava");
  });

  it("rejects invalid specs, surfaces dry-run failures, and applies valid specs", async () => {
    const contextProvider = createContextProvider();
    const successTools = createReportingAgentTools({
      contextProvider,
      dataProvider: {
        async runQuery() {
          return {
            kind: "rows",
            data: [{ name: "Task A", status: "OPEN", count: 1 }],
          };
        },
      },
    });
    const failureTools = createReportingAgentTools({
      contextProvider,
      dataProvider: {
        async runQuery() {
          return {
            kind: "limitExceeded",
            totalCount: 10,
            limit: 2,
            message: "Too many rows for a visual preview.",
          };
        },
      },
    });

    const invalidSpecResult = await successTools.applyReportSpec({
      spec: {
        id: "bad-report",
        title: "Bad Report",
        layout: "singleColumn",
        dataSources: {
          tasks: {
            name: "tasks",
            query: "unknown",
          },
        },
        filters: [],
        widgets: [],
      },
    });
    const validSpec = {
      id: "tasks-report",
      title: "Tasks Report",
      layout: "singleColumn",
      dataSources: {
        tasks: {
          name: "tasks",
          query: "tasks",
          delivery: {
            mode: "paginatedList",
            pageSize: 5,
          },
        },
      },
      filters: [],
      widgets: [
        {
          type: "table",
          id: "tasks-table",
          title: "Tasks",
          dataSource: "tasks",
          config: {
            columns: [
              { key: "name", label: "Name" },
              { key: "status", label: "Status" },
            ],
          },
        },
      ],
    };
    const successResult = await successTools.applyReportSpec({ spec: validSpec });
    const dryRunFailure = await failureTools.applyReportSpec({
      spec: {
        id: "tasks-chart",
        title: "Tasks Chart",
        layout: "singleColumn",
        dataSources: {
          tasks: {
            name: "tasks",
            query: "tasks",
            delivery: {
              mode: "fullVisual",
              maxRows: 2,
            },
          },
        },
        filters: [],
        widgets: [
          {
            type: "barChart",
            id: "tasks-by-status",
            title: "Tasks by Status",
            dataSource: "tasks",
            config: {
              categoryKey: "status",
              valueKey: "count",
            },
          },
        ],
      },
    });

    assert.equal(invalidSpecResult.applied, false);
    assert.match(invalidSpecResult.error, /unknown/i);
    assert.equal(successResult.applied, true);
    assert.equal(dryRunFailure.applied, false);
    assert.match(dryRunFailure.error, /Too many rows/);
  });
});

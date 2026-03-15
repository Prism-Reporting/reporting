# @prism-reporting/agent-kit

Helpers for building report-generation agents on top of Prism Reporting.

## What it includes

- runtime helpers for composing reporting-aware system prompts
- tool builders for query discovery, query preview, and report application flows
- AI SDK integration helpers for streaming report-generation agents
- utilities for generating reusable report-authoring skill files

## Install

```bash
npm install @prism-reporting/agent-kit @prism-reporting/core @prism-reporting/mcp-server ai
```

## Quick example

```ts
import { createReportingAgentRuntime } from "@prism-reporting/agent-kit";

const runtime = createReportingAgentRuntime({
  contextProvider: {
    async getBaseContext() {
      return {
        source: "my-app",
        queries: [
          {
            name: "tasks",
            fields: ["name", "status", "owner"],
          },
        ],
      };
    },
  },
  skillPaths: ["./skills/reporting/SKILL.md"],
});

const systemPrompt = await runtime.buildSystemPrompt();
console.log(systemPrompt);
```

## AI SDK integration

This package also exports:

- `createAiSdkReportingTools`
- `createAiSdkReportingAgent`
- `streamReportingAgentResponse`

These helpers package the reporting workflow into a tool-driven agent loop with:

- query catalog discovery
- query previews against real data
- validation-aware `ReportSpec` submission

## Good fit for

- in-app report-building copilots
- agents that need live query metadata before generating a report
- validation/repair loops for report DSL output

## Beta status

`@prism-reporting/agent-kit` is in beta. The runtime and tool shapes may change as the agent workflow is refined.

## Links

- Repo: [Prism-Reporting/reporting](https://github.com/Prism-Reporting/reporting)
- Root docs: [README](https://github.com/Prism-Reporting/reporting/blob/main/README.md)
- Package source: [packages/agent-kit](https://github.com/Prism-Reporting/reporting/tree/main/packages/agent-kit)

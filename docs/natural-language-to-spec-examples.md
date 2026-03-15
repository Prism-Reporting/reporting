# Natural Language → ReportSpec Mapping Examples

This document provides sample mappings from natural language requests to ReportSpec. These examples inform future AI tool design and should stay aligned with what the MCP contract, core types, and renderer actually support.

## Example 1: Tasks by Status

**User request**: "I want to see all tasks grouped by status, with a filter for status and date range."

**ReportSpec**:

```json
{
  "id": "tasks-by-status",
  "title": "Tasks by Status",
  "layout": "singleColumn",
  "dataSources": {
    "tasks": {
      "name": "tasks",
      "query": "tasks"
    }
  },
  "filters": [
    {
      "type": "select",
      "id": "status",
      "label": "Status",
      "dataSource": "tasks",
      "paramKey": "status",
      "options": [
        { "value": "To Do", "label": "To Do" },
        { "value": "In Progress", "label": "In Progress" },
        { "value": "Done", "label": "Done" }
      ]
    },
    {
      "type": "dateRange",
      "id": "dateRange",
      "label": "Due Date",
      "dataSource": "tasks",
      "paramKeyFrom": "tasksFrom",
      "paramKeyTo": "tasksTo"
    }
  ],
  "widgets": [
    {
      "type": "table",
      "id": "tasks-table",
      "title": "Tasks",
      "dataSource": "tasks",
      "config": {
        "columns": [
          { "key": "name", "label": "Task" },
          { "key": "status", "label": "Status" },
          { "key": "assignee", "label": "Assignee" },
          { "key": "dueDate", "label": "Due Date" }
        ]
      }
    }
  ]
}
```

---

## Example 2: Work Items by Assignee (Chart)

**User request**: "Show me a bar chart of work items per assignee, and let me filter by assignee."

**ReportSpec**:

```json
{
  "id": "work-items-by-assignee",
  "title": "Work Items by Assignee",
  "layout": "singleColumn",
  "dataSources": {
    "workItems": {
      "name": "workItems",
      "query": "workItemsByAssignee"
    }
  },
  "filters": [
    {
      "type": "select",
      "id": "assignee",
      "label": "Assignee",
      "dataSource": "workItems",
      "paramKey": "assignee",
      "options": [
        { "value": "Alice", label: "Alice" },
        { "value": "Bob", label: "Bob" }
      ]
    }
  ],
  "widgets": [
    {
      "type": "barChart",
      "id": "assignee-chart",
      "title": "Work Items per Assignee",
      "dataSource": "workItems",
      "config": {
        "categoryKey": "assignee",
        "valueKey": "count"
      }
    }
  ]
}
```

---

## Example 3: Team Workload Overview

**User request**: "Give me a dashboard with total completed tasks, total hours, and a table of workload by team."

**ReportSpec**:

```json
{
  "id": "team-workload",
  "title": "Team Workload Overview",
  "layout": "twoColumn",
  "dataSources": {
    "workload": { "name": "workload", "query": "workload" },
    "teamSummary": { "name": "teamSummary", "query": "teamSummary" }
  },
  "filters": [],
  "widgets": [
    {
      "type": "kpi",
      "id": "total-tasks",
      "title": "Total Completed",
      "dataSource": "teamSummary",
      "config": {
        "valueKey": "completedTasks",
        "label": "Tasks completed across all teams"
      }
    },
    {
      "type": "kpi",
      "id": "total-hours",
      "title": "Total Hours",
      "dataSource": "teamSummary",
      "config": {
        "valueKey": "totalHours",
        "label": "Hours logged"
      }
    },
    {
      "type": "table",
      "id": "workload-table",
      "title": "Workload by Team",
      "dataSource": "workload",
      "config": {
        "columns": [
          { "key": "team", "label": "Team" },
          { "key": "totalHours", "label": "Hours" },
          { "key": "completedTasks", "label": "Completed" }
        ]
      }
    }
  ]
}
```

---

## Example 4: Grouped milestones table with scoped filters

**User request**: "Show milestones grouped by project, let me filter only this section by project status and budget variance, and include project subtotals plus a portfolio total."

**ReportSpec**:

```json
{
  "id": "project-milestones",
  "title": "Project Milestones",
  "layout": "twoColumn",
  "layoutOptions": {
    "columnGap": "1.25rem",
    "rowGap": "1rem"
  },
  "dataSources": {
    "milestones": {
      "name": "project-milestones",
      "query": "projectMilestones",
      "delivery": {
        "mode": "fullVisual",
        "maxRows": 1000
      }
    }
  },
  "filters": [
    {
      "type": "multiSelect",
      "id": "projectStatus",
      "label": "Project Status",
      "dataSource": "milestones",
      "groupIds": ["project-health"],
      "paramKey": "projectStatus",
      "options": [
        { "value": "on-track", "label": "On Track" },
        { "value": "at-risk", "label": "At Risk" },
        { "value": "off-track", "label": "Off Track" }
      ]
    },
    {
      "type": "numericRange",
      "id": "budgetVariance",
      "label": "Budget Variance",
      "dataSource": "milestones",
      "groupIds": ["project-health"],
      "paramKeyFrom": "budgetVarianceMin",
      "paramKeyTo": "budgetVarianceMax"
    }
  ],
  "widgets": [
    {
      "type": "table",
      "id": "milestone-summary",
      "title": "Milestones by Project",
      "dataSource": "milestones",
      "groupIds": ["project-health"],
      "config": {
        "groupByKey": "projectId",
        "groupLabelKey": "projectName",
        "columns": [
          { "key": "milestoneName", "label": "Milestone" },
          { "key": "owner", "label": "Owner" },
          { "key": "plannedDate", "label": "Planned", "type": "date" },
          { "key": "budgetVariance", "label": "Variance", "type": "number" }
        ],
        "groupAggregations": [
          { "key": "budgetVariance", "op": "sum" }
        ],
        "groupSummaryLabel": "Project subtotal",
        "aggregations": [
          { "key": "budgetVariance", "op": "sum" }
        ],
        "grandTotalLabel": "Portfolio total"
      }
    }
  ],
  "groups": [
    {
      "id": "project-health",
      "label": "Project Health",
      "widgetIds": ["milestone-summary"]
    }
  ]
}
```

---

## Example 5: Timeline and gantt report with tabs

**User request**: "Create a release plan with a milestone timeline tab and a gantt-style delivery schedule tab."

**ReportSpec**:

```json
{
  "id": "release-plan",
  "title": "Release Plan",
  "layout": "singleColumn",
  "dataSources": {
    "roadmap": {
      "name": "release-roadmap",
      "query": "releaseRoadmap",
      "delivery": {
        "mode": "fullVisual",
        "maxRows": 500
      }
    }
  },
  "filters": [
    {
      "type": "dateRange",
      "id": "window",
      "label": "Timeline Window",
      "dataSource": "roadmap",
      "paramKeyFrom": "startFrom",
      "paramKeyTo": "endTo"
    }
  ],
  "widgets": [
    {
      "type": "timelineView",
      "id": "release-timeline",
      "title": "Milestone Timeline",
      "dataSource": "roadmap",
      "config": {
        "startDateKey": "startDate",
        "endDateKey": "endDate",
        "labelKey": "milestone",
        "groupKey": "team",
        "statusKey": "status"
      }
    },
    {
      "type": "ganttChart",
      "id": "release-gantt",
      "title": "Delivery Schedule",
      "dataSource": "roadmap",
      "config": {
        "startDateKey": "startDate",
        "endDateKey": "endDate",
        "labelKey": "milestone",
        "groupKey": "workstream",
        "statusKey": "status"
      }
    }
  ],
  "tabs": [
    { "id": "timeline", "label": "Timeline", "widgetIds": ["release-timeline"] },
    { "id": "schedule", "label": "Schedule", "widgetIds": ["release-gantt"] }
  ]
}
```

---

## AI Tool Design Notes (Future)

When implementing AI tools:

1. **Load guidance first** – Agents should read the MCP guide/schema resources before drafting a spec.
2. **Discover actual support** – Use MCP widget/filter discovery instead of hardcoding an older subset.
3. **Validate in a repair loop** – Re-run validation until the spec is clean.
4. **Support modern structures** – NL mapping should cover grouped tables, scoped filters, tabs/sections/groups, presets, and timeline/gantt patterns.

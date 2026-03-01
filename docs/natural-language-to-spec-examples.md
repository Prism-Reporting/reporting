# Natural Language → ReportSpec Mapping Examples

This document provides sample mappings from natural language requests to ReportSpec. These examples inform future AI tool design.

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

## AI Tool Design Notes (Future)

When implementing AI tools:

1. **describe_schema** – Return available entities, fields, and filter options from `DataProvider.describeSchema()` (to be added).
2. **create_report_spec** – Map NL to ReportSpec; validate before returning.
3. **update_report_spec** – Modify layout, filters, or widgets; re-validate.
4. **explain_report** – Summarize what the spec does (title, filters, widgets).

import type { DataProvider } from "@prism-reporting/core";

const TASKS = [
  { id: "1", name: "Design review", status: "In Progress", assignee: "Alice", dueDate: "2025-03-05" },
  { id: "2", name: "API integration", status: "Done", assignee: "Bob", dueDate: "2025-03-01" },
  { id: "3", name: "Testing", status: "To Do", assignee: "Alice", dueDate: "2025-03-10" },
  { id: "4", name: "Documentation", status: "In Progress", assignee: "Carol", dueDate: "2025-03-08" },
  { id: "5", name: "Deployment", status: "To Do", assignee: "Bob", dueDate: "2025-03-15" },
  { id: "6", name: "Bug fix #123", status: "Done", assignee: "Alice", dueDate: "2025-02-28" },
];

const WORK_ITEMS_BY_ASSIGNEE = [
  { assignee: "Alice", count: 12 },
  { assignee: "Bob", count: 8 },
  { assignee: "Carol", count: 6 },
  { assignee: "Dave", count: 4 },
];

const WORKLOAD_DATA = [
  { team: "Engineering", totalHours: 120, completedTasks: 45 },
  { team: "Design", totalHours: 80, completedTasks: 32 },
  { team: "Product", totalHours: 60, completedTasks: 28 },
];

const TEAM_SUMMARY = [{ totalHours: 260, completedTasks: 105 }];

export const tasksDataProvider: DataProvider = {
  async runQuery({ name, params }) {
    if (name === "tasks") {
      let filtered = [...TASKS];
      if (params?.status) {
        filtered = filtered.filter((t) => t.status === params.status);
      }
      if (params?.assignee) {
        filtered = filtered.filter((t) => t.assignee === params.assignee);
      }
      if (params?.tasksFrom && params?.tasksTo) {
        filtered = filtered.filter(
          (t) => t.dueDate >= String(params.tasksFrom) && t.dueDate <= String(params.tasksTo)
        );
      }
      if (params?.search) {
        const s = String(params.search).toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.name.toLowerCase().includes(s) ||
            t.assignee.toLowerCase().includes(s)
        );
      }
      return filtered;
    }
    return [];
  },
};

export const workItemsByAssigneeDataProvider: DataProvider = {
  async runQuery({ name, params }) {
    if (name === "workItemsByAssignee") {
      let filtered = [...WORK_ITEMS_BY_ASSIGNEE];
      if (params?.assignee) {
        filtered = filtered.filter((w) => w.assignee === params.assignee);
      }
      return filtered;
    }
    return [];
  },
};

export const workloadDataProvider: DataProvider = {
  async runQuery({ name }) {
    if (name === "workload") return WORKLOAD_DATA;
    if (name === "teamSummary") return TEAM_SUMMARY;
    return [];
  },
};

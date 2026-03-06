import type { Meta, StoryObj } from "@storybook/react";
import { ReportRenderer, defaultRegistry } from "@reporting/react-ui";
import { tasksDataProvider } from "../mock-data";
import type { ReportSpec } from "@reporting/core";

const tasksByStatusSpec: ReportSpec = {
  id: "tasks-by-status",
  title: "Tasks by Status",
  layout: "singleColumn",
  dataSources: {
    tasks: {
      name: "tasks",
      query: "tasks",
    },
  },
  filters: [
    {
      type: "select",
      id: "status",
      label: "Status",
      dataSource: "tasks",
      paramKey: "status",
      options: [
        { value: "To Do", label: "To Do" },
        { value: "In Progress", label: "In Progress" },
        { value: "Done", label: "Done" },
      ],
    },
    {
      type: "dateRange",
      id: "dateRange",
      label: "Due Date",
      dataSource: "tasks",
      paramKeyFrom: "tasksFrom",
      paramKeyTo: "tasksTo",
    },
  ],
  widgets: [
    {
      type: "table",
      id: "tasks-table",
      title: "Tasks",
      dataSource: "tasks",
      config: {
        columns: [
          { key: "name", label: "Task" },
          { key: "status", label: "Status" },
          { key: "assignee", label: "Assignee" },
          { key: "dueDate", label: "Due Date" },
        ],
      },
    },
  ],
};

const meta: Meta<typeof ReportRenderer> = {
  component: ReportRenderer,
  title: "Reports/Tasks by Status",
  parameters: {
    layout: "padded",
  },
};

export default meta;

type Story = StoryObj<typeof ReportRenderer>;

export const Default: Story = {
  args: {
    spec: tasksByStatusSpec,
    dataProvider: tasksDataProvider,
    registry: defaultRegistry,
  },
};

export const WithSearchFilter: Story = {
  args: {
    spec: {
      ...tasksByStatusSpec,
      filters: [
        ...tasksByStatusSpec.filters,
        {
          type: "search",
          id: "search",
          label: "Search",
          dataSource: "tasks",
          paramKey: "search",
          placeholder: "Search tasks...",
        },
      ],
    },
    dataProvider: tasksDataProvider,
    registry: defaultRegistry,
  },
};

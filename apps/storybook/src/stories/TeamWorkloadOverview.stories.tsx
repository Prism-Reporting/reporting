import type { Meta, StoryObj } from "@storybook/react";
import { ReportRenderer, defaultRegistry } from "@reporting/react-ui";
import { workloadDataProvider } from "../mock-data";
import type { ReportSpec } from "@reporting/core";

const teamWorkloadSpec: ReportSpec = {
  id: "team-workload",
  title: "Team Workload Overview",
  layout: "twoColumn",
  dataSources: {
    workload: {
      name: "workload",
      query: "workload",
    },
    teamSummary: {
      name: "teamSummary",
      query: "teamSummary",
    },
  },
  filters: [],
  widgets: [
    {
      type: "kpi",
      id: "total-tasks",
      title: "Total Completed",
      dataSource: "teamSummary",
      config: {
        valueKey: "completedTasks",
        label: "Tasks completed across all teams",
      },
    },
    {
      type: "kpi",
      id: "total-hours",
      title: "Total Hours",
      dataSource: "teamSummary",
      config: {
        valueKey: "totalHours",
        label: "Hours logged",
      },
    },
    {
      type: "table",
      id: "workload-table",
      title: "Workload by Team",
      dataSource: "workload",
      config: {
        columns: [
          { key: "team", label: "Team" },
          { key: "totalHours", label: "Hours" },
          { key: "completedTasks", label: "Completed" },
        ],
      },
    },
  ],
};

const meta: Meta<typeof ReportRenderer> = {
  component: ReportRenderer,
  title: "Reports/Team Workload Overview",
  parameters: {
    layout: "padded",
  },
};

export default meta;

type Story = StoryObj<typeof ReportRenderer>;

export const Default: Story = {
  args: {
    spec: teamWorkloadSpec,
    dataProvider: workloadDataProvider,
    registry: defaultRegistry,
  },
};

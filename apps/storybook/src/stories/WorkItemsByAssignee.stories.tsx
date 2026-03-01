import type { Meta, StoryObj } from "@storybook/react";
import { ReportRenderer } from "../components/ReportRenderer";
import { defaultRegistry } from "../registry";
import { workItemsByAssigneeDataProvider } from "../mock-data";
import type { ReportSpec } from "@reporting/core";

const workItemsByAssigneeSpec: ReportSpec = {
  id: "work-items-by-assignee",
  title: "Work Items by Assignee",
  layout: "singleColumn",
  dataSources: {
    workItems: {
      name: "workItems",
      query: "workItemsByAssignee",
    },
  },
  filters: [
    {
      type: "select",
      id: "assignee",
      label: "Assignee",
      dataSource: "workItems",
      paramKey: "assignee",
      options: [
        { value: "Alice", label: "Alice" },
        { value: "Bob", label: "Bob" },
        { value: "Carol", label: "Carol" },
        { value: "Dave", label: "Dave" },
      ],
    },
  ],
  widgets: [
    {
      type: "barChart",
      id: "assignee-chart",
      title: "Work Items per Assignee",
      dataSource: "workItems",
      config: {
        categoryKey: "assignee",
        valueKey: "count",
      },
    },
  ],
};

const meta: Meta<typeof ReportRenderer> = {
  component: ReportRenderer,
  title: "Reports/Work Items by Assignee",
  parameters: {
    layout: "padded",
  },
};

export default meta;

type Story = StoryObj<typeof ReportRenderer>;

export const Default: Story = {
  args: {
    spec: workItemsByAssigneeSpec,
    dataProvider: workItemsByAssigneeDataProvider,
    registry: defaultRegistry,
  },
};

export const TwoColumnWithTable: Story = {
  args: {
    spec: {
      ...workItemsByAssigneeSpec,
      layout: "twoColumn",
      widgets: [
        workItemsByAssigneeSpec.widgets[0],
        {
          type: "table",
          id: "assignee-table",
          title: "Raw Data",
          dataSource: "workItems",
          config: {
            columns: [
              { key: "assignee", label: "Assignee" },
              { key: "count", label: "Count" },
            ],
          },
        },
      ],
    },
    dataProvider: workItemsByAssigneeDataProvider,
    registry: defaultRegistry,
  },
};

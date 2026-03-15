import type { Meta, StoryObj } from "@storybook/react";
import { ReportRenderer, defaultRegistry } from "@prism-reporting/react-ui";
import { workItemsByAssigneeDataProvider } from "../mock-data";
import type { ReportSpec } from "@prism-reporting/core";
import { reportStoryParameters, withReportFrame } from "../story-support/frames";

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
  title: "Reports/Analytics/Work Items by Assignee",
  parameters: reportStoryParameters,
  decorators: [withReportFrame],
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

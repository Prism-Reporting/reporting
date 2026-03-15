import type { Meta, StoryObj } from "@storybook/react";
import type { DataProvider, ReportSpec } from "@reporting/core";
import { ReportRenderer, defaultRegistry } from "@reporting/react-ui";
import { reportStoryParameters, withReportFrame } from "../story-support/frames";

const BUDGET_ROWS = [
  {
    id: "i-101",
    project: "Atlas",
    projectLabel: "Atlas Program",
    owner: "Alice",
    budget: 120000,
    spent: 84000,
    status: "In Progress",
  },
  {
    id: "i-102",
    project: "Atlas",
    projectLabel: "Atlas Program",
    owner: "Bob",
    budget: 90000,
    spent: 61000,
    status: "At Risk",
  },
  {
    id: "i-201",
    project: "Orion",
    projectLabel: "Orion Revamp",
    owner: "Carol",
    budget: 140000,
    spent: 92000,
    status: "In Progress",
  },
  {
    id: "i-202",
    project: "Orion",
    projectLabel: "Orion Revamp",
    owner: "Dave",
    budget: 60000,
    spent: 45000,
    status: "Done",
  },
  {
    id: "i-301",
    project: "Helios",
    projectLabel: "Helios Expansion",
    owner: "Eve",
    budget: 50000,
    spent: 28000,
    status: "Planned",
  },
];

const groupedSummaryDataProvider: DataProvider = {
  async runQuery({ name }) {
    if (name === "initiativeBudgets") {
      return BUDGET_ROWS;
    }
    return [];
  },
};

const groupedSummarySpec: ReportSpec = {
  id: "grouped-summary-table",
  title: "Budget Summary by Project",
  layout: "singleColumn",
  dataSources: {
    initiativeBudgets: {
      name: "initiativeBudgets",
      query: "initiativeBudgets",
      delivery: {
        mode: "fullVisual",
      },
    },
  },
  filters: [],
  widgets: [
    {
      type: "table",
      id: "budget-summary",
      title: "Initiatives by Project",
      dataSource: "initiativeBudgets",
      config: {
        groupByKey: "project",
        groupLabelKey: "projectLabel",
        columns: [
          { key: "owner", label: "Owner" },
          { key: "status", label: "Status" },
          { key: "id", label: "Initiatives" },
          { key: "budget", label: "Budget" },
          { key: "spent", label: "Spent" },
        ],
        groupAggregations: [
          { key: "id", op: "count" },
          { key: "budget", op: "sum" },
          { key: "spent", op: "sum" },
        ],
        groupSummaryLabel: "Project subtotal",
        aggregations: [
          { key: "id", op: "count" },
          { key: "budget", op: "sum" },
          { key: "spent", op: "sum" },
        ],
        grandTotalLabel: "Portfolio grand total",
      },
    },
  ],
};

const summaryOnlySpec: ReportSpec = {
  ...groupedSummarySpec,
  id: "summary-only-budget-table",
  title: "Portfolio Summary Totals",
  widgets: [
    {
      type: "table",
      id: "portfolio-summary",
      title: "Portfolio Totals",
      dataSource: "initiativeBudgets",
      config: {
        columns: [
          { key: "id", label: "Initiatives" },
          { key: "budget", label: "Budget" },
          { key: "spent", label: "Spent" },
        ],
        summary: [
          { key: "id", op: "count" },
          { key: "budget", op: "sum" },
          { key: "spent", op: "sum" },
        ],
      },
    },
  ],
};

const conditionalHighlightingSpec: ReportSpec = {
  ...groupedSummarySpec,
  id: "conditional-highlighting-budget-table",
  title: "Budget Exceptions",
  widgets: [
    {
      type: "table",
      id: "budget-exceptions",
      title: "Conditional highlighting",
      dataSource: "initiativeBudgets",
      config: {
        ...groupedSummarySpec.widgets[0].config,
        conditionalFormatting: [
          {
            target: { type: "row" },
            when: { field: "status", op: "eq", value: "At Risk" },
            tone: "danger",
            label: "Escalation row",
          },
          {
            target: { type: "cell", columnKey: "budget" },
            when: { field: "budget", op: "gt", value: 100000 },
            tone: "warning",
            label: "Budget threshold",
          },
          {
            target: { type: "cell", columnKey: "spent" },
            when: { field: "spent", op: "gt", value: 90000 },
            tone: "info",
            label: "High spend",
          },
        ],
      },
    },
  ],
};

const meta: Meta<typeof ReportRenderer> = {
  component: ReportRenderer,
  title: "Reports/Operations/Grouped Summary Table",
  parameters: reportStoryParameters,
  decorators: [withReportFrame],
};

export default meta;

type Story = StoryObj<typeof ReportRenderer>;

export const GroupedBudgetSummary: Story = {
  args: {
    spec: groupedSummarySpec,
    dataProvider: groupedSummaryDataProvider,
    registry: defaultRegistry,
  },
};

export const GroupedRowsWithTotals: Story = {
  args: {
    spec: groupedSummarySpec,
    dataProvider: groupedSummaryDataProvider,
    registry: defaultRegistry,
  },
};

export const SummaryOnlyTotals: Story = {
  args: {
    spec: summaryOnlySpec,
    dataProvider: groupedSummaryDataProvider,
    registry: defaultRegistry,
  },
};

export const ConditionalHighlighting: Story = {
  args: {
    spec: conditionalHighlightingSpec,
    dataProvider: groupedSummaryDataProvider,
    registry: defaultRegistry,
  },
};

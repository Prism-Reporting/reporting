import type { Meta, StoryObj } from "@storybook/react";
import type { DataProvider, ReportSpec } from "@reporting/core";
import { ReportRenderer, defaultRegistry } from "@reporting/react-ui";
import { reportStoryParameters, withReportFrame } from "../story-support/frames";

const INITIATIVE_ROWS = [
  {
    id: "atlas-1",
    name: "Atlas Stabilization",
    owner: "Operations Platform",
    program: "Operations Core",
    status: "At Risk",
    priority: "P1",
    phase: "Build",
    nextMilestone: "Go-live rehearsal",
    budgetSpent: 245000,
    budget: 245000,
    spent: 188000,
  },
  {
    id: "orion-2",
    name: "Orion Forecasting",
    owner: "Commercial Systems",
    program: "Revenue Acceleration",
    status: "On Track",
    priority: "P2",
    phase: "Discovery",
    nextMilestone: "Data alignment",
    budgetSpent: 98000,
    budget: 98000,
    spent: 64000,
  },
  {
    id: "helios-3",
    name: "Helios Controls",
    owner: "Risk Engineering",
    program: "Trust Platform",
    status: "Blocked",
    priority: "P1",
    phase: "Design",
    nextMilestone: "Policy review",
    budgetSpent: 156000,
    budget: 156000,
    spent: 97000,
  },
];

const conditionalFormattingProvider: DataProvider = {
  async runQuery({ name }) {
    if (name === "initiatives") {
      return INITIATIVE_ROWS;
    }
    return [];
  },
};

const conditionalFormattingSpec: ReportSpec = {
  id: "storybook-conditional-highlighting",
  title: "Conditional Highlighting",
  layout: "singleColumn",
  dataSources: {
    initiatives: {
      name: "initiatives",
      query: "initiatives",
      delivery: { mode: "fullVisual" },
    },
  },
  filters: [],
  sections: [
    {
      id: "exceptions",
      title: "Exceptions and watchouts",
      widgetIds: ["exception-table", "exception-cards"],
    },
  ],
  widgets: [
    {
      type: "table",
      id: "exception-table",
      title: "Budget and delivery thresholds",
      dataSource: "initiatives",
      config: {
        columns: [
          { key: "name", label: "Initiative" },
          { key: "owner", label: "Owner" },
          { key: "status", label: "Status" },
          { key: "budget", label: "Budget" },
          { key: "spent", label: "Spent" },
        ],
        conditionalFormatting: [
          {
            target: { type: "row" },
            when: { field: "status", op: "in", values: ["At Risk", "Blocked"] },
            tone: "danger",
            label: "Delivery risk",
          },
          {
            target: { type: "cell", columnKey: "budget" },
            when: { field: "budget", op: "gt", value: 150000 },
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
    {
      type: "cardView",
      id: "exception-cards",
      title: "Highlighted initiative cards",
      dataSource: "initiatives",
      config: {
        titleKey: "name",
        subtitleKey: "owner",
        badges: [
          { key: "status", label: "Status" },
          { key: "priority", label: "Priority" },
        ],
        metadata: [
          { key: "program", label: "Program" },
          { key: "phase", label: "Phase" },
          { key: "nextMilestone", label: "Next milestone" },
        ],
        primaryMetric: {
          key: "budgetSpent",
          label: "Spend",
          format: "currency",
          currencyCode: "USD",
          decimalPlaces: 0,
        },
        conditionalFormatting: [
          {
            target: { type: "card" },
            when: { field: "status", op: "eq", value: "Blocked" },
            tone: "danger",
            label: "Blocked initiative",
          },
          {
            target: { type: "card" },
            when: { field: "budgetSpent", op: "gt", value: 200000 },
            tone: "warning",
            label: "Spend watch",
          },
        ],
        template: "detailed",
      },
    },
  ],
};

const meta: Meta<typeof ReportRenderer> = {
  title: "Reports/Examples/Conditional Highlighting",
  component: ReportRenderer,
  parameters: reportStoryParameters,
  decorators: [withReportFrame],
};

export default meta;

type Story = StoryObj<typeof ReportRenderer>;

export const Overview: Story = {
  args: {
    spec: conditionalFormattingSpec,
    dataProvider: conditionalFormattingProvider,
    registry: defaultRegistry,
    pageSize: 2
  },
};

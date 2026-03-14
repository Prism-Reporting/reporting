import type { Meta, StoryObj } from "@storybook/react";
import type { CardViewProps } from "@reporting/core";
import { CardView } from "@reporting/react-ui";

const frameStyle = {
  width: "100%",
  maxWidth: "1120px",
};

const detailedArgs: CardViewProps = {
  title: "Active initiatives",
  data: {
    titleKey: "name",
    subtitleKey: "owner",
    badges: [{ key: "status" }, { key: "priority" }],
    metadata: [
      { key: "phase", label: "Phase" },
      { key: "nextMilestone", label: "Next milestone" },
      { key: "targetDate", label: "Target date" },
    ],
    primaryMetric: {
      key: "budgetSpent",
      label: "Spend",
      format: "currency",
      currencyCode: "USD",
      decimalPlaces: 0,
    },
    template: "detailed",
    rows: [
      {
        name: "Vendor Portal Integration",
        owner: "Operations Platform",
        status: "At Risk",
        priority: "P1",
        phase: "Build",
        nextMilestone: "Pilot readiness",
        targetDate: "2026-05-10",
        budgetSpent: 245000,
      },
      {
        name: "Revenue Forecasting Workspace",
        owner: "Commercial Systems",
        status: "On Track",
        priority: "P2",
        phase: "Discovery",
        nextMilestone: "Data alignment",
        targetDate: "2026-06-02",
        budgetSpent: 98000,
      },
      {
        name: "Compliance Automation",
        owner: "Risk Engineering",
        status: "Blocked",
        priority: "P1",
        phase: "Design",
        nextMilestone: "Policy review",
        targetDate: "2026-04-18",
        budgetSpent: 156000,
      },
    ],
  },
};

const compactArgs: CardViewProps = {
  title: "Compact portfolio cards",
  data: {
    ...detailedArgs.data,
    template: "compact",
  },
};

const meta: Meta<typeof CardView> = {
  title: "Components/Cards/Card View",
  component: CardView,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div style={frameStyle}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Detailed: Story = {
  args: detailedArgs,
};

export const Compact: Story = {
  args: compactArgs,
};

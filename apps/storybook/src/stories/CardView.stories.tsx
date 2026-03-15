import type { Meta, StoryObj } from "@storybook/react";
import type { CardViewProps } from "@reporting/core";
import { CardView } from "@reporting/react-ui";
import {
  componentStoryParameters,
  withComponentFrame,
} from "../story-support/frames";

const detailedArgs: CardViewProps = {
  title: "Active initiatives",
  data: {
    titleKey: "name",
    subtitleKey: "owner",
    badges: [
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
    ],
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

const conditionalHighlightingArgs: CardViewProps = {
  ...detailedArgs,
  title: "Risk-prioritized initiatives",
  data: {
    ...detailedArgs.data,
    conditionalFormatting: [
      {
        target: { type: "card" },
        when: { field: "status", op: "in", values: ["Blocked", "At Risk"] },
        tone: "danger",
        label: "Delivery risk",
      },
      {
        target: { type: "card" },
        when: { field: "budgetSpent", op: "gt", value: 200000 },
        tone: "warning",
        label: "Budget watch",
      },
    ],
  },
};

const meta: Meta<typeof CardView> = {
  title: "Components/Browsing/Card View",
  component: CardView,
  parameters: componentStoryParameters,
  decorators: [withComponentFrame],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Detailed: Story = {
  args: detailedArgs,
  parameters: {
    frame: {
      maxWidth: "1120px",
      minHeight: "520px",
    },
  },
};

export const Compact: Story = {
  args: compactArgs,
  parameters: {
    frame: {
      maxWidth: "1120px",
      minHeight: "420px",
    },
  },
};

export const ConditionalHighlighting: Story = {
  args: conditionalHighlightingArgs,
  parameters: {
    frame: {
      maxWidth: "1120px",
      minHeight: "520px",
    },
  },
};

import type { Meta, StoryObj } from "@storybook/react";
import type {
  AreaChartProps,
  BarChartProps,
  BubbleChartProps,
  DoughnutChartProps,
  FunnelChartProps,
  LineChartProps,
  PieChartProps,
  SpiralChartProps,
  ScatterChartProps,
  StackedBarChartProps,
  TimelineChartProps,
} from "@prism-reporting/core";
import {
  AreaChartView,
  BarChartView,
  BubbleChartView,
  DoughnutChartView,
  FunnelChartView,
  LineChartWidgetView,
  PieChartView,
  SpiralChartView,
  ScatterChartView,
  StackedBarChartView,
  TimelineChartView,
} from "@prism-reporting/react-ui";
import {
  componentStoryParameters,
  withComponentFrame,
} from "../story-support/frames";

const barChartArgs: BarChartProps = {
  title: "Portfolio spend by program",
  data: {
    categoryKey: "program",
    valueKey: "spend",
    data: [
      { program: "Customer 360", spend: 42 },
      { program: "ERP Modernization", spend: 35 },
      { program: "Data Platform", spend: 29 },
      { program: "Mobile Field Ops", spend: 18 },
      { program: "Security Uplift", spend: 14 },
    ],
  },
};

const lineChartArgs: LineChartProps = {
  title: "Delivery trend by stream",
  data: {
    categoryKey: "month",
    valueKey: "completed",
    series: [
      { key: "integration", label: "Vendor Portal Integration" },
      { key: "pricing", label: "Pricing Intelligence Rollout" },
      { key: "workspace", label: "Revenue Forecasting Workspace" },
      { key: "compliance", label: "Compliance Automation" },
    ],
    data: [
      { month: "Jan", integration: 8, pricing: 5, workspace: 6, compliance: 4 },
      { month: "Feb", integration: 10, pricing: 7, workspace: 8, compliance: 5 },
      { month: "Mar", integration: 12, pricing: 9, workspace: 10, compliance: 6 },
      { month: "Apr", integration: 11, pricing: 10, workspace: 13, compliance: 7 },
      { month: "May", integration: 14, pricing: 12, workspace: 15, compliance: 9 },
      { month: "Jun", integration: 15, pricing: 14, workspace: 16, compliance: 11 },
    ],
  },
};

const areaChartArgs: AreaChartProps = {
  title: "Capacity burn across teams",
  data: {
    categoryKey: "sprint",
    valueKey: "hours",
    series: [
      { key: "platform", label: "Platform Team" },
      { key: "product", label: "Product Engineering" },
      { key: "risk", label: "Risk & Controls" },
    ],
    data: [
      { sprint: "S1", platform: 34, product: 28, risk: 12 },
      { sprint: "S2", platform: 38, product: 30, risk: 14 },
      { sprint: "S3", platform: 36, product: 32, risk: 13 },
      { sprint: "S4", platform: 40, product: 34, risk: 16 },
      { sprint: "S5", platform: 43, product: 38, risk: 18 },
    ],
  },
};

const pieData = [
  { initiative: "Vendor Portal Integration", value: 18 },
  { initiative: "Pricing Intelligence Rollout", value: 15 },
  { initiative: "Customer Portal Refresh", value: 13 },
  { initiative: "Supply Chain Visibility", value: 11 },
  { initiative: "Compliance Automation", value: 10 },
  { initiative: "Revenue Forecasting Workspace", value: 9 },
  { initiative: "Field Service Mobile App", value: 8 },
  { initiative: "Cloud Security Hardening", value: 7 },
];

const pieChartArgs: PieChartProps = {
  title: "Risk mix by initiative",
  data: {
    categoryKey: "initiative",
    valueKey: "value",
    data: pieData,
  },
};

const spiralChartArgs: SpiralChartProps = {
  title: "Initiative intensity spiral",
  data: {
    categoryKey: "initiative",
    valueKey: "value",
    data: [
      { initiative: "Vendor Portal Integration", value: 84 },
      { initiative: "Pricing Intelligence Rollout", value: 72 },
      { initiative: "Customer Portal Refresh", value: 61 },
      { initiative: "Supply Chain Visibility", value: 53 },
      { initiative: "Compliance Automation", value: 47 },
      { initiative: "Revenue Forecasting Workspace", value: 39 },
      { initiative: "Field Service Mobile App", value: 28 },
    ],
  },
};

const doughnutChartArgs: DoughnutChartProps = {
  title: "Budget mix by initiative",
  data: {
    categoryKey: "initiative",
    valueKey: "value",
    data: pieData,
  },
};

const stackedBarArgs: StackedBarChartProps = {
  title: "Milestones by quarter",
  data: {
    categoryKey: "quarter",
    series: [
      { key: "planned", label: "Planned" },
      { key: "atRisk", label: "At Risk" },
      { key: "blocked", label: "Blocked" },
      { key: "done", label: "Done" },
    ],
    data: [
      { quarter: "Q1", planned: 12, atRisk: 4, blocked: 2, done: 8 },
      { quarter: "Q2", planned: 10, atRisk: 3, blocked: 1, done: 11 },
      { quarter: "Q3", planned: 14, atRisk: 5, blocked: 2, done: 9 },
      { quarter: "Q4", planned: 11, atRisk: 2, blocked: 1, done: 13 },
    ],
  },
};

const funnelChartArgs: FunnelChartProps = {
  title: "Portfolio intake funnel",
  data: {
    categoryKey: "stage",
    valueKey: "count",
    data: [
      { stage: "Ideas Submitted", count: 84 },
      { stage: "Discovery Approved", count: 49 },
      { stage: "Business Case Ready", count: 31 },
      { stage: "Funded", count: 18 },
      { stage: "In Delivery", count: 12 },
    ],
  },
};

const scatterChartArgs: ScatterChartProps = {
  title: "Initiative health map",
  data: {
    xKey: "budgetVariance",
    yKey: "scheduleVariance",
    zKey: "teamSize",
    data: [
      { name: "Vendor Portal", budgetVariance: 3, scheduleVariance: 2, teamSize: 8 },
      { name: "Pricing Rollout", budgetVariance: 8, scheduleVariance: 6, teamSize: 12 },
      { name: "Mobile App", budgetVariance: -2, scheduleVariance: 1, teamSize: 6 },
      { name: "ERP Migration", budgetVariance: 12, scheduleVariance: 9, teamSize: 20 },
      { name: "Customer 360", budgetVariance: 4, scheduleVariance: -1, teamSize: 10 },
    ],
  },
};

const bubbleChartArgs: BubbleChartProps = {
  title: "Initiative portfolio bubble map",
  data: {
    xKey: "budgetVariance",
    yKey: "scheduleVariance",
    zKey: "teamSize",
    labelKey: "name",
    seriesKey: "portfolio",
    data: [
      {
        name: "Vendor Portal",
        portfolio: "Core Systems",
        budgetVariance: 3,
        scheduleVariance: 2,
        teamSize: 8,
      },
      {
        name: "Pricing Rollout",
        portfolio: "Growth",
        budgetVariance: 8,
        scheduleVariance: 6,
        teamSize: 12,
      },
      {
        name: "Mobile App",
        portfolio: "Customer Experience",
        budgetVariance: -2,
        scheduleVariance: 1,
        teamSize: 6,
      },
      {
        name: "ERP Migration",
        portfolio: "Core Systems",
        budgetVariance: 12,
        scheduleVariance: 9,
        teamSize: 20,
      },
      {
        name: "Customer 360",
        portfolio: "Growth",
        budgetVariance: 4,
        scheduleVariance: -1,
        teamSize: 10,
      },
    ],
  },
};

const denseBubbleChartArgs: BubbleChartProps = {
  title: "Capacity vs complexity bubble distribution",
  data: {
    xKey: "complexity",
    yKey: "capacity",
    zKey: "workload",
    labelKey: "initiative",
    seriesKey: "lane",
    data: [
      { initiative: "A1", lane: "Platform", complexity: 6, capacity: 7, workload: 4 },
      { initiative: "A2", lane: "Platform", complexity: 7, capacity: 6, workload: 4 },
      { initiative: "B1", lane: "Growth", complexity: 5, capacity: 5, workload: 9 },
      { initiative: "B2", lane: "Growth", complexity: 6, capacity: 5, workload: 12 },
      { initiative: "C1", lane: "Risk", complexity: 4, capacity: 4, workload: 18 },
      { initiative: "C2", lane: "Risk", complexity: 8, capacity: 7, workload: 22 },
      { initiative: "D1", lane: "Customer", complexity: 7, capacity: 8, workload: 22 },
      { initiative: "D2", lane: "Customer", complexity: 8, capacity: 8, workload: 24 },
    ],
  },
};

const timelineChartArgs: TimelineChartProps = {
  title: "Portfolio delivery timeline",
  data: {
    startDateKey: "startDate",
    endDateKey: "endDate",
    labelKey: "label",
    groupKey: "program",
    statusKey: "status",
    rangeStartAt: "2025-01-03T00:00:00.000Z",
    rangeEndAt: "2025-05-20T00:00:00.000Z",
    rangeStartMs: Date.parse("2025-01-03T00:00:00.000Z"),
    rangeEndMs: Date.parse("2025-05-20T00:00:00.000Z"),
    items: [
      {
        id: "1",
        label: "Discovery",
        group: "Vendor Portal",
        groupLabel: "Vendor Portal",
        startAt: "2025-01-03T00:00:00.000Z",
        endAt: "2025-02-04T00:00:00.000Z",
        startMs: Date.parse("2025-01-03T00:00:00.000Z"),
        endMs: Date.parse("2025-02-04T00:00:00.000Z"),
        lane: 0,
        status: "Done",
        source: { startDate: "2025-01-03", endDate: "2025-02-04", label: "Discovery" },
      },
      {
        id: "2",
        label: "Build and integration",
        group: "Vendor Portal",
        groupLabel: "Vendor Portal",
        startAt: "2025-02-01T00:00:00.000Z",
        endAt: "2025-03-28T00:00:00.000Z",
        startMs: Date.parse("2025-02-01T00:00:00.000Z"),
        endMs: Date.parse("2025-03-28T00:00:00.000Z"),
        lane: 1,
        status: "In Progress",
        source: { startDate: "2025-02-01", endDate: "2025-03-28", label: "Build and integration" },
      },
      {
        id: "3",
        label: "Pilot launch with a very long milestone label that needs truncation",
        group: "Vendor Portal",
        groupLabel: "Vendor Portal",
        startAt: "2025-04-02T00:00:00.000Z",
        endAt: "2025-05-20T00:00:00.000Z",
        startMs: Date.parse("2025-04-02T00:00:00.000Z"),
        endMs: Date.parse("2025-05-20T00:00:00.000Z"),
        lane: 0,
        status: "Planned",
        source: { startDate: "2025-04-02", endDate: "2025-05-20", label: "Pilot launch" },
      },
      {
        id: "4",
        label: "Data migration",
        group: "ERP Modernization",
        groupLabel: "ERP Modernization",
        startAt: "2025-01-15T00:00:00.000Z",
        endAt: "2025-03-12T00:00:00.000Z",
        startMs: Date.parse("2025-01-15T00:00:00.000Z"),
        endMs: Date.parse("2025-03-12T00:00:00.000Z"),
        lane: 0,
        status: "At Risk",
        source: { startDate: "2025-01-15", endDate: "2025-03-12", label: "Data migration" },
      },
      {
        id: "5",
        label: "Cutover",
        group: "ERP Modernization",
        groupLabel: "ERP Modernization",
        startAt: "2025-03-18T00:00:00.000Z",
        endAt: "2025-04-10T00:00:00.000Z",
        startMs: Date.parse("2025-03-18T00:00:00.000Z"),
        endMs: Date.parse("2025-04-10T00:00:00.000Z"),
        lane: 0,
        status: "Planned",
        source: { startDate: "2025-03-18", endDate: "2025-04-10", label: "Cutover" },
      },
    ],
    groups: [
      {
        key: "Vendor Portal",
        label: "Vendor Portal",
        laneCount: 2,
        items: [],
      },
      {
        key: "ERP Modernization",
        label: "ERP Modernization",
        laneCount: 1,
        items: [],
      },
    ],
  },
};

timelineChartArgs.data.groups[0].items = timelineChartArgs.data.items.filter(
  (item) => item.group === "Vendor Portal"
);
timelineChartArgs.data.groups[1].items = timelineChartArgs.data.items.filter(
  (item) => item.group === "ERP Modernization"
);

const meta: Meta<typeof BarChartView> = {
  title: "Components/Visualizations/Charts",
  component: BarChartView,
  parameters: componentStoryParameters,
  decorators: [withComponentFrame],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const BarChart: Story = {
  args: barChartArgs,
  parameters: {
    frame: {
      maxWidth: "1080px",
      minHeight: "480px",
    },
  },
};

export const LineChart: Story = {
  render: () => <LineChartWidgetView {...lineChartArgs} />,
  name: "Line Chart",
  parameters: {
    frame: {
      maxWidth: "1120px",
      minHeight: "500px",
    },
  },
};

export const AreaChart: Story = {
  render: () => <AreaChartView {...areaChartArgs} />,
  name: "Area Chart",
  parameters: {
    frame: {
      maxWidth: "1120px",
      minHeight: "500px",
    },
  },
};

export const PieChart: Story = {
  render: () => <PieChartView {...pieChartArgs} />,
  name: "Pie Chart",
  parameters: {
    frame: {
      maxWidth: "760px",
      minHeight: "460px",
    },
  },
};

export const SpiralChart: Story = {
  render: () => <SpiralChartView {...spiralChartArgs} />,
  name: "Spiral Chart",
  parameters: {
    frame: {
      maxWidth: "960px",
      minHeight: "520px",
    },
  },
};

export const DoughnutChart: Story = {
  render: () => <DoughnutChartView {...doughnutChartArgs} />,
  name: "Doughnut Chart",
  parameters: {
    frame: {
      maxWidth: "760px",
      minHeight: "460px",
    },
  },
};

export const StackedBarChart: Story = {
  render: () => <StackedBarChartView {...stackedBarArgs} />,
  name: "Stacked Bar Chart",
  parameters: {
    frame: {
      maxWidth: "1120px",
      minHeight: "500px",
    },
  },
};

export const FunnelChart: Story = {
  render: () => <FunnelChartView {...funnelChartArgs} />,
  name: "Funnel Chart",
  parameters: {
    frame: {
      maxWidth: "760px",
      minHeight: "460px",
    },
  },
};

export const ScatterChart: Story = {
  render: () => <ScatterChartView {...scatterChartArgs} />,
  name: "Scatter Chart",
  parameters: {
    frame: {
      maxWidth: "1080px",
      minHeight: "500px",
    },
  },
};

export const BubbleChart: Story = {
  render: () => <BubbleChartView {...bubbleChartArgs} />,
  name: "Bubble Chart",
  parameters: {
    frame: {
      maxWidth: "1080px",
      minHeight: "520px",
    },
  },
};

export const BubbleChartDense: Story = {
  render: () => <BubbleChartView {...denseBubbleChartArgs} />,
  name: "Bubble Chart Dense",
  parameters: {
    frame: {
      maxWidth: "1080px",
      minHeight: "520px",
    },
  },
};

export const TimelineChart: Story = {
  render: () => <TimelineChartView {...timelineChartArgs} />,
  name: "Timeline Chart",
  parameters: {
    frame: {
      maxWidth: "1240px",
      minHeight: "560px",
    },
  },
};

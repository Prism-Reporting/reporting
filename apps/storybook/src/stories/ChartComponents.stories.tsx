import type { Meta, StoryObj } from "@storybook/react";
import type {
  AreaChartProps,
  BarChartProps,
  DoughnutChartProps,
  FunnelChartProps,
  LineChartProps,
  PieChartProps,
  ScatterChartProps,
  StackedBarChartProps,
} from "@reporting/core";
import {
  AreaChartView,
  BarChartView,
  DoughnutChartView,
  FunnelChartView,
  LineChartWidgetView,
  PieChartView,
  ScatterChartView,
  StackedBarChartView,
} from "@reporting/react-ui";

const chartFrameStyle = {
  width: "100%",
  maxWidth: "1040px",
  height: "480px",
};

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

const meta: Meta<typeof BarChartView> = {
  title: "Components/Charts/Bar Chart",
  component: BarChartView,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div style={chartFrameStyle}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const BarChart: Story = {
  args: barChartArgs,
};

export const LineChart: Story = {
  render: () => <LineChartWidgetView {...lineChartArgs} />,
  name: "Line Chart",
};

export const AreaChart: Story = {
  render: () => <AreaChartView {...areaChartArgs} />,
  name: "Area Chart",
};

export const PieChart: Story = {
  render: () => <PieChartView {...pieChartArgs} />,
  name: "Pie Chart",
};

export const DoughnutChart: Story = {
  render: () => <DoughnutChartView {...doughnutChartArgs} />,
  name: "Doughnut Chart",
};

export const StackedBarChart: Story = {
  render: () => <StackedBarChartView {...stackedBarArgs} />,
  name: "Stacked Bar Chart",
};

export const FunnelChart: Story = {
  render: () => <FunnelChartView {...funnelChartArgs} />,
  name: "Funnel Chart",
};

export const ScatterChart: Story = {
  render: () => <ScatterChartView {...scatterChartArgs} />,
  name: "Scatter Chart",
};

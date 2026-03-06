import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ReportRenderer, defaultRegistry } from "@reporting/react-ui";
import { tasksDataProvider } from "../mock-data";
import type { ReportSpec } from "@reporting/core";

const defaultSpec: ReportSpec = {
  id: "playground",
  title: "Spec Playground",
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
        ],
      },
    },
  ],
};

const meta: Meta<typeof ReportRenderer> = {
  component: ReportRenderer,
  title: "Reports/Spec Playground",
  parameters: {
    layout: "padded",
  },
};

export default meta;

type Story = StoryObj<typeof ReportRenderer>;

function SpecPlaygroundWrapper() {
  const [spec, setSpec] = useState<ReportSpec>(defaultSpec);
  const [title, setTitle] = useState(defaultSpec.title);
  const [layout, setLayout] = useState<"singleColumn" | "twoColumn">(
    defaultSpec.layout
  );

  const appliedSpec: ReportSpec = {
    ...spec,
    title,
    layout,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div
        style={{
          padding: "1rem",
          background: "#f9fafb",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
        }}
      >
        <h4 style={{ margin: "0 0 0.75rem 0" }}>Edit Spec (Controls)</h4>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <label>
            Title:{" "}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ padding: "0.25rem 0.5rem", minWidth: 200 }}
            />
          </label>
          <label>
            Layout:{" "}
            <select
              value={layout}
              onChange={(e) =>
                setLayout(e.target.value as "singleColumn" | "twoColumn")
              }
              style={{ padding: "0.25rem 0.5rem" }}
            >
              <option value="singleColumn">Single Column</option>
              <option value="twoColumn">Two Column</option>
            </select>
          </label>
        </div>
      </div>
      <ReportRenderer
        spec={appliedSpec}
        dataProvider={tasksDataProvider}
        registry={defaultRegistry}
      />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <SpecPlaygroundWrapper />,
};

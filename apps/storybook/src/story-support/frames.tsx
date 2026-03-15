import type { CSSProperties, PropsWithChildren } from "react";
import type { Decorator, Parameters } from "@storybook/react";

type FrameConfig = {
  maxWidth?: string;
  minHeight?: string;
  height?: string;
  padding?: string;
  background?: string;
  align?: "center" | "stretch";
};

type ResolvedFrameConfig = Omit<Required<FrameConfig>, "height"> & {
  height?: string;
};

const DEFAULT_COMPONENT_FRAME: ResolvedFrameConfig = {
  maxWidth: "1080px",
  minHeight: "420px",
  height: "420px",
  padding: "32px",
  background: "#e5e7eb",
  align: "center",
};

const DEFAULT_REPORT_FRAME: ResolvedFrameConfig = {
  maxWidth: "1360px",
  minHeight: "100vh",
  padding: "24px",
  background: "#eef2f7",
  align: "stretch",
};

function StoryFrame({
  children,
  config,
}: PropsWithChildren<{ config: ResolvedFrameConfig }>) {
  const shellStyle: CSSProperties = {
    minHeight: config.minHeight,
    padding: config.padding,
    background: config.background,
    display: "flex",
    justifyContent: "center",
    alignItems: config.align === "center" ? "center" : "flex-start",
    boxSizing: "border-box",
  };

  const canvasStyle: CSSProperties = {
    width: "100%",
    maxWidth: config.maxWidth,
    minHeight: config.minHeight,
    height: config.height ?? config.minHeight,
  };

  return (
    <div style={shellStyle}>
      <div style={canvasStyle}>{children}</div>
    </div>
  );
}

export function createStoryFrameDecorator(
  defaults: ResolvedFrameConfig
): Decorator {
  return (Story, context) => {
    const config = {
      ...defaults,
      ...((context.parameters.frame ?? {}) as FrameConfig),
    };

    return (
      <StoryFrame config={config}>
        <Story />
      </StoryFrame>
    );
  };
}

export const withComponentFrame = createStoryFrameDecorator(DEFAULT_COMPONENT_FRAME);
export const withReportFrame = createStoryFrameDecorator(DEFAULT_REPORT_FRAME);

export const componentStoryParameters: Parameters = {
  layout: "fullscreen",
  viewport: {
    defaultViewport: "widgetWide",
  },
};

export const reportStoryParameters: Parameters = {
  layout: "fullscreen",
  viewport: {
    defaultViewport: "reportDesktop",
  },
};

import type { Preview } from "@storybook/react";
import "@prism-reporting/react-ui/style.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ["Components", "Reports"],
      },
    },
    viewport: {
      viewports: {
        widgetCompact: {
          name: "Widget / Compact",
          styles: {
            width: "480px",
            height: "720px",
          },
        },
        widgetWide: {
          name: "Widget / Wide",
          styles: {
            width: "1280px",
            height: "900px",
          },
        },
        reportTablet: {
          name: "Report / Tablet",
          styles: {
            width: "900px",
            height: "1100px",
          },
        },
        reportDesktop: {
          name: "Report / Desktop",
          styles: {
            width: "1440px",
            height: "1200px",
          },
        },
      },
      defaultViewport: "reportDesktop",
    },
  },
};

export default preview;

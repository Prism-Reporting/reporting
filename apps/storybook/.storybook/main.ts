import type { StorybookConfig } from "@storybook/react-vite";
import { resolve } from "path";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    const { existsSync } = await import("fs");
    const cwd = process.cwd();
    let root = cwd;
    for (let i = 0; i < 5; i++) {
      if (existsSync(resolve(root, "packages/core"))) break;
      root = resolve(root, "..");
    }
    const pathToCore = resolve(root, "packages/core/dist/index.js");
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@reporting/core": pathToCore,
    };
    config.resolve.dedupe = config.resolve.dedupe || [];
    if (!config.resolve.dedupe.includes("react")) {
      config.resolve.dedupe.push("react");
    }
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.include = [
      ...(config.optimizeDeps.include || []),
      "@reporting/core",
    ];
    config.server = config.server || {};
    config.server.fs = config.server.fs || {};
    config.server.fs.allow = [
      ...(config.server?.fs?.allow || []),
      root,
      resolve(root, "packages/core"),
    ];
    return config;
  },
};

export default config;

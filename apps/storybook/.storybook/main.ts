import type { StorybookConfig } from "@storybook/react-vite";
import { resolve } from "path";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
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
    const pathToCore = resolve(root, "packages/core/src/index.ts");
    const pathToReactUi = resolve(root, "packages/react-ui/src/index.ts");
    const pathToReactUiStyle = resolve(root, "packages/react-ui/src/style.css");
    config.resolve = config.resolve || {};
    const existingAliases = Array.isArray(config.resolve.alias)
      ? config.resolve.alias
      : Object.entries(config.resolve.alias || {}).map(([find, replacement]) => ({
          find,
          replacement,
        }));
    config.resolve.alias = [
      ...existingAliases,
      { find: "@reporting/core", replacement: pathToCore },
      { find: "@reporting/react-ui/style.css", replacement: pathToReactUiStyle },
      { find: "@reporting/react-ui", replacement: pathToReactUi },
    ];
    config.resolve.dedupe = config.resolve.dedupe || [];
    if (!config.resolve.dedupe.includes("react")) {
      config.resolve.dedupe.push("react");
    }
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.exclude = [
      ...(config.optimizeDeps.exclude || []),
      "@reporting/core",
      "@reporting/react-ui",
    ];
    config.server = config.server || {};
    config.server.fs = config.server.fs || {};
    config.server.fs.allow = [
      ...(config.server?.fs?.allow || []),
      root,
      resolve(root, "packages/core"),
      resolve(root, "packages/react-ui"),
    ];
    return config;
  },
};

export default config;

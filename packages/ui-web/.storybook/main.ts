import type { StorybookConfig } from "@storybook/react-vite";
import { createRepoAliases, uiWebAliasKeys } from "../../config/aliases";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: "@storybook/react-vite",
  viteFinal: async (config) => {
    config.resolve ??= {};
    config.resolve.alias = {
      ...createRepoAliases(uiWebAliasKeys),
      ...config.resolve.alias,
    };
    return config;
  },
};

export default config;

import path from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: ["../public"],
  docs: {
    autodocs: "tag",
  },
  async viteFinal(config) {
    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string>),
      // Provide lightweight stand-ins for Next.js runtime modules.
      "next/link": path.resolve(__dirname, "mocks/next-link.tsx"),
      "next/navigation": path.resolve(__dirname, "mocks/next-navigation.tsx"),
      "next/image": path.resolve(__dirname, "mocks/next-image.tsx"),
      // Path alias that mirrors tsconfig "@/*" → "src/*"
      "@": path.resolve(__dirname, "../src"),
    };
    // Polyfill `process` for browser bundles — vfile/unified and some auth
    // lib code reference process.env at module evaluation time.
    config.define = {
      ...config.define,
      "process.env.NODE_ENV": JSON.stringify("development"),
      "process.env": "({})",
      "process": "({ env: { NODE_ENV: 'development' } })",
    };
    return config;
  },
};

export default config;

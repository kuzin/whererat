import type { Decorator, Preview } from "@storybook/react";
import { TooltipProvider } from "../src/components/tooltip-provider";
import "../src/app/globals.css";

const withProviders: Decorator = (Story, context) => {
  const isDark = context.globals.theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.background = isDark ? "#1c1917" : "#fff9f1";
  return (
    <TooltipProvider>
      <Story />
    </TooltipProvider>
  );
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Color scheme",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withProviders],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
    layout: "centered",
  },
};

export default preview;

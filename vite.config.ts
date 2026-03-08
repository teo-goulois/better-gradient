import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
// @ts-ignore
import postcssEasingGradients from "postcss-easing-gradients";

const config = defineConfig({
  css: {
    postcss: {
      plugins: [postcssEasingGradients],
    },
  },
  plugins: [
    tsconfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    devtools(),
    tanstackStart(),
    viteReact({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
  ],
});

export default config;

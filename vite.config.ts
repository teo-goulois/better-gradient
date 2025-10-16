import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
// @ts-ignore
import postcssEasingGradients from 'postcss-easing-gradients';

const config = defineConfig({
  css:{
    postcss: {
      plugins: [
        postcssEasingGradients,
      ],
    }
  },
  plugins: [
    devtools(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      customViteReactPlugin: true,
    }),
    viteReact({ babel: {
        plugins: ['babel-plugin-react-compiler'],
      },}),
  ],
})

export default config

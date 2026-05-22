import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
// @ts-ignore
import postcssEasingGradients from 'postcss-easing-gradients';

const isLocalifyDev = process.env.LOCALIFY_DEV === '1'

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
  server: {
    allowedHosts: ['better-gradient.localify'],
    ...(isLocalifyDev
      ? {
          hmr: {
            protocol: 'ws',
            host: '127.0.0.1',
            clientPort: 59639,
          },
        }
      : {}),
  },
})

export default config

import { defineConfig } from 'vite'
import { createRequire } from 'node:module'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
// @ts-ignore
import postcssEasingGradients from 'postcss-easing-gradients';

const isLocalifyDev = process.env.LOCALIFY_DEV === '1'
const isWorkerBuild = process.env.BETTER_GRADIENT_RUNTIME === 'worker'
const require = createRequire(import.meta.url)

const config = defineConfig({
  define: {
    'process.env.BETTER_GRADIENT_RUNTIME': JSON.stringify(isWorkerBuild ? 'worker' : 'node'),
  },
  resolve: {
    alias: isWorkerBuild ? [{ find: /^@libsql\/client$/, replacement: require.resolve('@libsql/client/web') }] : [],
  },
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

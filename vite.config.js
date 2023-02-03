import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import GitRevision from 'vite-plugin-git-revision'
import { VitePWA } from 'vite-plugin-pwa'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    GitRevision({ branch: true }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html}'],
        globIgnores: ['**/*local.js'],
        runtimeCaching: [
          {
            urlPattern: /^.*\/local\.js/,
            handler: 'NetworkFirst',
          },
        ],
      },
      includeAssets: ['favicon.ico', 'robots.txt', 'img/icons/apple-touch-icon.png'],
      manifest: {
        name: 'XMPP Web',
        // eslint-disable-next-line camelcase
        short_name: 'XMPP Web',
        description: 'Lightweight web chat client for XMPP server',
        // eslint-disable-next-line camelcase
        theme_color: '#333333',
        // eslint-disable-next-line camelcase
        background_color: '#333333',
        icons: [
          {
            src: 'img/icons/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'img/icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'img/icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  build: {
    rollupOptions: {
      plugins: [
      ],
    },
    target: 'modules',
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

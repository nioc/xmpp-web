import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import istanbul from 'vite-plugin-istanbul'
import mkcert from 'vite-plugin-mkcert'
import { visualizer } from 'rollup-plugin-visualizer'

process.env.VITE_GIT_BRANCH = require('child_process')
  .execSync('git rev-parse --abbrev-ref HEAD')
  .toString().trimEnd()
process.env.VITE_GIT_VERSION = require('child_process')
  .execSync('git describe --tags --dirty')
  .toString().trimEnd()

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    watch: {
      ignored: [
        '**/coverage/**',
        '**/.nyc_output/**',
      ],
    },
  },
  plugins: [
    mkcert({
      savePath: './certs',
      force: true,
    }),
    vue(),
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
    istanbul({
      extension: ['.js', '.ts', '.vue'],
      cypress: true,
      forceBuildInstrument: true,
    }),
    visualizer({
      open: true,
      gzipSize: true,
    }),
  ],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    sourcemap: 'hidden',
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

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['hammer.svg'],
      manifest: {
        name: 'ContractorPro',
        short_name: 'ContractorPro',
        description: 'Your contracting business, handled. Estimates, invoices, clients, and more.',
        theme_color: '#F97316',
        background_color: '#FAFAF7',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/hammer.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/hammer.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
          { src: '/hammer.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/auth/],
        // Main bundle includes @react-pdf/renderer (~2.2MB). Bump precache cap to 5MB.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
  server: { port: 3000 },
})

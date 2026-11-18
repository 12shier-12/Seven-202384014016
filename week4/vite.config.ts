import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Relative asset paths, so the build works on any GitHub Pages sub-path
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Triply — Offline Trip & Packing Planner',
        short_name: 'Triply',
        description:
          'Offline-first trip planner: day-by-day itinerary and a packing list generated from trip data.',
        lang: 'zh-CN',
        theme_color: '#4f46e5',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.ts'],
    },
  },
});

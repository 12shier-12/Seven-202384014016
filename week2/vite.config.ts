import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // 相对路径，GitHub Pages 部署到任意子路径都能用
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.ts'],
    },
  },
});

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // Use jsdom for React component tests
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        '**/types/**',
        '**/migrations/**',
        '.next/**',
        '**/.next/**',
        'dist/**',
        'build/**',
        'coverage/**',
        '**/coverage/**',
      ],
      include: [
        'app/**',
        'components/**',
        'lib/**',
        'workers/**',
      ],
      all: false, // Only collect coverage for files that are imported
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});


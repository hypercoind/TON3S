import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.js', '**/__tests__/*.js'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      include: ['src/**/*.js'],
      exclude: [
        '**/*.test.js',
        '**/__tests__/**',
        'src/index.js'  // Entry point with server start
      ],
      thresholds: {
        global: {
          statements: 50,
          branches: 50,
          functions: 50,
          lines: 50
        }
      }
    },
    globals: true
  }
});

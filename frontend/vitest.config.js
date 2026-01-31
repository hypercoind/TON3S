import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '../../wasm/pkg/ton3s_signer.js': new URL('./src/services/__mocks__/wasm-signer-stub.js', import.meta.url).pathname
    }
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.js', 'src/**/__tests__/*.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: [
        'src/**/*.test.js',
        'src/**/__tests__/**',
        'src/main.js',
        'src/data/**'
      ],
      thresholds: {
        global: {
          statements: 30,
          branches: 30,
          functions: 30,
          lines: 30
        }
      }
    },
    globals: true
  }
});

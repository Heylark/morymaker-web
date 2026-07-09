import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // 모듈 최상단에서 process.env를 읽어 상수화하는 파일(lib/api.ts의 API_BASE 등)이 있어
    // 테스트 실행 전에 미리 값을 심어둔다(개별 테스트의 beforeEach보다 먼저 적용되어야 함).
    env: {
      AUTH_ISSUER: 'http://localhost:30000',
      AUTH_CLIENT_ID: 'morymaker-web',
      AUTH_CLIENT_SECRET: 'dev-secret',
      AUTH_REDIRECT_URI: 'http://localhost:3000/oauth/callback',
      AUTH_HMAC_SECRET: 'test-secret-at-least-32-chars-long',
      API_BASE_URL: 'http://localhost:30100',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

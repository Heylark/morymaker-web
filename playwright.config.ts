import { defineConfig, devices } from '@playwright/test';

/**
 * production 빌드(next build + next start)로 서버를 띄운다 — 개발 서버(next dev, Turbopack)는
 * 이 워크트리의 docs 심볼릭 링크를 만나면 파일시스템 샌드박스 패닉을 일으킨다(사전 존재 환경
 * 이슈, 이 REQ와 무관 — 관련 내용은 TASK_LOG 결정 로그 참조). production 빌드는 CSS를 빌드
 * 시점에 처리해 이 문제를 겪지 않는다.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm build && pnpm exec next start -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});

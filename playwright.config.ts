import { defineConfig, devices } from '@playwright/test';

/**
 * production 빌드(next build + next start)로 서버를 띄운다 — 개발 서버(next dev, Turbopack)는
 * 이 워크트리의 docs 심볼릭 링크를 만나면 파일시스템 샌드박스 패닉을 일으킨다(사전 존재 환경
 * 이슈, 이 REQ와 무관 — 관련 내용은 TASK_LOG 결정 로그 참조). production 빌드는 CSS를 빌드
 * 시점에 처리해 이 문제를 겪지 않는다.
 */
// 미설정 시 3100 그대로(동작 무변화) — 병렬 워크트리가 동시에 로컬 서버를 띄울 때 서로 다른
// 포트를 지정해 다른 워크트리의 빌드를 재사용(교차 오염)하지 않도록 하는 탈출구.
const PORT = process.env.PW_PORT ?? '3100';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // 모바일 전용 스펙(*.mobile.spec.ts)은 별도 프로젝트가 담당 — 데스크톱 프로젝트에서
      // 이중 실행되면 데스크톱 전제로 짠 단언이 375px에서 의미가 변질된다.
      testIgnore: /\.mobile\.spec\.ts$/,
    },
    {
      name: 'mobile',
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 } },
      testMatch: /\.mobile\.spec\.ts$/,
    },
  ],
  webServer: {
    command: `pnpm build && pnpm exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});

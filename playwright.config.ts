import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

/**
 * playwright 프로세스(이 config·e2e/fixtures.ts가 도는 Node 프로세스)는 .env.local을 자동
 * 로드하지 않는다 — Next.js만 빌드·런타임에 읽는다. dotenv로 명시 로드하지 않으면
 * NEXT_PUBLIC_BASE_PATH가 undefined가 되어 fixtures.ts의 basePath 접두가 전부 빠지고
 * (webServer.command의 `pnpm build`는 별도 프로세스라 basePath 빌드 자체는 되지만) goto가
 * 미접두 경로로 나가 전량 404가 된다.
 */
dotenv.config({ path: '.env.local' });

/**
 * production 빌드(next build + next start)로 서버를 띄운다 — 개발 서버(next dev, Turbopack)는
 * 이 워크트리의 docs 심볼릭 링크를 만나면 파일시스템 샌드박스 패닉을 일으킨다(사전 존재 환경
 * 이슈, 이 REQ와 무관 — 관련 내용은 TASK_LOG 결정 로그 참조). production 빌드는 CSS를 빌드
 * 시점에 처리해 이 문제를 겪지 않는다.
 */
// 미설정 시 3100 그대로(동작 무변화) — 병렬 워크트리가 동시에 로컬 서버를 띄울 때 서로 다른
// 포트를 지정해 다른 워크트리의 빌드를 재사용(교차 오염)하지 않도록 하는 탈출구.
const PORT = process.env.PW_PORT ?? '3100';

// e2e/fixtures.ts가 읽는 것과 동일 env — webServer 레디니스 체크에도 동일 좌표계가 필요하다.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    // basePath는 여기 포함하지 않는다 — 포함하면 `new URL('/events', baseURL)`이 baseURL의
    // path를 통째로 대체해(URL 표준) basePath가 증발한다. 접두는 e2e/fixtures.ts 경계에서만.
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
    // basePath 하에서 루트 `/`는 404다 — 레디니스 체크가 이 URL로 폴링하는데 404를 불인정해서
    // 180s 타임아웃 후 "서버 안 뜸"으로 보인다(원인이 basePath로 드러나지 않는 함정). 실제
    // 앱 루트가 서빙되는 `${BASE_PATH}/` 하위로 폴링 지점을 옮긴다.
    url: `http://localhost:${PORT}${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});

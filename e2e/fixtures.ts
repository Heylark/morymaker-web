import { test as base, expect } from '@playwright/test';

/**
 * e2e basePath 접두 경계 — 앱 좌표계(스펙이 쓰는 `/events` 등)를 외부 좌표계(브라우저가
 * 실제로 요청하는 `/app/events`)로 이 fixture 안에서만 변환한다. 스펙 본문은 basePath를
 * 절대 알지 못한 채로 유지된다(가독성 보존 — 두 좌표계 원칙은 src/lib/base-path.ts와 동일).
 *
 * basePath는 next.config.ts가 읽는 것과 동일 env — 빌드타임 인라인이라 playwright 프로세스가
 * .env.local 을 자동 로드하지 않으면 undefined가 되어 전량 미접두(404)로 이어진다. 그래서
 * playwright.config.ts 최상단에서 dotenv로 .env.local 을 먼저 로드한다(이 파일은 그 이후 평가됨).
 */
// 스펙이 렌더된 DOM의 실제 href(예: <Link>가 basePath를 자동 접두해 만든 <a href>)를 단언할
// 때도 이 경계값을 공유한다 — goto 접두와 별개로 필요한 지점이라 여기서 함께 export한다.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const test = base.extend({
  page: async ({ page }, use) => {
    const rawGoto = page.goto.bind(page);
    page.goto = (async (url: string, opts?: Parameters<typeof rawGoto>[1]) => {
      if (typeof url === 'string' && url.startsWith('/')) {
        // 이미 접두된 경로를 다시 접두하면 /app/app — 조용한 404 대신 즉시 실패시킨다
        if (BASE_PATH && (url === BASE_PATH || url.startsWith(`${BASE_PATH}/`))) {
          throw new Error(`goto 경로에 basePath가 이미 포함됨(이중 적용): ${url}`);
        }
        return rawGoto(`${BASE_PATH}${url}`, opts);
      }
      return rawGoto(url, opts); // 절대 URL은 그대로
    }) as typeof page.goto;
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright 픽스처 콜백 파라미터(React 훅 아님)를 "use" 접두 이름만 보고 훅 호출로 오인하는 오탐
    await use(page);
  },
});

export { expect };

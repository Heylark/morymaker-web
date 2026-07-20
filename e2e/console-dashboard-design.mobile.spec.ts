import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * 콘솔 행사 현황(ADM-03) 모바일(375px) 반응형 스모크 — -07이 확립한 하단 탭바 셸에 통계
 * 메뉴가 정상 노출되고 5블록 그리드가 오버플로/다크 누출 없이 단일 열로 접히는지 확인한다.
 * `*.mobile.spec.ts` 전용 프로젝트에서만 실행(playwright.config.ts testMatch).
 */

const EID = '85f20822-7a48-4163-afa1-d0a71568df05';

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `test-screenshots/REQ-0018-05/${name}.png`, fullPage: true });
}

async function login(page: Page) {
  await page.goto('/events');
  await page.locator('input[name="username"]').fill('dev-verify@morymaker.local');
  await page.locator('input[name="password"]').fill('DevPassw0rd!');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/events');
}

async function assertNoOverflowNoDarkLeak(page: Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    metrics.scrollWidth,
    `가로 스크롤 발생 — scrollWidth(${metrics.scrollWidth})가 clientWidth(${metrics.clientWidth})를 넘으면 안 됨`,
  ).toBeLessThanOrEqual(metrics.clientWidth);

  const lightBg = await page.evaluate(() => {
    const el = document.querySelector('[data-theme="light"]');
    return el ? getComputedStyle(el).backgroundColor : null;
  });
  expect(lightBg, '라이트 wrapper 배경이 정상 렌더돼야 다크 body가 새지 않음').toBe('rgb(247, 245, 239)');
}

test.describe('콘솔 셸 — 행사 현황(대시보드) 모바일(375px) 반응형', () => {
  test('대시보드 — 오버플로 0 + 하단 탭바 활성 하이라이트 + 5블록 단일 열 렌더', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/dashboard`);
    await expect(page.getByRole('heading', { name: '행사 현황', level: 1 })).toBeVisible();
    await assertNoOverflowNoDarkLeak(page);

    const bottomNav = page.getByRole('navigation', { name: '주요 메뉴' });
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: '통계' })).toHaveAttribute('aria-current', 'page');

    // 사이드바는 md 미만에서 숨김
    await expect(page.getByRole('link', { name: '← 행사 목록' })).toBeHidden();

    for (const title of ['등록 현황', '참석 현황', '주차 현황', '도착 현황', '누적 참석 추이']) {
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
    }

    await shot(page, 'mobile-dashboard-initial');
  });
});

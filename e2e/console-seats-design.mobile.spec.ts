import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * 콘솔 좌석 구성(ADM-06) 모바일(375px) 반응형 스모크 — -07이 확립한 하단 탭바 셸에 좌석 메뉴가
 * 정상 노출되고 오버플로/다크 누출이 없는지 확인한다. `*.mobile.spec.ts` 전용 프로젝트에서만
 * 실행된다(playwright.config.ts testMatch).
 */

const EID = 'e757ba35-c62e-471a-99da-6f301abc3660';

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `test-screenshots/REQ-0018-03/${name}.png`, fullPage: true });
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

test.describe('콘솔 셸 — 좌석 화면 모바일(375px) 반응형', () => {
  test('좌석 화면 — 오버플로 0 + 하단 탭바 활성 하이라이트', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/seats`);
    await assertNoOverflowNoDarkLeak(page);

    const bottomNav = page.getByRole('navigation', { name: '주요 메뉴' });
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: '좌석' })).toHaveAttribute('aria-current', 'page');
    await expect(bottomNav.getByRole('link', { name: '명단' })).not.toHaveAttribute('aria-current', 'page');

    // 사이드바는 md 미만에서 숨김(hidden md:flex)
    await expect(page.getByRole('link', { name: '← 행사 목록' })).toBeHidden();

    await shot(page, 'mobile-seats-initial');
  });

  test('주차 화면 — 375px에서도 스타일 정합 후 오버플로/다크 누출 없음', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/parking`);
    await assertNoOverflowNoDarkLeak(page);
    const bottomNav = page.getByRole('navigation', { name: '주요 메뉴' });
    await expect(bottomNav.getByRole('link', { name: '주차' })).toHaveAttribute('aria-current', 'page');
    await shot(page, 'mobile-parking-after-style-alignment');
  });
});

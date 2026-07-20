import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * 콘솔 브랜딩·대기화면(ADM-04) 모바일(375px) 반응형 스모크 — 하단 탭바 셸에 브랜딩 메뉴가 정상
 * 노출되고 오버플로/다크 누출이 없는지, 컬러 피커·프리뷰·대기화면 카드가 좁은 폭에서 접히는지
 * 확인한다. `*.mobile.spec.ts` 전용 프로젝트에서만 실행된다(playwright.config.ts testMatch).
 */

const EID = 'e757ba35-c62e-471a-99da-6f301abc3660';

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `test-screenshots/REQ-0018-04/${name}.png`, fullPage: true });
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

test.describe('콘솔 셸 — 브랜딩 화면 모바일(375px) 반응형', () => {
  test('브랜딩 화면 — 오버플로 0 + 하단 탭바 브랜딩 활성 + 사이드바 숨김', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/branding`);
    await assertNoOverflowNoDarkLeak(page);

    const bottomNav = page.getByRole('navigation', { name: '주요 메뉴' });
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: '브랜딩' })).toHaveAttribute('aria-current', 'page');

    // 사이드바는 md 미만에서 숨김(hidden md:flex)
    await expect(page.getByRole('link', { name: '← 행사 목록' })).toBeHidden();

    // 브랜딩 폼·프리뷰·대기화면이 좁은 폭에서 렌더되는지(heading 도달성)
    await expect(page.getByRole('heading', { name: '행사 브랜딩 컬러' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '대기화면 콘텐츠' })).toBeVisible();
    await shot(page, 'mobile-ADM-04-branding-initial');
  });

  test('컬러 피커 2종 375px 렌더 + 프리뷰 실시간 반영', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/branding`);
    await assertNoOverflowNoDarkLeak(page);

    for (const label of ['배경색', '포인트색']) {
      await expect(page.getByLabel(label)).toBeVisible();
    }
    // titleColor·bodyColor는 공개 뷰 미소비라 편집 UI가 없다(데스크톱 스펙과 동일 전제).
    for (const label of ['제목색', '본문색']) {
      await expect(page.getByLabel(label)).toHaveCount(0);
    }
    await page.getByLabel('포인트색').fill('#ff0000');
    const btn = page.getByText('참석 확인', { exact: true });
    await expect(btn).toHaveCSS('background-color', 'rgb(255, 0, 0)');
    await shot(page, 'mobile-ADM-04-preview-live');
  });
});

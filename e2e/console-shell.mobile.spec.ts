import { test, expect, type Page } from '@playwright/test';

/**
 * 콘솔 셸 375px 반응형 회귀 가드 — 좁은 뷰포트에서 사이드바가 화면을 압착해 콘텐츠가 컨테이너
 * 밖으로 밀려나고 그 틈에서 body 기본 다크 배경이 드러나던 결함(가로 스크롤 + 다크 누출)이
 * 다시 나타나지 않는지 확인한다. 이 파일은 `*.mobile.spec.ts` 전용 프로젝트에서만 실행되고
 * (뷰포트 375×812 기본), 데스크톱 프로젝트는 건드리지 않는다 — 기존 콘솔 스펙과 완전히 분리된
 * 신규 스펙(기존 스펙 무접촉).
 *
 * 데이터: `console-roster-design.spec.ts`와 동일한 로컬 개발 DB 이벤트를 재사용한다(로컬 전용,
 * 운영 데이터 아님).
 */

const EID = 'e757ba35-c62e-471a-99da-6f301abc3660';

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `test-screenshots/REQ-0018-07/${name}.png`, fullPage: true });
}

async function login(page: Page) {
  await page.goto('/events');
  await page.locator('input[name="username"]').fill('dev-verify@morymaker.local');
  await page.locator('input[name="password"]').fill('DevPassw0rd!');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/events');
}

/**
 * 가로 오버플로 부재 + 다크 누출 부재를 함께 확인한다 — scrollWidth가 clientWidth를 넘으면
 * 컨테이너 밖으로 콘텐츠가 밀려난 것이고, 그 틈에서 라이트 wrapper 배경이 아닌 body의 원래
 * 다크 배경이 비치면 다크 누출이다.
 */
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

test.describe('콘솔 셸 — 모바일(375px) 반응형 회귀', () => {
  test('명단 화면 — 오버플로 0 + 하단 탭바 노출 + 데스크톱 사이드바 숨김', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/roster`);
    await assertNoOverflowNoDarkLeak(page);

    const bottomNav = page.getByRole('navigation', { name: '주요 메뉴' });
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: '명단' })).toHaveAttribute('aria-current', 'page');

    // 사이드바는 md 미만에서 렌더 자체를 숨긴다(hidden md:flex) — 안의 링크도 함께 숨겨진다.
    await expect(page.getByRole('link', { name: '← 행사 목록' })).toBeHidden();

    await shot(page, 'mobile-roster');
  });

  test('주차 구획 화면 — 오버플로 0 + 탭바 활성 하이라이트가 현재 경로만 가리킴', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/parking`);
    await assertNoOverflowNoDarkLeak(page);

    const bottomNav = page.getByRole('navigation', { name: '주요 메뉴' });
    await expect(bottomNav.getByRole('link', { name: '주차' })).toHaveAttribute('aria-current', 'page');
    await expect(bottomNav.getByRole('link', { name: '명단' })).not.toHaveAttribute('aria-current', 'page');

    await shot(page, 'mobile-parking');
  });

  test('데스크톱 뷰포트로 전환 — 사이드바 회귀 0 + 하단 탭바 숨김', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/roster`);

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByRole('link', { name: '← 행사 목록' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: '주요 메뉴' })).toBeHidden();
    await shot(page, 'desktop-roster-after-mobile');
  });

  test('명단 개별 등록 입력 — 콘솔 스코프 iOS 자동 확대 방지(포커스 폰트 ≥16px)', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/roster`);

    await page.getByRole('button', { name: '개별 등록' }).click();
    const nameInput = page.locator('form input').first();
    await nameInput.focus();
    const fontSize = await nameInput.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize, 'iOS 자동 확대 임계(16px) 미만이면 포커스 시 화면이 튐').toBeGreaterThanOrEqual(16);
  });
});

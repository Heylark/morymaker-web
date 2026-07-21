import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * REQ-0046 모바일(375px) 전용 검증 — V8-b(계정 시트 오버레이 단일 계약)·V20(상단 바 CTA 크기).
 * V7(기존 4케이스 셀렉터 정합화)은 `console-shell.mobile.spec.ts`가 이미 커버 — 중복 작성하지 않는다.
 */

const EID = 'e757ba35-c62e-471a-99da-6f301abc3660';

async function login(page: Page) {
  await page.goto('/events');
  await page.locator('input[name="username"]').fill('dev-verify@morymaker.local');
  await page.locator('input[name="password"]').fill('DevPassw0rd!');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/events');
}

test.describe('REQ-0046 모바일 — 계정 시트 오버레이 단일 계약 (V8-b)', () => {
  test('시트 오픈 시 (a) 탭바 클릭 불가 (b) 시트 하단이 탭바에 가리지 않음 (c) 닫은 뒤 해제', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/roster`);

    const tabbar = page.getByRole('navigation', { name: '주요 메뉴' });
    await expect(tabbar).toBeVisible();
    await expect(tabbar).not.toHaveAttribute('inert', '');

    await page.getByRole('button', { name: '계정' }).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();

    // (a) 탭바가 inert — 클릭해도 URL이 바뀌지 않아야 한다.
    await expect(tabbar, '시트 오픈 중 탭바는 inert여야 함').toHaveAttribute('inert', '');
    const urlBefore = page.url();
    await tabbar.getByRole('link').first().click({ force: true, trial: false }).catch(() => undefined);
    expect(page.url(), 'inert 상태에서 탭바 클릭은 라우트 이동을 유발하면 안 됨').toBe(urlBefore);

    // (b) 시트 하단 로그아웃 버튼이 탭바 상단보다 위(가려지지 않음)
    const logoutBox = await sheet.getByRole('button', { name: '로그아웃' }).boundingBox();
    const tabbarBox = await tabbar.boundingBox();
    expect(logoutBox).not.toBeNull();
    expect(tabbarBox).not.toBeNull();
    expect(logoutBox!.y + logoutBox!.height, '시트 로그아웃 버튼이 탭바 상단보다 아래(가려짐)면 안 됨').toBeLessThanOrEqual(
      tabbarBox!.y + 1,
    );

    // (c) 닫으면 inert 해제
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(tabbar).not.toHaveAttribute('inert', '');

    await page.screenshot({ path: 'test-screenshots/REQ-0046/mobile-account-sheet-open.png', fullPage: true });
  });
});

test.describe('REQ-0046 모바일 — 상단 바 CTA 크기 (V20)', () => {
  test('/events 상단 바 CTA — fontSize 13.5px + 높이 44px 이상', async ({ page }) => {
    await login(page);
    await page.goto('/events');
    const cta = page.locator('.md\\:hidden').getByRole('link', { name: '새 행사' });
    await expect(cta).toBeVisible();
    const metrics = await cta.evaluate((el) => ({
      fontSize: getComputedStyle(el).fontSize,
      height: el.getBoundingClientRect().height,
    }));
    expect(metrics.fontSize).toBe('13.5px');
    expect(metrics.height).toBeGreaterThanOrEqual(44);
  });

  test('/accounts 상단 바 CTA — fontSize 13.5px + 높이 44px 이상', async ({ page }) => {
    await login(page);
    await page.goto('/accounts');
    const cta = page.locator('.md\\:hidden').getByRole('link', { name: '계정 추가' });
    await expect(cta).toBeVisible();
    const metrics = await cta.evaluate((el) => ({
      fontSize: getComputedStyle(el).fontSize,
      height: el.getBoundingClientRect().height,
    }));
    expect(metrics.fontSize).toBe('13.5px');
    expect(metrics.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('REQ-0046 모바일 — /landing 375px 가로 오버플로 (확증 공백 7 보완)', () => {
  // ⚠️ 이 테스트는 앱 코드(src) 결함을 그대로 드러내기 위한 것으로, 통과가 아니라 FAIL이
  // 예상된다(Tester는 src를 수정하지 않는다 — 구현 결함 보고만). 근거: 375×812 모바일 수동
  // 캡처 세트에서 landing.png만 432px 폭으로 저장됐다(나머지 5장은 정확히 375px) — `sips
  // -g pixelWidth`로 확인. LandingClient.tsx의 h1(`안녕하세요, {displayNameOf(username)}님`)이
  // 이메일 원문을 래핑 클래스(break-words 등) 없이 display 크기로 렌더해, 로컬파트가 긴
  // 이메일(SYSTEM_ADMIN 계정은 `dev-verify`로 짧아 안 걸림 — EVENT_ADMIN 계정의
  // `req0018-06-tester-event-admin`이 분해 불가 토큰이 되어 375px를 넘긴다.
  test('EVENT_ADMIN 계정(긴 이메일)으로 로그인한 랜딩 h1이 375px 뷰포트를 가로로 넘치지 않는다', async ({
    page,
  }) => {
    await page.goto('/landing');
    await page.locator('input[name="username"]').fill('req0018-06-tester-event-admin@morymaker.local');
    await page.locator('input[name="password"]').fill('TesterPassw0rd1!');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/landing');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(
      overflow.scrollWidth,
      `문서 scrollWidth(${overflow.scrollWidth})가 뷰포트 폭(${overflow.innerWidth})을 넘으면 안 됨 — h1 이메일 래핑 부재로 가로 오버플로 발생`,
    ).toBeLessThanOrEqual(overflow.innerWidth);
  });
});

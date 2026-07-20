import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * 콘솔 6파일(행사 폼·계정 폼·자리 QR·콘솔 셸·계정 목록·행사 목록)에 남아있던 raw
 * `border-black/10`·`ring-black/5`를 금선 토큰(`border-line`/`border-line-soft`·
 * `ring-line`/`ring-line-soft`)으로 치환한 회귀 가드다.
 *
 * className 문자열 치환만이라 스냅샷 비교보다 **토큰이 실제로 의도한 라이트 골드 값으로
 * resolve되는지**가 핵심 검증 지점이다 — Tailwind 유틸리티가 존재하지 않는 클래스명이면
 * 빌드는 통과하지만 브라우저에서는 아무 스타일도 적용되지 않아(border-color: 초기값)
 * 육안으로만은 놓치기 쉽다. 라이트 스코프 콘솔의 `--line`(rgba(138, 106, 30, .45))·
 * `--line-soft`(rgba(138, 106, 30, .22))가 `getComputedStyle`로 정확히 잡히는지 직접
 * 단언한다(검정이나 투명으로 남으면 치환 누락·오타 신호).
 *
 * 데이터: 기존 콘솔 회귀 테스트가 공유하는 로컬 개발 전용 이벤트
 * e757ba35-c62e-471a-99da-6f301abc3660와 그 산하 주차 구획
 * 1f652d52-bda8-47f9-8127-fcb90e4455a8(자리 3개)를 재사용한다 — 이 스펙은 읽기 전용
 * 조회·토글만 수행하고 어떤 데이터도 생성·수정·삭제하지 않는다.
 */

const EID = 'e757ba35-c62e-471a-99da-6f301abc3660';
const ZID = '1f652d52-bda8-47f9-8127-fcb90e4455a8';

const LINE = 'rgba(138, 106, 30, 0.45)';
const LINE_SOFT = 'rgba(138, 106, 30, 0.22)';

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `test-screenshots/console-hairline/${name}.png`, fullPage: true });
}

async function login(page: Page) {
  await page.goto('/events');
  await page.locator('input[name="username"]').fill('dev-verify@morymaker.local');
  await page.locator('input[name="password"]').fill('DevPassw0rd!');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/events');
}

async function assertNoBlackHairlineNoGlow(page: Page) {
  const metrics = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const blackBorder = all.filter((el) => {
      const s = getComputedStyle(el);
      return /rgb\(0,\s*0,\s*0/.test(s.borderColor) && s.borderWidth !== '0px';
    }).length;
    const glowy = all.filter((el) => {
      const s = getComputedStyle(el);
      return (s.boxShadow !== 'none' && /blur/.test(s.boxShadow)) || s.filter.includes('blur');
    }).length;
    return { blackBorder, glowy };
  });
  expect(metrics.blackBorder, '검정(rgb(0,0,0)) 헤어라인 잔존 — 토큰 치환 누락 신호').toBe(0);
  expect(metrics.glowy, '발광(blur) 요소 0건이어야 함(콘솔은 발광 예산 밖)').toBe(0);
}

test.describe('콘솔 헤어라인 토큰 치환 — border-black/ring-black → 금선 토큰 resolve 회귀', () => {
  test('[TC-HL-01] EventList·AccountList 카드 ring-line-soft가 라이트 골드로 resolve', async ({ page }) => {
    await login(page);

    const eventCard = page.locator('li').first();
    await expect(eventCard).toBeVisible();
    const eventBoxShadow = await eventCard.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(eventBoxShadow, 'EventList 카드 ring-line-soft').toContain(LINE_SOFT);
    await assertNoBlackHairlineNoGlow(page);
    await shot(page, 'TC-HL-01-event-list');

    await page.goto('/accounts');
    const accountCard = page.locator('li').first();
    await expect(accountCard).toBeVisible();
    const accountBoxShadow = await accountCard.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(accountBoxShadow, 'AccountList 카드 ring-line-soft').toContain(LINE_SOFT);
    await assertNoBlackHairlineNoGlow(page);
    await shot(page, 'TC-HL-01-account-list');
  });

  test('[TC-HL-02] EventForm — 폼 입력 border-line + 외곽 프레임 ring-line-soft resolve', async ({ page }) => {
    await login(page);
    await page.goto('/events/new');

    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveCSS('border-color', LINE);

    const dateInput = page.locator('input[name="eventDate"]');
    await expect(dateInput).toHaveCSS('border-color', LINE);

    const form = page.locator('form').first();
    const formBoxShadow = await form.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(formBoxShadow, 'EventForm 외곽 프레임 ring-line-soft').toContain(LINE_SOFT);

    await assertNoBlackHairlineNoGlow(page);
    await shot(page, 'TC-HL-02-event-form');
  });

  test('[TC-HL-03] AccountForm — 폼 입력 border-line + 외곽 프레임 ring-line-soft resolve', async ({ page }) => {
    await login(page);
    await page.goto('/accounts/new');

    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveCSS('border-color', LINE);

    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toHaveCSS('border-color', LINE);

    const form = page.locator('form').first();
    const formBoxShadow = await form.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(formBoxShadow, 'AccountForm 외곽 프레임 ring-line-soft').toContain(LINE_SOFT);

    await assertNoBlackHairlineNoGlow(page);
    await shot(page, 'TC-HL-03-account-form');
  });

  test('[TC-HL-04] SlotQrGrid — 토글 버튼 border-line(판단 지점) + 카드 border-line-soft + 섹션 ring-line-soft resolve', async ({
    page,
  }) => {
    await login(page);
    await page.goto(`/events/${EID}/parking/${ZID}`);

    const toggleBtn = page.getByRole('button', { name: 'QR 미리보기 열기' });
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn, 'SlotQrGrid 토글 버튼 border-line — 콘솔 내 직접 선례 없는 유일한 판단 지점').toHaveCSS(
      'border-color',
      LINE,
    );
    await shot(page, 'TC-HL-04-slotqrgrid-closed');

    await toggleBtn.click();
    await expect(page.getByRole('button', { name: 'QR 미리보기 닫기' })).toBeVisible();

    const section = page.locator('section', { has: page.getByRole('heading', { name: '자리 QR' }) });
    const sectionBoxShadow = await section.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(sectionBoxShadow, 'SlotQrGrid section 외곽 프레임 ring-line-soft').toContain(LINE_SOFT);

    const previewCard = section.locator('.grid > div').first();
    await expect(previewCard, 'SlotQrGrid 자리별 미리보기 카드 border-line-soft').toHaveCSS('border-color', LINE_SOFT);

    await assertNoBlackHairlineNoGlow(page);
    await shot(page, 'TC-HL-04-slotqrgrid-opened');
  });

  test('[TC-HL-05] EventConsoleShell — 사이드바·헤더 구획 divider border-line-soft resolve (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    // EventConsoleShell은 /events(목록)가 아니라 eid 컨텍스트 하위 페이지에서만 렌더된다
    // (/events/[eid]/layout.tsx 전용 — 소스 주석: /accounts는 시스템 레벨이라 셸 밖).
    await page.goto(`/events/${EID}/roster`);

    const aside = page.locator('aside');
    await expect(aside).toBeVisible();
    await expect(aside, '사이드바 우측 divider border-line-soft').toHaveCSS('border-right-color', LINE_SOFT);

    const header = page.locator('header').first();
    await expect(header, '헤더 하단 divider border-line-soft').toHaveCSS('border-bottom-color', LINE_SOFT);

    await assertNoBlackHairlineNoGlow(page);
    await shot(page, 'TC-HL-05-shell-desktop');
  });

  test('[TC-HL-06] EventConsoleShell — 하단 탭바 divider border-line-soft resolve + 오버플로 0 (mobile 375×812)', async ({
    page,
  }) => {
    await login(page);
    await page.goto(`/events/${EID}/roster`);
    await page.setViewportSize({ width: 375, height: 812 });

    const bottomNav = page.getByRole('navigation', { name: '주요 메뉴' });
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav, '하단 탭바 상단 divider border-line-soft').toHaveCSS('border-top-color', LINE_SOFT);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(
      overflow.scrollWidth,
      `모바일 가로 오버플로 — scrollWidth(${overflow.scrollWidth})가 clientWidth(${overflow.clientWidth})를 넘으면 안 됨`,
    ).toBeLessThanOrEqual(overflow.clientWidth);

    await assertNoBlackHairlineNoGlow(page);
    await shot(page, 'TC-HL-06-shell-mobile');
  });
});

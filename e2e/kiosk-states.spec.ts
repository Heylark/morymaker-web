import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * 키오스크 다크 시그니처 회귀 — KIO-00~06 전 상태를 실제 데이터로 순회하며 DOM 가시성 +
 * 다크 테마 고정을 확인하고 스크린샷을 남긴다(CP-3 visual sanity 게이트 1차 입력).
 *
 * 시각 정합(발광 예산·색상 값 일치)은 본 spec의 판정 범위가 아니다 — 스크린샷을
 * `docs/plans/2026-07-12_design-system/ui-kit/scenes/kiosk-states.html` 목표와 대조하는 것은
 * Manager DEV-SANITY 게이트(TASK_LOG 결정 로그 "커밋까지 완주" grant) 몫이다. 여기서는 상태
 * 전이가 실제 API 응답으로 정확히 일어나는지 + 다크 테마가 이탈 없이 유지되는지만 검증한다.
 *
 * 데이터: 로컬 개발 DB(`morymaker` 스키마) 이벤트 85f20822-7a48-4163-afa1-d0a71568df05
 * ("REQ-0007-02 테스트 행사")에 Tester가 직접 시드한 좌석·주차 레코드를 사용한다(운영 데이터
 * 아님, 로컬 전용 — TASK_LOG "테스트 환경 lifecycle" 참조). 이 이벤트가 없으면 spec 전체가
 * 스킵 대신 실패로 드러난다(무음 실패 방지 — 조용히 넘어가지 않고 원인이 바로 보이게 한다).
 */

const EID = '85f20822-7a48-4163-afa1-d0a71568df05';
const GUEST_ONE_NAME = '테스트손님'; // searchState=ONE, 좌석 A구역 12번 + 주차 지하 2층 A구역 12 시드
const GUEST_MANY_QUERY = '부하'; // searchState=MANY
const PLATE_TAIL = '3456'; // parking_record 시드 plate 12가3456의 뒷자리

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `test-screenshots/REQ-0022-04/${name}.png`, fullPage: true });
}

async function assertDark(page: Page) {
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
}

test.describe('키오스크 다크 시그니처 — KIO-00~06 상태 순회', () => {
  test('KIO-00 대기 → KIO-01 메뉴 → KIO-02 이름검색 → KIO-03 본인확인 → KIO-04 좌석안내', async ({ page }) => {
    await page.goto(`/kiosk/${EID}`);
    await assertDark(page);

    // KIO-00 대기 — 워드마크 렌더 + 발광 0(정적 텍스트, filter 없음) 확인
    const idleButton = page.getByRole('button', { name: /터치하세요/ });
    await expect(idleButton).toBeVisible();
    await expect(page.getByText('화면을 터치하세요')).toBeVisible();
    await shot(page, 'KIO-00-idle');

    // KIO-01 메뉴 — 두 버튼 동등 outline(둘 다 role=button, border만)
    await idleButton.click();
    const nameSearchBtn = page.getByRole('button', { name: /참가자/ });
    const plateSearchBtn = page.getByRole('button', { name: /주차/ });
    await expect(nameSearchBtn).toBeVisible();
    await expect(plateSearchBtn).toBeVisible();
    await expect(nameSearchBtn).toHaveCSS('border-style', 'solid');
    await shot(page, 'KIO-01-menu');

    // KIO-02 이름검색 — MANY 상태 먼저 확인(뱃지 "다건") 후 ONE 검색으로 전이 준비
    await nameSearchBtn.click();
    const nameInput = page.getByPlaceholder('이름');
    await expect(nameInput).toBeVisible();
    await nameInput.fill(GUEST_MANY_QUERY);
    await expect(page.getByText(/다건 ·/)).toBeVisible();
    await shot(page, 'KIO-02-search-many');

    await nameInput.fill('');
    await nameInput.fill(GUEST_ONE_NAME);
    const resultButton = page.getByRole('button', { name: new RegExp(GUEST_ONE_NAME) });
    await expect(resultButton).toBeVisible();
    await shot(page, 'KIO-02-search-one');

    // KIO-03 본인확인 — gold CTA(맞아요) + ghost(아니에요)
    await resultButton.click();
    const confirmBtn = page.getByRole('button', { name: '맞아요' });
    const rejectBtn = page.getByRole('button', { name: '아니에요' });
    await expect(confirmBtn).toBeVisible();
    await expect(rejectBtn).toBeVisible();
    await expect(page.getByText(GUEST_ONE_NAME)).toBeVisible();
    await shot(page, 'KIO-03-identity-confirm');

    // KIO-04 좌석안내 — 체크인 응답의 실제 좌석번호 렌더 확인(시드값 "A구역 12번")
    await confirmBtn.click();
    await expect(page.getByText('A구역 12번')).toBeVisible();
    await expect(page.getByText(/주차 지하 2층 A구역 12/)).toBeVisible();
    await shot(page, 'KIO-04-seat-guide');
  });

  test('KIO-01 메뉴 → KIO-05 주차확인 → KIO-06 주차위치안내', async ({ page }) => {
    await page.goto(`/kiosk/${EID}`);
    await assertDark(page);

    await page.getByRole('button', { name: /터치하세요/ }).click();
    await page.getByRole('button', { name: /주차/ }).click();

    // KIO-05 주차확인 — 온스크린 키패드로 뒷자리 4자리 입력 후 조회
    for (const digit of PLATE_TAIL) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }
    await expect(page.locator('p[aria-live="polite"]')).toHaveText('3456');
    await page.getByRole('button', { name: '조회' }).click();

    const plateResult = page.getByRole('button', { name: /12가3456/ });
    await expect(plateResult).toBeVisible();
    await shot(page, 'KIO-05-plate-search');

    // KIO-06 주차위치안내 — 시드 주차기록의 실제 slotDisplay 렌더 확인
    await plateResult.click();
    await expect(page.getByText('지하 2층 A구역 12번')).toBeVisible();
    await shot(page, 'KIO-06-park-location');
  });

  test('반응형 최소 확인 — 375×812(모바일 뷰포트)에서도 다크 테마·레이아웃 붕괴 없음', async ({ page }) => {
    // 키오스크는 고정 설치형 터치스크린(16:9.4 랜드스케이프, kiosk-states.html 기준)이라
    // 모바일 폭이 실배포 타깃은 아니다 — 그러나 UI 변경 감지 시 최소 2개 뷰포트 확인 원칙(test.md
    // Step 7-2)에 따라 좁은 뷰포트에서도 다크 고정·가로 스크롤(레이아웃 붕괴) 없음만 회귀 확인한다.
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/kiosk/${EID}`);
    await assertDark(page);
    await expect(page.getByRole('button', { name: /터치하세요/ })).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    await page.getByRole('button', { name: /터치하세요/ }).click();
    await expect(page.getByRole('button', { name: /참가자/ })).toBeVisible();
    await shot(page, 'KIO-01-menu-mobile-375');
  });
});

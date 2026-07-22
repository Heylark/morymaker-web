import { test, expect, BASE_PATH } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * 콘솔 명단·초대(ADM-05·12) 실용 톤 회귀 — 실 로그인(OIDC 폼) → 명단·초대 화면을 순회하며
 * 라이트 테마 고정·발광 0·헤어라인(border-line-soft, 검정 헤어라인 0) + 핵심 상호작용(개별 등록
 * →발송 게이트→발송, 템플릿 저장→gid 미리보기)이 실제로 동작하는지 확인하고 스크린샷을 남긴다
 * (CP-3 visual sanity 게이트 1차 입력). ADM-01·02도 함께 순회해 먼저 만든 콘솔 기반(IA) 화면과의
 * 라이트 wrapper 정합(콘솔 전체 일관)을 재확인한다.
 *
 * 데이터: 로컬 개발 DB 이벤트 e757ba35-c62e-471a-99da-6f301abc3660("REQ-0007-04 CP-3 visual
 * sanity 확인용")에 Tester가 개별 등록으로 시드한 게스트 1명("테스트게스트")을 사용한다(운영
 * 데이터 아님, 로컬 전용 — TASK_LOG "테스트 환경 lifecycle" 참조).
 */

const EID = 'e757ba35-c62e-471a-99da-6f301abc3660';

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `test-screenshots/REQ-0018-02/${name}.png`, fullPage: true });
}

async function login(page: Page) {
  await page.goto('/events');
  // 미인증 → auth(/login)로 리다이렉트됨
  await page.locator('input[name="username"]').fill('dev-verify@morymaker.local');
  await page.locator('input[name="password"]').fill('DevPassw0rd!');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/events');
}

async function assertLightNoGlowNoBlackBorder(page: Page) {
  const wrapper = page.locator('[data-theme="light"]').first();
  await expect(wrapper).toBeVisible();
  const metrics = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const glowy = all.filter((el) => {
      const s = getComputedStyle(el);
      return (s.boxShadow !== 'none' && /blur/.test(s.boxShadow)) || s.filter.includes('blur');
    }).length;
    const blackBorder = all.filter((el) => {
      const s = getComputedStyle(el);
      return /rgb\(0,\s*0,\s*0/.test(s.borderColor) && s.borderWidth !== '0px';
    }).length;
    const lw = document.querySelector('[data-theme="light"]');
    return { glowy, blackBorder, bg: lw ? getComputedStyle(lw).backgroundColor : null };
  });
  expect(metrics.glowy, '발광(blur) 요소 0건이어야 함').toBe(0);
  expect(metrics.blackBorder, '검정(rgb(0,0,0)) 헤어라인 0건이어야 함').toBe(0);
  expect(metrics.bg, '라이트 wrapper 배경이 라이트 토큰 값이어야 함').toBe('rgb(247, 245, 239)');
}

test.describe('콘솔 명단·초대 — 실용 톤(라이트) 회귀', () => {
  test('ADM-01 목록 · ADM-02 수정 — 콘솔 기반 화면 라이트 정합 재확인', async ({ page }) => {
    await login(page);
    await assertLightNoGlowNoBlackBorder(page);
    await shot(page, 'ADM-01-events-list');

    await page.goto(`/events/${EID}/edit`);
    await assertLightNoGlowNoBlackBorder(page);
    await expect(page.getByRole('button', { name: '수정' })).toBeVisible();
    await shot(page, 'ADM-02-events-edit');
  });

  test('ADM-05 명단 관리 — 개별 등록·발송 게이트·발송 이력', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/roster`);
    await assertLightNoGlowNoBlackBorder(page);

    // 명단 도달성(nav 배선) — 사이드바 "명단" 링크가 실제로 이 라우트를 가리키는지
    // <Link>가 렌더하는 실제 DOM href는 basePath가 자동 접두된 외부 좌표계 값이다.
    await expect(page.getByRole('link', { name: '명단', exact: true })).toHaveAttribute(
      'href',
      `${BASE_PATH}/events/${EID}/roster`,
    );

    await shot(page, 'ADM-05-roster-initial');

    // 이미 발송 완료 상태(Tester 시드 — see 결정 로그)라면 발송 대상 0명, 아니면 최소 1명 이상
    await expect(page.locator('span', { hasText: /^이미 발송 \d+명$/ })).toBeVisible();
    await shot(page, 'ADM-05-roster-send-gate');

    // 반응형 뷰포트 — mobile(375x812)에서도 라이트·발광 0·헤어라인 유지되는지
    await page.setViewportSize({ width: 375, height: 812 });
    await assertLightNoGlowNoBlackBorder(page);
    await shot(page, 'ADM-05-roster-mobile');
  });

  test('ADM-12 초대 문자 템플릿 — TokenPalette·gid 치환 미리보기', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/roster/template`);
    await assertLightNoGlowNoBlackBorder(page);

    const body = page.locator('textarea');
    await expect(body).toHaveValue(/\[\$참석자\]/);
    await expect(body).toHaveValue(/\[\$QR링크\]/);
    await shot(page, 'ADM-12-template-editor');

    // index:1 고정 선택은 이 이벤트에 시드된 게스트가 정확히 1명일 때만 유효하다 — 로컬 dev DB는
    // 다른 e2e 스펙(좌석 배정 등)이 남긴 게스트가 누적될 수 있어 이름으로 옵션을 특정한다(무공유
    // 상태 가정 회피). value는 gid이지 이름이 아니므로(사실 H) 옵션에서 value를 읽어와 선택.
    const select = page.locator('select').last();
    const targetOption = select.locator('option', { hasText: '테스트게스트' });
    const targetValue = await targetOption.getAttribute('value');
    await select.selectOption(targetValue!);
    // 서버 렌더 그대로 표시 — gid 치환(이름매칭 아님)이 실제로 일어나는지
    await expect(page.getByText('테스트게스트', { exact: false }).last()).toBeVisible();
    await shot(page, 'ADM-12-template-preview-rendered');
  });

  /**
   * 편집 폼 미채움 회귀 재검증 — 이전에는 GuestEditModal이 마운트 시점 `defaultValues` 1회만
   * 반영해 편집 대상이 바뀌어도 폼이 갱신되지 않았다(빈 폼으로 열리는 버그). 앞선 회귀 스위트가
   * 개별 등록(신규)만 커버해 이 갭이 유출됐으므로, 이번엔 편집(existing guest) 경로를 실 서버
   * 응답으로 직접 검증한다: ① 편집 오픈 시 현재 값 채움 ② 필드 하나만 바꿔 저장해도 나머지
   * 필드는 서버 null-merge로 보존되는지 ③ 개별 등록(신규)으로 전환하면 직전 편집 상태가
   * 새어나오지 않고 빈 폼으로 열리는지.
   */
  test('ADM-05 편집 흐름 — 폼 재동기화 + 단일 필드 보존 + 신규 등록 빈 폼 (편집 폼 미채움 회귀 봉합)', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/roster`);
    await assertLightNoGlowNoBlackBorder(page);

    const row = page.locator('tr', { hasText: '테스트게스트' });
    const form = page.locator('form');
    const inputs = form.locator('input');
    const readForm = async () => ({
      name: await inputs.nth(0).inputValue(),
      org: await inputs.nth(1).inputValue(),
      phone: await inputs.nth(3).inputValue(),
      plate: await inputs.nth(4).inputValue(),
    });

    // ① 기존 게스트 [수정] → 폼이 현재 값으로 채워짐(되돌림 전엔 input 5개 전부 빈 문자열이었음)
    // REQ-0046 정합화: ConsoleModal(U3 공용 래퍼)이 <h2> 제목을 카드 자신이 소유하고
    // children(이 폼)은 그 아래 형제로 렌더한다 — h2가 더 이상 <form> 내부 자손이 아니라
    // form.getByRole('heading', ...)가 영구 미매칭된다. dialog 스코프로 교체한다.
    await row.getByRole('button', { name: '수정' }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: '참석자 수정' })).toBeVisible();
    const orig = await readForm();
    expect(orig.name, '편집 오픈 시 이름이 빈 값이면 편집 폼 미채움 회귀').not.toBe('');
    expect(orig.phone, '편집 오픈 시 연락처가 빈 값이면 편집 폼 미채움 회귀').not.toBe('');
    await shot(page, 'ADM-05-guest-edit-filled');

    // ② 소속(org) 1개 필드만 변경 후 저장 → 이름·연락처·차량번호는 서버 null-merge로 보존
    const marker = `${orig.org}-e2e검증`;
    await inputs.nth(1).fill(marker);
    await form.getByRole('button', { name: '수정' }).click();
    await expect(row.locator('td').nth(1)).toContainText(marker);
    await expect(row.locator('td').nth(0)).toHaveText(orig.name);
    await expect(row.locator('td').nth(2)).toHaveText(orig.phone || '-');
    await expect(row.locator('td').nth(3)).toHaveText(orig.plate || '-');

    // 시드 데이터 원복 — 반복 실행 시 드리프트 방지(로컬 개발 DB 공용 시드, TASK_LOG 결정 로그 참조)
    await row.getByRole('button', { name: '수정' }).click();
    await inputs.nth(1).fill(orig.org);
    await form.getByRole('button', { name: '수정' }).click();
    await expect(row.locator('td').nth(1)).toContainText(orig.org);

    // ③ "개별 등록"(신규) → 빈 폼(직전 편집 상태가 새어나오지 않는지)
    await page.getByRole('button', { name: '개별 등록' }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: '개별 등록' })).toBeVisible();
    for (let i = 0; i < 5; i++) {
      await expect(inputs.nth(i)).toHaveValue('');
    }
    await form.getByRole('button', { name: '취소' }).click();
  });

  /**
   * 편집 모달 포커스 트랩 순환 회귀 — 되돌림 반영(적대적 검토 확증 결함) 봉합. `use-overlay-
   * focus-trap.ts`의 FOCUSABLE_SELECTOR가 폼 컨트롤(input)을 열거하지 않으면, Tab 순환 경계
   * (first/last)가 버튼 2개(취소·수정)로만 계산돼 입력 필드 5개가 순환에서 배제된다 — 키보드
   * 사용자가 버튼에서 다시 입력 필드로 돌아갈 수 없다(WCAG 2.1.1/2.4.3). 마지막 버튼→Tab→첫
   * 요소(이름 input), 첫 요소→Shift+Tab→마지막 버튼(수정) 순환을 직접 단언한다.
   */
  test('ADM-05 편집 모달 포커스 트랩 — Tab 순환이 입력 필드를 포함한다 (되돌림 반영)', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/roster`);
    await assertLightNoGlowNoBlackBorder(page);

    const row = page.locator('tr', { hasText: '테스트게스트' });
    await row.getByRole('button', { name: '수정' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: '참석자 수정' })).toBeVisible();

    const form = page.locator('form');
    const firstInput = form.locator('input').first();
    const saveButton = form.getByRole('button', { name: '수정' });

    // 마지막 focusable(저장 버튼)에서 Tab → 첫 focusable(이름 input)로 감겨야 한다.
    await saveButton.focus();
    await page.keyboard.press('Tab');
    await expect(firstInput).toBeFocused();

    // 첫 focusable(이름 input)에서 Shift+Tab → 마지막 focusable(저장 버튼)로 감겨야 한다.
    await page.keyboard.press('Shift+Tab');
    await expect(saveButton).toBeFocused();

    await form.getByRole('button', { name: '취소' }).click();
  });
});

import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * 콘솔 버튼 위계(ConsoleButton) + 파일선택 버튼화(FileSelectButton) 회귀 — 명단 화면
 * (RosterClient 진입 트리거·엑셀 업로드·발송 게이트)에서 이전에 E2E 커버 0건이던 클릭 흐름을
 * 신설한다. secondary(신규 3단계 위계)의 시각 affordance(테두리·발광 0)·파일선택 클릭
 * 유도·폭 유틸(w-fit) 보존·키보드 포커스 가시성(focus-within)을 실 로그인·실 서버 왕복으로
 * 검증한다(CP-3 visual sanity 게이트 1차 입력). 파괴적 실 쓰기(임포트 확정·SMS 발송)는 로컬
 * 공유 개발 데이터를 변형하므로 `page.route`로 응답을 모의해 payload·클릭 도달만 실측하고
 * 실 DB는 건드리지 않는다(console-branding-design.spec.ts 저장 경로 모의 선례와 동형).
 *
 * 데이터: 명단·발송 스펙과 동일한 로컬 개발 DB 이벤트 e757ba35-...(로컬 E2E 검증용, 운영
 * 데이터 아님).
 */

const EID = 'e757ba35-c62e-471a-99da-6f301abc3660';

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `test-screenshots/REQ-0055/${name}.png`, fullPage: true });
}

async function login(page: Page) {
  await page.goto('/events');
  await page.locator('input[name="username"]').fill('dev-verify@morymaker.local');
  await page.locator('input[name="password"]').fill('DevPassw0rd!');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/events');
}

/** ConsoleButton variant별 계산 스타일 채취 — 값 자체를 하드코딩 단언하지 않고(토큰 값 변경에
 * 취약) "채움 유무·테두리 유무·발광 유무"라는 위계 구분 신호만 확인한다. */
async function readButtonVisual(page: Page, locator: ReturnType<Page['getByRole']>) {
  return locator.evaluate((el) => {
    const s = getComputedStyle(el as HTMLElement);
    return {
      backgroundColor: s.backgroundColor,
      borderWidth: s.borderWidth,
      borderColor: s.borderColor,
      boxShadow: s.boxShadow,
      width: (el as HTMLElement).offsetWidth,
    };
  });
}

function isTransparent(color: string) {
  return color === 'rgba(0, 0, 0, 0)' || color === 'transparent';
}

test.describe('콘솔 버튼 위계 + 파일선택 버튼화 — 명단·발송 화면', () => {
  test('RosterClient 진입 트리거 — secondary 버튼 렌더(테두리·발광 0) + 모달 개폐 (V6, V9)', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/roster`);

    const uploadBtn = page.getByRole('button', { name: '엑셀 명단 업로드' });
    const sendBtn = page.getByRole('button', { name: '초대 문자 발송' });
    await expect(uploadBtn).toBeVisible();
    await expect(sendBtn).toBeVisible();
    await shot(page, '01-roster-triggers-secondary');

    // secondary = 테두리형(투명 배경 + 골드 헤어라인) + 발광 0(boxShadow 'none') — primary(솔리드
    // 채움)·ghost(테두리 0)와 시각적으로 구분되는 신호만 확인한다.
    for (const btn of [uploadBtn, sendBtn]) {
      const visual = await readButtonVisual(page, btn);
      expect(parseFloat(visual.borderWidth), 'secondary는 테두리(border-line)를 가져야 함').toBeGreaterThan(0);
      expect(isTransparent(visual.backgroundColor), 'secondary 배경은 투명(솔리드 채움 아님)이어야 함').toBe(true);
      expect(visual.boxShadow, '콘솔 발광 예산 0 — secondary에 그림자 없어야 함').toBe('none');
    }

    // 엑셀 업로드 모달 개폐
    await uploadBtn.click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: '엑셀 명단 업로드' })).toBeVisible();
    await shot(page, '02-excel-upload-modal-open');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: '엑셀 명단 업로드' })).toHaveCount(0);

    // 발송 게이트 모달 개폐
    await sendBtn.click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: '초대 문자 발송' })).toBeVisible();
    await shot(page, '03-send-gate-modal-open');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: '초대 문자 발송' })).toHaveCount(0);
  });

  test('엑셀 업로드 흐름 — FileSelectButton 클릭 유도 + 파일 선택 + 프리뷰 + 확정 (V1~V9-A)', async ({ page }) => {
    await login(page);

    // 임포트 확정은 실 명단을 변형하므로 미리보기·확정 응답을 모의한다(파괴적 실 쓰기 회피).
    await page.route(`**/api/proxy/api/events/${EID}/guests/import/preview`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { newCount: 1, updatedCount: 0, excludedCount: 0, invalidRows: [] } }),
      });
    });
    await page.route(`**/api/proxy/api/events/${EID}/guests/import`, async (route) => {
      if (route.request().url().includes('/import/preview')) return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { newCount: 1, updatedCount: 0, cancelledCount: 0 } }),
      });
    });

    await page.goto(`/events/${EID}/roster`);
    await page.getByRole('button', { name: '엑셀 명단 업로드' }).click();
    const modal = page.getByRole('dialog').filter({ hasText: '엑셀 명단 업로드' });
    await expect(modal.getByRole('heading', { name: '엑셀 명단 업로드' })).toBeVisible();

    // [템플릿 받기] — secondary + 폭 유틸(w-fit) 보존: flex-col 직접자식이라 카드 전체 폭까지
    // 늘어나면 안 된다(v2 확증 결함 1 — V9-A).
    const templateBtn = modal.getByRole('button', { name: '템플릿 받기' });
    await expect(templateBtn).toBeVisible();
    const cardWidth = await modal.evaluate((el) => (el as HTMLElement).clientWidth);
    const templateVisual = await readButtonVisual(page, templateBtn);
    expect(
      templateVisual.width,
      'w-fit 미보존 시 flex-col stretch로 카드 전체 폭까지 늘어남(V9-A RED 조건)',
    ).toBeLessThan(cardWidth * 0.6);

    // FileSelectButton — 브라우저 기본 "파일 선택/선택된 파일 없음" 텍스트가 아니라 버튼
    // affordance(라벨) + 별도 파일명 표시로 대체됐는지(V5).
    await expect(modal.getByText('선택된 파일 없음')).toBeVisible();
    const fileTrigger = modal.getByLabel('파일 선택');
    await expect(fileTrigger).toBeVisible();
    await shot(page, '04-excel-modal-initial');

    // V5-A(v2 신설) — 키보드 포커스 시 감싼 label에 가시 아웃라인(focus-within)이 그려지는지.
    // sr-only input은 clip이라 브라우저 기본 포커스 링만으론 불가시 — label 자체의 outline을 본다.
    await fileTrigger.focus();
    const focusVisual = await fileTrigger.evaluate((el) => {
      const label = (el as HTMLElement).closest('label')!;
      const s = getComputedStyle(label);
      return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth };
    });
    expect(focusVisual.outlineStyle, 'FileSelectButton 포커스 시 label에 outline 없으면 WCAG 2.4.7 회귀(V5-A RED)').not.toBe(
      'none',
    );
    expect(parseFloat(focusVisual.outlineWidth), 'outline-width가 0이면 사실상 불가시(V5-A RED)').toBeGreaterThan(0);

    // 파일 선택 → 파일명 표시(V5) + 프리뷰 자동 실행.
    await fileTrigger.setInputFiles({
      name: 'guests.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('mock xlsx payload — preview/confirm은 위 route로 응답 모의됨'),
    });
    await expect(modal.getByText('guests.xlsx')).toBeVisible();
    await expect(modal.getByText('신규 1건 · 수정 0건 · 제외 0건')).toBeVisible();
    await shot(page, '05-excel-modal-preview');

    // [확정](primary, 시각 무변경) / [다시 선택](ghost) — 위계 구분 확인.
    const confirmBtn = modal.getByRole('button', { name: '확정' });
    const resetBtn = modal.getByRole('button', { name: '다시 선택' });
    await expect(confirmBtn).toBeVisible();
    await expect(resetBtn).toBeVisible();
    const confirmVisual = await readButtonVisual(page, confirmBtn);
    expect(isTransparent(confirmVisual.backgroundColor), 'primary는 솔리드 채움이어야 함').toBe(false);
    const resetVisual = await readButtonVisual(page, resetBtn);
    expect(parseFloat(resetVisual.borderWidth), 'ghost는 테두리가 없어야 함').toBe(0);
    expect(isTransparent(resetVisual.backgroundColor), 'ghost는 배경이 없어야 함').toBe(true);

    // [다시 선택] → FileSelectButton의 inputRef→네이티브 input 포워딩(ExcelUpload의
    // fileInputRef.current.value='' 리셋이 의존하는 경로)을 직접 확인한다. ref 배선이
    // 끊기면 fileInputRef.current가 null이라 handleReset의 리셋 가드가 조용히 no-op되고
    // 네이티브 input value가 fakepath로 잔존한다 — 그 상태를 값으로 직접 단언(브라우저별
    // "동일 파일 재선택 change 미발화" dedup 유무에 기대지 않는 결정적 신호).
    await resetBtn.click();
    await expect(modal.getByText('선택된 파일 없음')).toBeVisible();
    const resetInputValue = await fileTrigger.evaluate((el) => (el as HTMLInputElement).value);
    expect(
      resetInputValue,
      '다시 선택 클릭 후 네이티브 input.value가 초기화돼야 함(inputRef 미포워딩 시 fakepath 잔존)',
    ).toBe('');

    // 동일 파일 재선택 — 리셋된 입력에 같은 파일을 다시 골라도 프리뷰가 재실행돼야 한다
    // (ExcelUpload 주석의 설계 전제: "재선택 시 프리뷰가 자동 재실행된다").
    await fileTrigger.setInputFiles({
      name: 'guests.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('mock xlsx payload — preview/confirm은 위 route로 응답 모의됨'),
    });
    await expect(modal.getByText('guests.xlsx')).toBeVisible();
    await expect(modal.getByText('신규 1건 · 수정 0건 · 제외 0건')).toBeVisible();
    await shot(page, '05b-excel-modal-reselect-same-file');

    // 확정 → onConfirmSuccess가 모달을 닫는다(캐시 무효화는 기존 mutation onSuccess 책임 — 무접촉).
    await confirmBtn.click();
    await expect(page.getByRole('heading', { name: '엑셀 명단 업로드' })).toHaveCount(0);
  });

  test('발송 게이트 흐름 — 게이트 표시 → primary [발송](폭 유틸 보존) → 확인 → 발송 (V9-A)', async ({ page }) => {
    await login(page);

    await page.route(`**/api/proxy/api/events/${EID}/sms/send/gate`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { candidates: 1, blocked: [], alreadySent: 0, canSend: true, appliedTemplate: '안녕하세요 [$참석자]님' },
        }),
      });
    });
    await page.route(`**/api/proxy/api/events/${EID}/sms/send`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { sent: 1, failed: 0 } }),
      });
    });

    await page.goto(`/events/${EID}/roster`);
    await page.getByRole('button', { name: '초대 문자 발송' }).click();
    const modal = page.getByRole('dialog').filter({ hasText: '초대 문자 발송' });
    await expect(modal.getByText('발송 대상 1명')).toBeVisible();
    await shot(page, '06-send-gate-modal-loaded');

    // [발송] — primary(솔리드 채움) + 폭 유틸(w-fit) 보존: flex-col 직접자식(V9-A).
    const sendBtn = modal.getByRole('button', { name: '발송', exact: true });
    await expect(sendBtn).toBeVisible();
    await expect(sendBtn).toBeEnabled();
    const cardWidth = await modal.evaluate((el) => (el as HTMLElement).clientWidth);
    const sendVisual = await readButtonVisual(page, sendBtn);
    expect(isTransparent(sendVisual.backgroundColor), 'primary는 솔리드 채움이어야 함').toBe(false);
    expect(
      sendVisual.width,
      'w-fit 미보존 시 flex-col stretch로 카드 전체 폭까지 늘어남(V9-A RED 조건)',
    ).toBeLessThan(cardWidth * 0.6);

    await sendBtn.click();
    // ConfirmDialog(shared/Button 소유 — 범위 외 무접촉)가 SendGateModal 위에 겹쳐 뜬다. 제목
    // 텍스트가 모달과 동일해 dialog가 2개 스택 — 마지막(확인 다이얼로그)만 스코프.
    const confirmDialog = page.getByRole('dialog').last();
    await expect(confirmDialog.getByText('1명에게 초대 문자를 발송할까요?')).toBeVisible();
    await shot(page, '07-send-confirm-dialog');

    await confirmDialog.getByRole('button', { name: '발송', exact: true }).click();
    await expect(modal.getByText('발송 완료 — 성공 1건 · 실패 0건')).toBeVisible();
    await shot(page, '08-send-success');
  });

  test('미디어 등록 흐름(IdleContentManager) — primary/ghost 위계 + FileSelectButton 클릭 유도 (화면당 primary 1개, V5/V9)', async ({
    page,
  }) => {
    await login(page);
    await page.goto(`/events/${EID}/branding`);
    await expect(page.getByRole('heading', { name: '대기화면 콘텐츠' })).toBeVisible();

    // 기저 화면 — [콘텐츠 등록] 1개만 primary(솔리드 채움 + 발광 0). 화면당 primary 예산 준수(V9).
    const registerBtn = page.getByRole('button', { name: '콘텐츠 등록' });
    await expect(registerBtn).toBeVisible();
    const registerVisual = await readButtonVisual(page, registerBtn);
    expect(isTransparent(registerVisual.backgroundColor), '[콘텐츠 등록]은 primary(솔리드 채움)여야 함').toBe(false);
    expect(registerVisual.boxShadow, '콘솔 발광 예산 0').toBe('none');
    await shot(page, '11-branding-idle-list');

    await registerBtn.click();
    const modal = page.getByRole('dialog').filter({ hasText: '대기화면 콘텐츠 등록' });
    await expect(modal.getByRole('heading', { name: '대기화면 콘텐츠 등록' })).toBeVisible();

    // FileSelectButton — 파일 (필수) 접근성 이름 보존(적대적 검토 반영분 회귀 확인, ariaLabel prop)
    // + secondary affordance.
    const fileTrigger = modal.getByLabel('파일 (필수)');
    await expect(fileTrigger).toBeVisible();
    await expect(modal.getByText('선택된 파일 없음')).toBeVisible();
    const fileVisual = await fileTrigger.evaluate((el) => {
      const label = (el as HTMLElement).closest('label')!;
      const s = getComputedStyle(label);
      return { borderWidth: s.borderWidth, backgroundColor: s.backgroundColor };
    });
    expect(parseFloat(fileVisual.borderWidth), 'FileSelectButton 트리거는 secondary 테두리를 가져야 함').toBeGreaterThan(0);
    expect(isTransparent(fileVisual.backgroundColor), 'FileSelectButton 트리거 배경은 투명이어야 함').toBe(true);

    // [취소](ghost) — 등록 모달의 유일한 primary는 [등록](저장) 1개.
    const cancelBtn = modal.getByRole('button', { name: '취소' });
    const submitBtn = modal.getByRole('button', { name: '등록', exact: true });
    const cancelVisual = await readButtonVisual(page, cancelBtn);
    expect(parseFloat(cancelVisual.borderWidth), '[취소]는 ghost — 테두리 없음').toBe(0);
    expect(isTransparent(cancelVisual.backgroundColor), '[취소]는 ghost — 배경 없음').toBe(true);
    await expect(submitBtn).toBeVisible();
    await shot(page, '12-branding-idle-register-modal');

    await cancelBtn.click();
    await expect(page.getByRole('heading', { name: '대기화면 콘텐츠 등록' })).toHaveCount(0);
  });

  test('모바일(375px) — 명단 화면 트리거·엑셀 모달 레이아웃 회귀 없음', async ({ page }) => {
    await login(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/events/${EID}/roster`);

    await expect(page.getByRole('button', { name: '엑셀 명단 업로드' })).toBeVisible();
    await expect(page.getByRole('button', { name: '초대 문자 발송' })).toBeVisible();
    await shot(page, '09-roster-mobile');

    await page.getByRole('button', { name: '엑셀 명단 업로드' }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: '엑셀 명단 업로드' })).toBeVisible();
    await shot(page, '10-excel-modal-mobile');
  });
});

import { test, expect, BASE_PATH } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * 콘솔 브랜딩·대기화면(ADM-04) 신규 도메인 검증 — 요소별 4컬러 피커·자족 프리뷰 실시간 반영·
 * null 왕복 보존·미저장 배지·PUT branding kv 클로버 방지(네트워크 레벨)·
 * 대기화면 등록/수정 분기(update payload name·kind 제외)가 실 로그인(OIDC)·실 서버로
 * 동작하는지 확인한다(cutover 직전 visual sanity 게이트 1차 입력).
 *
 * 데이터: 좌석/명단 스펙과 동일한 로컬 개발 DB 이벤트 e757ba35-...(로컬 E2E 검증용 행사, 운영
 * 데이터 아님). 브랜딩 컬러는 이 행사에 이미 bgColor=#123456·pointColor=#abcdef가 지정돼 있고
 * titleColor·bodyColor는 null(미지정)이다 — null 왕복 케이스를 실데이터로 검증할 수 있다.
 *
 * ⚠️ 파괴적 저장 회피: 브랜딩 실 PUT·대기화면 실 POST/PUT은 공유 개발 데이터를 변형하고
 * (대기화면은 DELETE 엔드포인트가 없어 정리 불가), 컬러 저장은 행사 색을 실제로 바꾼다. 따라서
 * "저장" 경로가 걸린 검증(kv 클로버·update payload)은 page.route로 응답을 모의해 payload만
 * 실측하고 실 DB는 건드리지 않는다(seats 스펙 "데이터 손실 봉인" 선례 동형). 실 렌더가 필요한
 * 검증(초기 렌더·피커·프리뷰·null 왕복·배지)은 저장을 누르지 않아 부작용이 없다.
 */

const EID = 'e757ba35-c62e-471a-99da-6f301abc3660';
const RUN = Date.now();

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
    return { glowy, blackBorder };
  });
  expect(metrics.glowy, '발광(blur) 요소 0건이어야 함').toBe(0);
  expect(metrics.blackBorder, '검정(rgb(0,0,0)) 헤어라인 0건이어야 함').toBe(0);
}

/** ElementColorPicker 한 요소의 컨트롤 행(피커 input + 현재값/미지정 표기 + 되돌리기 버튼). */
function pickerRow(page: Page, label: string) {
  return page.getByLabel(label).locator('..');
}

test.describe('콘솔 브랜딩·대기화면(ADM-04) — 컬러·프리뷰·null 왕복·kv 클로버·대기화면', () => {
  test('진입 + 초기 렌더(라이트·발광 0·NAV·heading)', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/branding`);
    await assertLightNoGlowNoBlackBorder(page);

    await expect(page.getByRole('link', { name: '브랜딩', exact: true }).first()).toHaveAttribute(
      'href',
      // <Link>가 렌더하는 실제 DOM href는 basePath가 자동 접두된 외부 좌표계 값이다(Next.js가
      // Link 컴포넌트를 basePath 인지 <a> 태그로 해석 — JS 없이도 앵커만으로 항해 가능해야 하므로).
      `${BASE_PATH}/events/${EID}/branding`,
    );
    await expect(page.getByRole('heading', { name: '브랜딩 · 대기화면' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '행사 브랜딩 컬러' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '대기화면 콘텐츠' })).toBeVisible();
    await shot(page, 'ADM-04-branding-initial');
  });

  test('컬러 피커 4종 + 프리뷰 실시간 반영(bgColor 변경 → 프리뷰 배경 즉시 갱신)', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/branding`);

    for (const label of ['배경색', '포인트색', '제목색', '본문색']) {
      await expect(pickerRow(page, label)).toBeVisible();
    }

    // 프리뷰 패널은 "행사 제목 미리보기"를 담은 div이고 배경이 인라인 style로 bgColor를 반영한다.
    const previewPanel = page
      .locator('div')
      .filter({ has: page.getByText('행사 제목 미리보기', { exact: true }) })
      .last();
    // 실데이터 bgColor=#123456 → rgb(18, 52, 86)
    await expect(previewPanel).toHaveCSS('background-color', 'rgb(18, 52, 86)');
    await shot(page, 'ADM-04-preview-initial-real-colors');

    // bgColor 피커를 빨강으로 변경 → 프리뷰 배경이 즉시 rgb(255,0,0)로 반영(watch 라이브 리렌더)
    await page.getByLabel('배경색').fill('#ff0000');
    await expect(previewPanel).toHaveCSS('background-color', 'rgb(255, 0, 0)');
    await shot(page, 'ADM-04-preview-live-updated');
  });

  test('null 왕복 보존 + 미저장 배지 — 미변경 null은 되돌리기 버튼 없음', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/branding`);

    // titleColor는 실데이터 null → "미지정" 표기 + 되돌리기 버튼 없음(아직 값이 없으므로).
    const titleRow = pickerRow(page, '제목색');
    await expect(titleRow.getByText('미지정', { exact: true })).toBeVisible();
    await expect(titleRow.getByRole('button', { name: '미지정으로 되돌리기' })).toHaveCount(0);

    // 초기엔 미저장 배지 없음.
    await expect(page.getByText('저장되지 않은 변경')).toHaveCount(0);

    // 제목색을 지정 → 배지 등장 + 되돌리기 버튼 등장.
    await page.getByLabel('제목색').fill('#00ff00');
    await expect(page.getByText('저장되지 않은 변경')).toBeVisible();
    await expect(titleRow.getByRole('button', { name: '미지정으로 되돌리기' })).toBeVisible();
    await shot(page, 'ADM-04-null-assigned-badge-shown');

    // "미지정으로 되돌리기" → 다시 null 표기로 복귀(왕복 보존).
    await titleRow.getByRole('button', { name: '미지정으로 되돌리기' }).click();
    await expect(titleRow.getByText('미지정', { exact: true })).toBeVisible();
    await expect(titleRow.getByRole('button', { name: '미지정으로 되돌리기' })).toHaveCount(0);
  });

  /**
   * KV 클로버 방지 — 최우선 검증. 네트워크 레벨.
   * 편집 UI가 없는 kv·defaultIdleMode를 응답에 실어 폼에 로드시키고(모의 GET), 색만 바꿔 저장할 때
   * PUT branding payload가 두 필드를 현재값 그대로 되돌려 담는지 실측한다 — 부분 전송이면 PUT
   * full-replace 의미에서 kv가 조용히 지워진다. 실 DB는 건드리지 않는다(PUT 응답도 모의).
   */
  test('kv 클로버 방지 — 색만 바꿔 저장해도 PUT payload가 kv·defaultIdleMode를 라운드트립한다', async ({
    page,
  }) => {
    await login(page);

    const SENTINEL_KV = `KV센티넬-${RUN}`;
    const mockEvent = {
      id: EID,
      name: 'KV클로버검증행사',
      eventDate: null,
      place: null,
      type: null,
      status: '준비',
      active: false,
      bgColor: '#123456',
      pointColor: '#abcdef',
      titleColor: null,
      bodyColor: null,
      kv: SENTINEL_KV,
      defaultIdleMode: 'branded',
      smsPolicy: null,
    };

    // 단건 이벤트 GET만 가로챈다(목록 /events·하위 /branding·/idle-contents는 경로가 달라 미매칭).
    await page.route(`**/api/proxy/api/events/${EID}`, async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: mockEvent }) });
    });

    let capturedPut: Record<string, unknown> | null = null;
    await page.route(`**/api/proxy/api/events/${EID}/branding`, async (route) => {
      capturedPut = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { ...mockEvent, ...(capturedPut as object) } }),
      });
    });

    await page.goto(`/events/${EID}/branding`);
    await expect(page.getByRole('heading', { name: '행사 브랜딩 컬러' })).toBeVisible();

    // 색 하나만 변경(bgColor) → isDirty → 저장.
    await page.getByLabel('배경색').fill('#010203');
    await expect(page.getByText('저장되지 않은 변경')).toBeVisible();
    await page.getByRole('button', { name: '저장', exact: true }).click();

    await expect
      .poll(() => capturedPut, { message: 'PUT branding 요청이 가로채져야 함' })
      .not.toBeNull();
    await page.unroute(`**/api/proxy/api/events/${EID}/branding`);
    await page.unroute(`**/api/proxy/api/events/${EID}`);

    const put = capturedPut!;
    expect(put.bgColor, '변경한 색은 반영돼야 함').toBe('#010203');
    expect(put.kv, 'kv가 라운드트립돼야 함(부분 전송으로 지워지면 클로버)').toBe(SENTINEL_KV);
    expect(put.defaultIdleMode, 'defaultIdleMode도 라운드트립돼야 함').toBe('branded');
    // 편집 안 한 나머지 색은 원본 유지(titleColor·bodyColor는 null 그대로).
    expect(put.titleColor, '미변경 null은 null 그대로 전송').toBeNull();
    expect(put.bodyColor).toBeNull();
    await shot(page, 'ADM-04-kv-clobber-guard-saved');
  });

  /**
   * 대기화면 등록/수정 분기 — 삭제 어포던스 0 + update payload가 name·kind를 제외하는지.
   * 목록/생성/수정 응답을 모의해(공유 DB에 orphan idle_content를 남기지 않음) UI 분기와 payload를
   * 실측한다.
   */
  test('대기화면 — 삭제 버튼 0 + 등록(name·kind 편집) + 수정(name·kind 읽기전용, payload 제외)', async ({
    page,
  }) => {
    await login(page);

    const item = {
      id: 'idle-e2e-1',
      name: '입장 안내',
      kind: '이미지',
      mode: 'branded',
      play: '자동재생',
      fileUrl: null,
      sortOrder: 1,
    };
    let capturedPost: Record<string, unknown> | null = null;
    let capturedUpdate: Record<string, unknown> | null = null;

    await page.route(`**/api/proxy/api/events/${EID}/idle-contents`, async (route) => {
      const m = route.request().method();
      if (m === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [item] }) });
        return;
      }
      if (m === 'POST') {
        capturedPost = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ data: { ...item, id: 'idle-e2e-new', ...(capturedPost as object) } }),
        });
        return;
      }
      await route.continue();
    });

    await page.route(`**/api/proxy/api/events/${EID}/idle-contents/*`, async (route) => {
      if (route.request().method() === 'PUT') {
        capturedUpdate = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { ...item, ...(capturedUpdate as object) } }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto(`/events/${EID}/branding`);
    await expect(page.getByRole('heading', { name: '대기화면 콘텐츠' })).toBeVisible();

    // 삭제 없음 안내 + 삭제 버튼 자체가 렌더되지 않음.
    await expect(page.getByText('콘텐츠 삭제는 현재 지원되지 않습니다.')).toBeVisible();
    await expect(page.getByRole('button', { name: '삭제' })).toHaveCount(0);
    await expect(page.getByText('입장 안내', { exact: true })).toBeVisible();
    await shot(page, 'ADM-04-idle-list-no-delete');

    // 등록 모달 — name·kind가 편집 가능(input/select).
    await page.getByRole('button', { name: '콘텐츠 등록' }).click();
    await expect(page.getByRole('heading', { name: '대기화면 콘텐츠 등록' })).toBeVisible();
    await expect(page.getByLabel('이름 (필수)')).toBeVisible();
    await page.getByLabel('이름 (필수)').fill(`E2E등록-${RUN}`);
    await page.getByLabel('재생 옵션 (선택)').fill('자동재생');
    await shot(page, 'ADM-04-idle-create-modal');
    await page.getByRole('button', { name: '등록', exact: true }).click();

    await expect.poll(() => capturedPost, { message: 'POST 요청 가로채짐' }).not.toBeNull();
    expect((capturedPost as Record<string, unknown>).name, '등록은 name 포함').toBe(`E2E등록-${RUN}`);
    expect((capturedPost as Record<string, unknown>).kind, '등록은 kind 포함').toBe('이미지');

    // 수정 모달 — name·kind는 읽기전용 텍스트(편집 input 없음).
    await page.getByRole('button', { name: '수정', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: '대기화면 콘텐츠 수정' })).toBeVisible();
    await expect(page.getByLabel('이름 (필수)'), '수정 모달엔 이름 편집 input이 없어야 함').toHaveCount(0);
    // 정렬 순서만 바꿔 저장.
    await page.getByLabel('정렬 순서').fill('9');
    await shot(page, 'ADM-04-idle-edit-modal-readonly-name');
    await page.getByRole('button', { name: '수정', exact: true }).last().click();

    await expect.poll(() => capturedUpdate, { message: 'PUT 요청 가로채짐' }).not.toBeNull();
    const upd = capturedUpdate as Record<string, unknown>;
    expect(upd, 'update payload에 name 없음(불변 필드 미러)').not.toHaveProperty('name');
    expect(upd, 'update payload에 kind 없음').not.toHaveProperty('kind');
    expect(upd.sortOrder).toBe(9);
    expect(Object.keys(upd).sort()).toEqual(['mode', 'play', 'sortOrder']);

    await page.unroute(`**/api/proxy/api/events/${EID}/idle-contents/*`);
    await page.unroute(`**/api/proxy/api/events/${EID}/idle-contents`);
  });
});

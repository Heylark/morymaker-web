import { test, expect, BASE_PATH } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * 콘솔 브랜딩·대기화면(ADM-04) 신규 도메인 검증 — 요소별 2컬러(배경·포인트) 피커·자족 프리뷰
 * 실시간 반영·null 왕복 보존·미저장 배지·PUT branding kv 클로버 방지(네트워크 레벨)·
 * 대기화면 등록/수정/삭제 분기(update payload name·kind 제외, delete 확인 다이얼로그 흐름)가
 * 실 로그인(OIDC)·실 서버로 동작하는지 확인한다(cutover 직전 visual sanity 게이트 1차 입력).
 * titleColor·bodyColor는 공개 뷰가 소비하지 않아(REQ-0031 인계) 편집 UI를 걷어냈다 — 폼이
 * 두 필드를 여전히 라운드트립하는지는 kv 클로버 검증에서 함께 확인한다.
 *
 * 데이터: 좌석/명단 스펙과 동일한 로컬 개발 DB 이벤트 e757ba35-...(로컬 E2E 검증용 행사, 운영
 * 데이터 아님). 브랜딩 컬러는 이 행사에 이미 bgColor=#123456·pointColor=#abcdef가 지정돼 있어
 * null 왕복 케이스는 GET 응답을 모의해 검증한다(실데이터가 둘 다 non-null이라 실데이터만으로는
 * null 왕복을 재현할 수 없다).
 *
 * ⚠️ 파괴적 저장 회피: 브랜딩 실 PUT·대기화면 실 POST/PUT/DELETE는 공유 개발 데이터를 변형한다
 * (컬러 저장은 행사 색을 실제로 바꾸고, 삭제는 되돌릴 수 없다). 따라서 "저장"·"삭제" 경로가
 * 걸린 검증(kv 클로버·update payload·delete 호출)은 page.route로 응답을 모의해 payload·호출
 * 여부만 실측하고 실 DB는 건드리지 않는다(seats 스펙 "데이터 손실 봉인" 선례 동형). 실 렌더가
 * 필요한 검증(초기 렌더·피커·프리뷰·null 왕복·배지)은 저장을 누르지 않아 부작용이 없다.
 */

const EID = 'e757ba35-c62e-471a-99da-6f301abc3660';
const RUN = Date.now();

// 1×1 투명 PNG(유효한 magic byte) — 클라 kind 파생·서버 실 업로드 라운드트립 양쪽에 재사용.
// 파일시스템 의존 없이 버퍼로 직접 주입해 워크트리 경로에 종속되지 않는다.
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const TINY_PNG_BUFFER = Buffer.from(TINY_PNG_BASE64, 'base64');

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

  test('컬러 피커 2종 + 프리뷰 실시간 반영(bgColor 변경 → 프리뷰 배경 즉시 갱신)', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/branding`);

    for (const label of ['배경색', '포인트색']) {
      await expect(pickerRow(page, label)).toBeVisible();
    }
    // titleColor·bodyColor는 공개 뷰 미소비라 편집 UI가 없다(REQ-0031 인계).
    for (const label of ['제목색', '본문색']) {
      await expect(page.getByLabel(label)).toHaveCount(0);
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

    // 실데이터는 bgColor·pointColor가 둘 다 값이 있어(#123456·#abcdef) null 왕복을 재현할 수
    // 없다 — GET만 모의해 pointColor를 null로 만든다(이 테스트는 저장을 누르지 않으므로 PUT은
    // 모의하지 않아도 됨 — 부작용 없음, 파일 상단 주석과 동일 전제).
    const mockEvent = {
      id: EID,
      name: '2026 신년회',
      eventDate: null,
      place: null,
      type: null,
      status: '준비',
      active: false,
      bgColor: '#123456',
      pointColor: null,
      titleColor: null,
      bodyColor: null,
      kv: null,
      defaultIdleMode: null,
      smsPolicy: null,
    };
    await page.route(`**/api/proxy/api/events/${EID}`, async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: mockEvent }) });
    });

    await page.goto(`/events/${EID}/branding`);
    await expect(page.getByRole('heading', { name: '행사 브랜딩 컬러' })).toBeVisible();

    // pointColor는 모의 응답에서 null → "미지정" 표기 + 되돌리기 버튼 없음(아직 값이 없으므로).
    const pointRow = pickerRow(page, '포인트색');
    await expect(pointRow.getByText('미지정', { exact: true })).toBeVisible();
    await expect(pointRow.getByRole('button', { name: '미지정으로 되돌리기' })).toHaveCount(0);

    // 초기엔 미저장 배지 없음.
    await expect(page.getByText('저장되지 않은 변경')).toHaveCount(0);

    // 포인트색을 지정 → 배지 등장 + 되돌리기 버튼 등장.
    await page.getByLabel('포인트색').fill('#00ff00');
    await expect(page.getByText('저장되지 않은 변경')).toBeVisible();
    await expect(pointRow.getByRole('button', { name: '미지정으로 되돌리기' })).toBeVisible();
    await shot(page, 'ADM-04-null-assigned-badge-shown');

    // "미지정으로 되돌리기" → 다시 null 표기로 복귀(왕복 보존).
    await pointRow.getByRole('button', { name: '미지정으로 되돌리기' }).click();
    await expect(pointRow.getByText('미지정', { exact: true })).toBeVisible();
    await expect(pointRow.getByRole('button', { name: '미지정으로 되돌리기' })).toHaveCount(0);

    await page.unroute(`**/api/proxy/api/events/${EID}`);
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
    // 편집 UI가 없는 titleColor·bodyColor도 원본값 그대로 라운드트립된다(폼 state는 유지하고
    // Controller JSX만 걷어낸 설계 — 편집 UI 부재가 곧 페이로드 누락으로 이어지지 않아야 함).
    expect(
      { titleColor: put.titleColor, bodyColor: put.bodyColor },
      '편집 UI 없는 색도 원본값 그대로 라운드트립돼야 함',
    ).toEqual({ titleColor: null, bodyColor: null });
    await shot(page, 'ADM-04-kv-clobber-guard-saved');
  });

  /**
   * 대기화면 삭제(확인 다이얼로그 → DELETE 호출) + 수정 — update payload가 name·kind를
   * 제외하는지. 목록/수정/삭제 응답을 모의해(공유 DB에 orphan idle_content를 남기거나 실 콘텐츠를
   * 지우지 않음) UI 분기와 payload·호출 여부를 실측한다. (등록에 파일 업로드가 필수가 되면서
   * 전송 방식이 FormData/multipart로 바뀌었다 — `route.request().postDataJSON()`은 JSON 바디
   * 전제라 multipart를 파싱 못 하므로 등록 검증은 별도 테스트(파일 사전검증·실 업로드)로
   * 분리했다.)
   */
  test('대기화면 — 삭제 확인 다이얼로그(취소·확인) → DELETE 호출 + 수정(name·kind 읽기전용, payload 제외)', async ({
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
    let capturedUpdate: Record<string, unknown> | null = null;
    const deletedCids: string[] = [];

    await page.route(`**/api/proxy/api/events/${EID}/idle-contents`, async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [item] }) });
    });

    await page.route(`**/api/proxy/api/events/${EID}/idle-contents/*`, async (route) => {
      const method = route.request().method();
      if (method === 'PUT') {
        capturedUpdate = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { ...item, ...(capturedUpdate as object) } }),
        });
        return;
      }
      if (method === 'DELETE') {
        deletedCids.push(route.request().url().split('/').pop() ?? '');
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { cid: item.id } }) });
        return;
      }
      await route.continue();
    });

    await page.goto(`/events/${EID}/branding`);
    await expect(page.getByRole('heading', { name: '대기화면 콘텐츠' })).toBeVisible();

    // "삭제 미지원" 안내 문구는 더는 렌더되지 않고, 삭제 버튼이 목록 행에 노출된다(PATTERN-051 완결).
    await expect(page.getByText('콘텐츠 삭제는 현재 지원되지 않습니다.')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '삭제', exact: true })).toBeVisible();
    await expect(page.getByText('입장 안내', { exact: true })).toBeVisible();
    await shot(page, 'ADM-04-idle-list-delete-button');

    // 삭제 클릭 → 확인 다이얼로그 노출 → 취소는 DELETE를 호출하지 않는다.
    await page.getByRole('button', { name: '삭제', exact: true }).click();
    await expect(page.getByRole('heading', { name: '대기화면 콘텐츠 삭제' })).toBeVisible();
    await expect(page.getByText('"입장 안내" 콘텐츠를 삭제하면 되돌릴 수 없습니다. 계속할까요?')).toBeVisible();
    await page.getByRole('button', { name: '취소', exact: true }).click();
    await expect(page.getByRole('heading', { name: '대기화면 콘텐츠 삭제' })).toHaveCount(0);
    expect(deletedCids, '취소 시 DELETE가 호출되지 않아야 함').toHaveLength(0);
    await shot(page, 'ADM-04-idle-delete-confirm-dialog');

    // 다시 삭제 → 확인 → DELETE 호출. 리스트의 "삭제"(연 버튼)와 다이얼로그의 확인 "삭제" 버튼이
    // 동시에 DOM에 존재 — 수정 모달과 동일하게 마지막(다이얼로그) 것만 클릭한다.
    await page.getByRole('button', { name: '삭제', exact: true }).click();
    await page.getByRole('button', { name: '삭제', exact: true }).last().click();
    await expect.poll(() => deletedCids.length, { message: 'DELETE 요청이 가로채져야 함' }).toBe(1);
    expect(deletedCids[0], 'DELETE 경로가 삭제 대상 cid로 조립돼야 함').toBe(item.id);
    await expect(page.getByRole('heading', { name: '대기화면 콘텐츠 삭제' })).toHaveCount(0);

    // 수정 모달 — name·kind는 읽기전용 텍스트(편집 input 없음, 파일 input도 없음).
    await page.getByRole('button', { name: '수정', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: '대기화면 콘텐츠 수정' })).toBeVisible();
    await expect(page.getByLabel('이름 (필수)'), '수정 모달엔 이름 편집 input이 없어야 함').toHaveCount(0);
    await expect(page.getByLabel('파일 (필수)'), '수정 모달엔 파일 input이 없어야 함').toHaveCount(0);
    // 정렬 순서만 바꿔 저장.
    await page.getByLabel('정렬 순서').fill('9');
    await shot(page, 'ADM-04-idle-edit-modal-readonly-name');
    // 리스트의 "수정"(열기) 버튼과 모달 제출 "수정" 버튼이 동시에 DOM에 존재 — 마지막(모달) 것만 클릭.
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

  /**
   * 대기화면 등록 — 클라이언트 사전검증 순수 UI 상태 확인. 네트워크 응답은 목록 GET만
   * 모의(빈 목록)하고 POST는 발생시키지 않는다(제출 자체를 누르지 않음 — 사전검증 단계만 대상).
   */
  test('대기화면 등록 — 파일 미선택 시 제출 비활성화 + 미허용 MIME 에러 + 크기초과 에러 + 파일 선택 시 kind 자동파생', async ({
    page,
  }) => {
    await login(page);

    await page.route(`**/api/proxy/api/events/${EID}/idle-contents`, async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });

    await page.goto(`/events/${EID}/branding`);
    await page.getByRole('button', { name: '콘텐츠 등록' }).click();
    await expect(page.getByRole('heading', { name: '대기화면 콘텐츠 등록' })).toBeVisible();

    const submitBtn = page.getByRole('button', { name: '등록', exact: true });
    const fileInput = page.getByLabel('파일 (필수)');

    // 파일 미선택 — 제출 버튼 비활성화(클라이언트 사전검증 게이트).
    await expect(submitBtn).toBeDisabled();
    await expect(page.getByText('파일을 선택하면 표시됩니다')).toBeVisible();

    // 미허용 MIME(text/plain) — 클라 사전검증 에러 문구 + kind 미표시 + 제출 비활성 유지.
    await fileInput.setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a media file') });
    await expect(page.getByText('지원하지 않는 파일 형식입니다 (이미지: PNG·JPEG·WEBP / 영상: MP4·WEBM).')).toBeVisible();
    await expect(submitBtn).toBeDisabled();
    await shot(page, 'ADM-04-idle-create-mime-rejected');

    // 이미지 20MB 초과 — 크기 사전검증 에러 문구(선언 MIME은 허용값 유지, 크기만 위반).
    await fileInput.setInputFiles({
      name: 'huge.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(21 * 1024 * 1024),
    });
    await expect(page.getByText('파일 크기가 너무 큽니다 (이미지 최대 20MB 이하).')).toBeVisible();
    await expect(submitBtn).toBeDisabled();
    await shot(page, 'ADM-04-idle-create-size-rejected');

    // 유효한 이미지 — kind 자동 파생 표시 + 미리보기 렌더 + 제출 활성화.
    await fileInput.setInputFiles({ name: 'valid.png', mimeType: 'image/png', buffer: TINY_PNG_BUFFER });
    await expect(page.getByText('이미지', { exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: '선택한 파일 미리보기' })).toBeVisible();
    await expect(submitBtn).toBeEnabled();
    await shot(page, 'ADM-04-idle-create-valid-kind-derived');
  });

  /**
   * 대기화면 등록 — 실 업로드 왕복(콘솔 업로드 → 실 저장 → 키오스크 재생 완료 기준 핵심). multipart 전송이라
   * postDataJSON()으로 필드를 가로챌 수 없어 이 테스트는 목(mock) 없이 실제 api까지 왕복시키고,
   * 응답 JSON(kind 자동파생·fileUrl 절대 URL)을 실측한 뒤 **같은 fileUrl을 키오스크 대기화면이
   * 실제로 로드하는지까지** 확인한다 — "콘솔 업로드 → 실 저장 → KIO-00 재생" 왕복 전체가 이
   * 테스트 하나로 완결된다(사용자 증상 해소 증명, DEV-SANITY 핵심). DELETE 엔드포인트가 생겼지만
   * 이 테스트는 정리를 호출하지 않는다 — multipart 실 업로드 검증 자체가 목적이라 삭제 흐름은
   * 위 삭제 테스트가 이미 모의 왕복으로 커버한다(로컬 E2E 검증용 행사 e757ba35 — 운영 데이터
   * 아님, console-branding-design 파일 상단 주석과 동일 전제).
   */
  test('대기화면 등록 — 실 파일 업로드 → 201 실측 → 키오스크 실 렌더 왕복 완결', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/branding`);
    await expect(page.getByRole('heading', { name: '대기화면 콘텐츠' })).toBeVisible();

    await page.getByRole('button', { name: '콘텐츠 등록' }).click();
    await page.getByLabel('이름 (필수)').fill(`E2E실업로드-${RUN}`);
    await page.getByLabel('파일 (필수)').setInputFiles({ name: 'e2e-upload.png', mimeType: 'image/png', buffer: TINY_PNG_BUFFER });
    await expect(page.getByText('이미지', { exact: true })).toBeVisible();
    // 이 행사엔 이전 테스트 라운드에서 남은 콘텐츠가 누적돼 있다(이 테스트는 DELETE로 정리하지
    // 않는다 — 위 JSDoc 참조. 고정 음수(-1000 등)는 과거 라운드가 그보다 더 낮은 값을 썼을 경우
    // 밀려날 수 있다는 게 실측으로 확인됨). IdlePlayer는 sortOrder 오름차순 목록의 첫 항목만 렌더하므로(다건 순환
    // 없음, 범위 밖) 초 단위 타임스탬프의 음수로 매 실행마다 이전 누적 데이터보다 낮은 값을
    // 만든다 — ⚠️ `-Date.now()`(ms, 13자리)는 서버 `sortOrder: Int`(Int32, 약 ±21억)를 오버플로해
    // 400을 유발함을 실측 확인(2026-07-18) — 초 단위(~17억, Int32 안전 범위)로 교정.
    await page.getByLabel('정렬 순서').fill(String(-Math.floor(Date.now() / 1000)));

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes(`/api/proxy/api/events/${EID}/idle-contents`) && res.request().method() === 'POST',
      ),
      page.getByRole('button', { name: '등록', exact: true }).click(),
    ]);

    expect(response.status(), '실 업로드는 201로 저장돼야 함(magic byte 검증 통과)').toBe(201);
    const body = (await response.json()) as { data: Record<string, unknown> };
    expect(body.data.name).toBe(`E2E실업로드-${RUN}`);
    expect(body.data.kind, 'kind는 File.type에서 자동 파생됨').toBe('이미지');
    // 포트는 로컬 api 기동 설정에 의존(고정값 아님) — 요구되는 건 "api 오리진 절대
    // URL" 형태이지 특정 포트가 아니다.
    expect(body.data.fileUrl, 'fileUrl은 api 오리진 절대 URL이어야 함').toMatch(
      /^https?:\/\/localhost:\d+\/api\/public\/events\/.+\/idle-contents\/.+\/file$/,
    );

    await expect(page.getByText(`E2E실업로드-${RUN}`)).toBeVisible();
    await shot(page, 'ADM-04-idle-create-real-upload-success');

    // ── 왕복 완결: 같은 fileUrl을 키오스크 대기화면이 실제로 로드 ──────────────────
    const fileUrl = body.data.fileUrl as string;
    await page.goto(`/kiosk/${EID}`);
    const img = page.locator(`img[src="${fileUrl}"]`);
    await expect(img).toBeVisible();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth), {
      message: '실 저장된 파일이 실제 픽셀로 디코드돼야 함(onError 폴백으로 새지 않았는지)',
    }).toBeGreaterThan(0);
    await shot(page, 'KIO-00-real-upload-round-trip-rendered');
  });
});

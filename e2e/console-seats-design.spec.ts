import { test, expect, type Page } from '@playwright/test';

/**
 * 콘솔 좌석 구성(ADM-06) 신규 도메인 회귀 — 그룹 CRUD(지정석/자유석)·배정 편집(ON/OFF 두 모드)·
 * 409 SEAT_CONFLICT 인라인 처리·numbering 토글 이중 invalidate가 실 로그인(OIDC)·실 서버·실
 * DB로 동작하는지 확인한다(CP-3 visual sanity 게이트 1차 입력). ADM-07 주차 화면은 스타일
 * 정합만(기능 무변경)이므로 별도 스모크로 회귀만 재확인한다.
 *
 * 데이터: console-roster-design.spec.ts와 동일한 로컬 개발 DB 이벤트
 * e757ba35-c62e-471a-99da-6f301abc3660(로컬 좌석 구성 E2E 검증용 행사, 운영 데이터 아님)를
 * 사용한다. 좌석 그룹은 이 스펙이 생성·삭제한다(RUN 접미사로 재실행 간
 * 충돌 회피).
 *
 * ⚠️ 게스트는 -02의 고정 시드("테스트게스트")와 달리 **매 실행마다 새 타임스탬프로 생성**되므로
 * -02 선례(영구 보존)를 그대로 따르면 안 된다 — 실측 결과 console-roster-design.spec.ts의
 * ADM-12 테스트가 게스트 select의 `index: 1`(두 번째 옵션 = "테스트게스트")을 하드코딩 가정하는데,
 * 여기서 생성한 게스트가 남아있으면(select가 최신순 정렬) index 1이 다른 게스트로 밀려나 그
 * 테스트가 깨진다(실증 — 정리 없이 전체 스위트 병행 실행 시 재현). 그래서 이 스펙은 사용한
 * 게스트를 마지막 테스트에서 "제외"(연성 삭제, cancelGuest) 처리해 로스터를 원복한다.
 */

const EID = 'e757ba35-c62e-471a-99da-6f301abc3660';
const RUN = Date.now();
const GUEST_A = `좌석E2E참석자A-${RUN}`;
const GUEST_B = `좌석E2E참석자B-${RUN}`;

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

async function ensureGuest(page: Page, name: string) {
  // 로스터 목록은 TanStack Query 비동기 조회다 — goto 직후 즉시 count()를 확인하면 데이터 로드
  // 완료 전 "없음"으로 오판해 중복 등록을 유발한다(테스트 함정, 실제로 재현되어 중복 생성 확인).
  // 실 GET 응답을 기다린 뒤에만 존재 여부를 판정한다.
  const rosterLoaded = page.waitForResponse(
    (res) => /\/guests(\?|$)/.test(new URL(res.url()).pathname + new URL(res.url()).search) && res.request().method() === 'GET',
  );
  await page.goto(`/events/${EID}/roster`);
  await rosterLoaded;
  const already = page.getByText(name, { exact: true });
  if (await already.count()) return;
  await page.getByRole('button', { name: '개별 등록' }).click();
  await page.locator('form input').first().fill(name);
  await page.getByRole('button', { name: '등록', exact: true }).click();
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
}

async function createSeatGroup(page: Page, label: string, numbering: boolean) {
  await page.goto(`/events/${EID}/seats`);
  await page.getByRole('button', { name: '그룹 추가' }).click();
  await page.locator('form input[type="text"], form input:not([type])').first().fill(label);
  if (numbering) await page.locator('form input[type="checkbox"]').check();
  await page.getByRole('button', { name: '추가', exact: true }).click();
  await expect(page.getByText(label, { exact: true })).toBeVisible();
}

async function deleteSeatGroup(page: Page, label: string) {
  const row = page.locator('li', { hasText: label });
  await row.getByRole('button', { name: '삭제' }).click();
  await page.getByRole('button', { name: '삭제', exact: true }).last().click();
  await expect(page.getByText(label, { exact: true })).toBeHidden();
}

test.describe.configure({ mode: 'serial' });

test.describe('콘솔 좌석 구성(ADM-06) — 그룹 CRUD·배정·409·toggle', () => {
  test('사이드바 도달성 + 초기 렌더(라이트·발광 0)', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/seats`);
    await assertLightNoGlowNoBlackBorder(page);

    await expect(page.getByRole('link', { name: '좌석', exact: true })).toHaveAttribute(
      'href',
      `/events/${EID}/seats`,
    );
    await expect(page.getByRole('heading', { name: '좌석 구성' })).toBeVisible();
    await shot(page, 'ADM-06-seats-initial');
  });

  test('그룹 CRUD — 지정석 생성·라벨 수정·자유석 생성', async ({ page }) => {
    await login(page);
    // 라벨에 "지정석"/"자유석" 자체를 넣지 않는다 — StatePill 텍스트와 substring 충돌로
    // getByText가 라벨·배지 2개 요소에 매칭되는 strict-mode 위반을 피하기 위함(테스트 코드 함정).
    const onLabel = `E2E-A석-${RUN}`;
    const onLabelEdited = `E2E-A석-수정-${RUN}`;
    const offLabel = `E2E-B석-${RUN}`;

    await createSeatGroup(page, onLabel, true);
    await expect(page.locator('li', { hasText: onLabel }).getByText('지정석', { exact: true })).toBeVisible();
    await shot(page, 'ADM-06-group-created-on');

    // 편집 — 라벨 변경
    await page.locator('li', { hasText: onLabel }).getByRole('button', { name: '편집' }).click();
    const labelInput = page.locator('form input[type="text"], form input:not([type])').first();
    await labelInput.fill(onLabelEdited);
    await page.getByRole('button', { name: '수정', exact: true }).click();
    await expect(page.getByText(onLabelEdited, { exact: true })).toBeVisible();

    await createSeatGroup(page, offLabel, false);
    await expect(page.locator('li', { hasText: offLabel }).getByText('자유석', { exact: true })).toBeVisible();
    await shot(page, 'ADM-06-group-created-off');

    // 정리 — 다음 테스트와 독립적으로 동작하도록 이 테스트가 만든 그룹만 삭제
    await deleteSeatGroup(page, onLabelEdited);
    await deleteSeatGroup(page, offLabel);
  });

  test('ON 배정 — 순번 리스트 저장 + 재오픈 유지, OFF 배정 — 검색 추가 저장 + 재오픈 유지', async ({ page }) => {
    await login(page);
    await ensureGuest(page, GUEST_A);
    await ensureGuest(page, GUEST_B);

    const onLabel = `E2E-ON배정-${RUN}`;
    const offLabel = `E2E-OFF배정-${RUN}`;
    await createSeatGroup(page, onLabel, true);
    await createSeatGroup(page, offLabel, false);

    // ON: 배정 모달 열기 → 좌석 추가 → 게스트 선택 → 저장
    await page.locator('li', { hasText: onLabel }).getByRole('button', { name: '배정' }).click();
    await expect(page.getByRole('heading', { name: `${onLabel} 배정` })).toBeVisible();
    await page.getByRole('button', { name: '좌석 추가' }).click();
    await page.locator('select').first().selectOption({ label: GUEST_A });
    // <option> 요소는 닫힌 <select> 안에서 접근성 트리상 "숨김" 취급되어 getByText().toBeVisible()로
    // 검증 불가(테스트 코드 함정) — 실제 선택된 값(guestId)을 직접 읽어 재오픈 시 동일한지 비교한다.
    const guestIdOn = await page.locator('select').first().inputValue();
    expect(guestIdOn, 'ON 모드에서 게스트 선택이 select value로 반영돼야 함').not.toBe('');
    await shot(page, 'ADM-06-assign-on-editing');
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByRole('heading', { name: `${onLabel} 배정` })).toBeHidden();
    await expect(page.locator('li', { hasText: onLabel }).getByText('배정 1명')).toBeVisible();

    // 재오픈 — 저장한 배정이 유지되는지(원자 교체 왕복 확인)
    await page.locator('li', { hasText: onLabel }).getByRole('button', { name: '배정' }).click();
    await expect(page.locator('select').first()).toHaveValue(guestIdOn);
    await page.getByRole('button', { name: '취소' }).click();

    // OFF: 배정 모달 열기 → 검색 → 추가 → 저장
    await page.locator('li', { hasText: offLabel }).getByRole('button', { name: '배정' }).click();
    await expect(page.getByRole('heading', { name: `${offLabel} 배정` })).toBeVisible();
    await page.getByPlaceholder('이름 또는 소속').fill(GUEST_B);
    await page.locator('li', { hasText: GUEST_B }).getByRole('button', { name: '추가' }).click();
    await shot(page, 'ADM-06-assign-off-editing');
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByRole('heading', { name: `${offLabel} 배정` })).toBeHidden();
    await expect(page.locator('li', { hasText: offLabel }).getByText('배정 1명')).toBeVisible();

    await page.locator('li', { hasText: offLabel }).getByRole('button', { name: '배정' }).click();
    await expect(page.getByText(GUEST_B, { exact: false }).first()).toBeVisible();
    await shot(page, 'ADM-06-assign-off-reopened');
    await page.getByRole('button', { name: '취소' }).click();

    // 정리
    await deleteSeatGroup(page, onLabel);
    await deleteSeatGroup(page, offLabel);
  });

  test('409 SEAT_CONFLICT — 다른 그룹에 이미 배정된 참석자는 인라인 안내 + 모달 유지', async ({ page }) => {
    await login(page);
    await ensureGuest(page, GUEST_A);

    const groupX = `E2E-충돌X-${RUN}`;
    const groupY = `E2E-충돌Y-${RUN}`;
    await createSeatGroup(page, groupX, false);
    await createSeatGroup(page, groupY, false);

    // groupX에 GUEST_A 배정(성공)
    await page.locator('li', { hasText: groupX }).getByRole('button', { name: '배정' }).click();
    await page.getByPlaceholder('이름 또는 소속').fill(GUEST_A);
    await page.locator('li', { hasText: GUEST_A }).getByRole('button', { name: '추가' }).click();
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByRole('heading', { name: `${groupX} 배정` })).toBeHidden();

    // groupY에서 동일 GUEST_A 배정 시도 → 후보 목록에는 뜨지만(다른 그룹 소속 여부를 후보 필터가
    // 걸러내지 않음 — excludeIds는 "이 그룹에 이미 배정"만 제외), 저장 시 서버가 409로 거부해야 한다
    await page.locator('li', { hasText: groupY }).getByRole('button', { name: '배정' }).click();
    await page.getByPlaceholder('이름 또는 소속').fill(GUEST_A);
    await page.locator('li', { hasText: GUEST_A }).getByRole('button', { name: '추가' }).click();
    await page.getByRole('button', { name: '저장' }).click();

    await expect(page.getByText('이미 다른 그룹에 배정된 참석자가 있습니다', { exact: false })).toBeVisible();
    // 모달이 닫히지 않고 유지되는지(저장 성공 콜백에서만 닫도록 게이트했으므로 409면 열린 채 유지)
    await expect(page.getByRole('heading', { name: `${groupY} 배정` })).toBeVisible();
    await shot(page, 'ADM-06-assign-409-conflict');
    await page.getByRole('button', { name: '취소' }).click();

    await deleteSeatGroup(page, groupX);
    await deleteSeatGroup(page, groupY);
  });

  test('numbering 토글 — 그룹+배정 이중 invalidate 실렌더 확인', async ({ page }) => {
    await login(page);
    await ensureGuest(page, GUEST_A);

    const label = `E2E-토글-${RUN}`;
    await createSeatGroup(page, label, true);

    // ON 상태에서 1명 배정
    await page.locator('li', { hasText: label }).getByRole('button', { name: '배정' }).click();
    await page.getByRole('button', { name: '좌석 추가' }).click();
    await page.locator('select').first().selectOption({ label: GUEST_A });
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByRole('heading', { name: `${label} 배정` })).toBeHidden();
    await expect(page.locator('li', { hasText: label }).getByText(/배정 1명 \/ 좌석 \d+석/)).toBeVisible();

    // numbering 토글(OFF로) — assignedCount 표시 형식이 slotCount 없는 형태로 즉시 바뀌는지
    // (재조회 없이 캐시 무효화만으로 목록 뷰가 갱신되는지가 이 테스트의 핵심 검증 포인트)
    await page.locator('li', { hasText: label }).getByRole('button', { name: '편집' }).click();
    await page.locator('form input[type="checkbox"]').uncheck();
    await page.getByRole('button', { name: '수정', exact: true }).click();
    await expect(page.locator('li', { hasText: label }).getByText('자유석', { exact: true })).toBeVisible();
    await expect(page.locator('li', { hasText: label }).getByText(/^배정 1명$/)).toBeVisible();
    await shot(page, 'ADM-06-numbering-toggled');

    // 배정 뷰도 OFF 에디터로 재해석되어 열리는지(같은 그룹, 편집기 모드 전환)
    await page.locator('li', { hasText: label }).getByRole('button', { name: '배정' }).click();
    await expect(page.getByText(`배정된 참석자 (1명)`)).toBeVisible();
    await page.getByRole('button', { name: '취소' }).click();

    await deleteSeatGroup(page, label);
  });

  /**
   * 데이터 손실 봉인 (이 REQ의 최우선 도전 지점) — 네트워크 레벨 검증. 실 DB에 51건+
   * 게스트를 만드는 대신, 조회 응답을 60건 모의 슬롯으로 가로채(윈도잉 50 초과 시나리오 재현)
   * 1건만 UI에서 제거한 뒤 저장 요청 payload가 "전체 59건"을 담는지 실측한다 — 부분 전송이면
   * 원자 교체(deleteByGroup+insertBatch)가 응답에 없는 나머지를 삭제한다. 조회 요청의 size
   * 파라미터가 500(서버 기본 50이 아님)인지도 함께 확인한다.
   */
  test('데이터 손실 봉인 — 60건 모의 배정에서 1건 제거 저장 시 payload가 전체 59건을 담는다', async ({ page }) => {
    await login(page);
    const label = `E2E-데이터손실봉인-${RUN}`;
    await createSeatGroup(page, label, false);

    const mockSlots = Array.from({ length: 60 }, (_, i) => ({
      id: `mock-slot-${i}`,
      groupNo: -1,
      ord: 9999,
      guestId: `mock-guest-${i}`,
      guestName: `모의게스트${String(i).padStart(2, '0')}`,
    }));

    let capturedGetUrl = '';
    let capturedPutBody: { groupNo: number; assignments: Array<{ ord: number; guestId: string | null }> } | null =
      null;

    await page.route('**/seat-assignments*', async (route) => {
      const req = route.request();
      if (req.method() === 'GET') {
        capturedGetUrl = req.url();
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: mockSlots }) });
        return;
      }
      if (req.method() === 'PUT') {
        capturedPutBody = req.postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: mockSlots.slice(1) }),
        });
        return;
      }
      await route.continue();
    });

    await page.locator('li', { hasText: label }).getByRole('button', { name: '배정' }).click();
    await expect(page.getByText('배정된 참석자 (60명)')).toBeVisible();
    expect(capturedGetUrl, 'GET 조회가 size=500로 요청돼야 함(서버 기본 50에 의존 금지)').toContain('size=500');

    // 첫 항목(모의게스트00) 제거 → 59건 남음
    await page
      .locator('li', { hasText: '모의게스트00' })
      .filter({ has: page.getByRole('button', { name: '제거' }) })
      .getByRole('button', { name: '제거' })
      .click();
    await expect(page.getByText('배정된 참석자 (59명)')).toBeVisible();
    await shot(page, 'ADM-06-data-loss-seal-59-remaining');

    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByRole('heading', { name: `${label} 배정` })).toBeHidden();

    await page.unroute('**/seat-assignments*');

    expect(capturedPutBody, 'PUT 요청이 가로채져야 함').not.toBeNull();
    expect(capturedPutBody!.assignments).toHaveLength(59);
    // 슬라이싱 없이 전체가 담겼는지 — 제거한 mock-guest-0만 빠지고 나머지 59개 guestId 전부 존재
    const sentGuestIds = new Set(capturedPutBody!.assignments.map((a) => a.guestId));
    expect(sentGuestIds.has('mock-guest-0'), '제거한 게스트는 payload에서 빠져야 함').toBe(false);
    for (let i = 1; i < 60; i++) {
      expect(sentGuestIds.has(`mock-guest-${i}`), `mock-guest-${i}가 payload에서 누락되면 안 됨(부분 전송=데이터 손실)`).toBe(
        true,
      );
    }

    // 위 route는 unroute 됐으므로 이후 그룹 삭제는 실 서버로 나간다(모의 배정은 실제 저장되지
    // 않았으므로 — PUT 응답을 우리가 모의했을 뿐 진짜 DB에 반영되지 않음 — 그룹만 정리하면 충분)
    await deleteSeatGroup(page, label);
  });

  test('정리 — 이 스펙이 생성한 게스트를 명단에서 제외(로스터 원복)', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/roster`);
    for (const name of [GUEST_A, GUEST_B]) {
      const row = page.locator('tr', { hasText: name });
      if ((await row.count()) === 0) continue;
      await row.getByRole('button', { name: '제외' }).click();
      await page.getByRole('button', { name: '제외', exact: true }).last().click();
      await expect(page.locator('tr', { hasText: name })).toBeHidden();
    }
  });
});

test.describe('주차 구획(ADM-07) 실용 톤 정합 — 기능 회귀 스모크', () => {
  test('주차 화면 정상 렌더 + 라이트 톤 유지(스타일 정합 후 크래시 없음)', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/parking`);
    await assertLightNoGlowNoBlackBorder(page);
    await expect(page.getByRole('link', { name: '주차', exact: true })).toHaveAttribute(
      'href',
      `/events/${EID}/parking`,
    );
    await shot(page, 'ADM-07-parking-after-style-alignment');
  });
});

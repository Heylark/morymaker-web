import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * REQ-0046 콘솔 IA·내비게이션 리디자인 — §1 6시나리오 + §7 수용 기준 + 설계(02-architect.md) §11
 * 필수 검증 항목(V1~V21) 중 데스크톱·정적 분석 불가 구간을 커버하는 통합 E2E.
 *
 * 데이터: 로컬 개발 DB의 기존 3계정 재사용(REQ-0018-06/-07이 이미 구축한 회귀 픽스처, 신규 계정
 * 생성 없음) — SYSTEM_ADMIN(dev-verify, eventIds=null) · EVENT_ADMIN(배정 1건) ·
 * EVENT_STAFF(배정 1건). 배정 0건·2건 이상 조합은 `console-nav.test.ts`의 `serviceNavItemsFor`
 * 단위 테스트(V5-b)가 순수 함수 레벨에서 5조합 전부를 커버하므로 여기서는 실계정으로 확보 가능한
 * 3조합만 실 서버 왕복으로 재확인한다(중복 검증 회피 — 단위 테스트가 이미 커버하는 조합 축소는
 * mock이 아니라 순수 함수 자체를 실행하는 것이라 우회가 아니다).
 */

const EID = 'e757ba35-c62e-471a-99da-6f301abc3660';
const SYSTEM_ADMIN_EMAIL = 'dev-verify@morymaker.local';
const SYSTEM_ADMIN_PASSWORD = 'DevPassw0rd!';
const EVENT_ADMIN_EMAIL = 'req0018-06-tester-event-admin@morymaker.local';
const EVENT_ADMIN_PASSWORD = 'TesterPassw0rd1!';
const EVENT_STAFF_EMAIL = 'req0018-06-tester-event-staff@morymaker.local';
const EVENT_STAFF_PASSWORD = 'TesterPassw0rd2!';

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `test-screenshots/REQ-0046/${name}.png`, fullPage: true });
}

async function login(page: Page, username: string, password: string, entryPath: string) {
  await page.goto(entryPath);
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**${entryPath}`);
}

// --- 확증 공백 2 보완용 헬퍼(console-seats-design.spec.ts와 동일 패턴, RUN 접미사로 재실행 간 충돌 회피) ---
const DIRTY_RUN = Date.now();

async function ensureRosterGuest(page: Page, name: string) {
  const rosterLoaded = page.waitForResponse(
    (res) => /\/guests(\?|$)/.test(new URL(res.url()).pathname + new URL(res.url()).search) && res.request().method() === 'GET',
  );
  await page.goto(`/events/${EID}/roster`);
  await rosterLoaded;
  if (await page.getByText(name, { exact: true }).count()) return;
  await page.getByRole('button', { name: '개별 등록' }).click();
  await page.locator('form input').first().fill(name);
  await page.getByRole('button', { name: '등록', exact: true }).click();
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
}

async function createFreeSeatGroup(page: Page, label: string) {
  await page.goto(`/events/${EID}/seats`);
  await page.getByRole('button', { name: '그룹 추가' }).click();
  await page.locator('form input[type="text"], form input:not([type])').first().fill(label);
  await page.getByRole('button', { name: '추가', exact: true }).click();
  await expect(page.getByText(label, { exact: true })).toBeVisible();
}

async function deleteSeatGroup(page: Page, label: string) {
  const row = page.locator('li', { hasText: label });
  await row.getByRole('button', { name: '삭제' }).click();
  await page.getByRole('button', { name: '삭제', exact: true }).last().click();
  await expect(page.getByText(label, { exact: true })).toBeHidden();
}

test.describe('REQ-0046 — §1 라우트·리다이렉트 규칙 (V1~V4, V6)', () => {
  test('V1 — 미인증 딥링크는 Location 헤더에 정확히 1회 접두된 returnTo로 응답한다', async ({ page }) => {
    const res = await page.request.get(`/app/events/${EID}/roster`, { maxRedirects: 0 });
    expect([307, 308]).toContain(res.status());
    const location = res.headers()['location'];
    expect(location).toBe(`/app/oauth/login?returnTo=%2Fevents%2F${EID}%2Froster`);
  });

  test('V2 — 게스트 표면(/r,/p,/u,/kiosk,/visitor)은 middleware가 가로채지 않는다', async ({ page }) => {
    const guestPaths = ['/r/nonexistent-code', '/p/nonexistent-slot', '/u/nonexistent-token', '/kiosk', '/visitor'];
    for (const path of guestPaths) {
      const res = await page.request.get(`/app${path}`, { maxRedirects: 0 });
      // 게스트 표면은 middleware matcher 밖이라 대부분 200/404로 응답하고 리다이렉트
      // 자체가 없다(location 헤더 부재) — 그 경우는 자명하게 통과. 3xx가 나오더라도(예: 잘못된
      // 코드에 대한 페이지 내부 안내 리다이렉트) /oauth/login으로 가지만 않으면 middleware
      // 가로챔이 아니다. .not.toContain(undefined)는 매처 오류이므로 location 부재를 먼저 분기한다.
      const location = res.headers()['location'];
      if (location) {
        expect(
          location,
          `${path} 요청이 middleware에 의해 /oauth/login으로 리다이렉트되면 안 됨(status=${res.status()})`,
        ).not.toContain('/oauth/login');
      }
    }
  });

  test('V3 — 딥링크 → 로그인 → 원래 경로로 정확히 복귀한다(canonical 아님)', async ({ page }) => {
    await page.goto(`/events/${EID}/roster`);
    // middleware → /oauth/login(Route Handler) → PKCE 개시 → auth authorize → auth 자체 로그인
    // 폼(/login)으로 착지한다. authorize 자체는 이 폼으로 즉시 302하므로 최종 관찰 지점은
    // /login이다(기존 로그인 helper들이 authorize URL을 단언하지 않는 것과 동일 이유).
    await expect(page).toHaveURL(/localhost:30000\/login/);
    await page.locator('input[name="username"]').fill(SYSTEM_ADMIN_EMAIL);
    await page.locator('input[name="password"]').fill(SYSTEM_ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`**/events/${EID}/roster`);
    await expect(page).toHaveURL(new RegExp(`/app/events/${EID}/roster$`));
  });

  test('V4 — 로그인 상태로 /oauth/login 접근 시 Location 헤더가 /app/landing으로 정확히 1회 접두된다(이중·누락 FAIL)', async ({
    page,
  }) => {
    await login(page, SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD, '/landing');
    const res = await page.request.get('/app/oauth/login', { maxRedirects: 0 });
    expect([307, 308]).toContain(res.status());
    // 이 단락은 Route Handler라 getPublicOrigin()으로 절대 URL을 만든다(리버스
    // 프록시 뒤 standalone 대비 의도된 설계). 헤더 원문이 절대 URL이어도 pathname을 파싱해
    // 이중 접두(/app/app/landing)·누락(/landing)이 아닌 정확히 1회 접두(/app/landing)인지 확인한다.
    const location = res.headers()['location'];
    expect(location).not.toBeUndefined();
    const parsed = new URL(location!);
    expect(parsed.pathname).toBe('/app/landing');
  });

  test('V6 — EVENT_STAFF 로그인(returnTo 없음)은 /landing에 정상 착지한다(/forbidden 아님)', async ({ page }) => {
    await login(page, EVENT_STAFF_EMAIL, EVENT_STAFF_PASSWORD, '/landing');
    await expect(page).toHaveURL(/\/app\/landing$/);
    await expect(page.locator('h1, [role="heading"]').first()).toBeVisible();
  });
});

test.describe('REQ-0046 — V5 역할별 사이드바 노출(실계정 3조합 스팟체크)', () => {
  test('SYSTEM_ADMIN — 행사 목록·계정 관리 2항목(체크인 스캔 미노출)', async ({ page }) => {
    await login(page, SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD, '/landing');
    await page.goto('/events');
    const service = page.getByRole('navigation', { name: '서비스' });
    await expect(service.getByRole('link', { name: '행사 목록' })).toBeVisible();
    await expect(service.getByRole('link', { name: '계정 관리' })).toBeVisible();
    await expect(service.getByRole('link', { name: '체크인 스캔' })).toHaveCount(0);
  });

  test('EVENT_ADMIN(배정 1건) — 행사 목록·체크인 스캔 2항목(계정 관리 제외)', async ({ page }) => {
    await login(page, EVENT_ADMIN_EMAIL, EVENT_ADMIN_PASSWORD, '/events');
    const service = page.getByRole('navigation', { name: '서비스' });
    await expect(service.getByRole('link', { name: '행사 목록' })).toBeVisible();
    await expect(service.getByRole('link', { name: '체크인 스캔' })).toBeVisible();
    await expect(service.getByRole('link', { name: '계정 관리' })).toHaveCount(0);
  });

  test('EVENT_STAFF(배정 1건) — 체크인 스캔 1항목만', async ({ page }) => {
    await login(page, EVENT_STAFF_EMAIL, EVENT_STAFF_PASSWORD, '/landing');
    await page.goto('/staff/scan');
    // 스태프 셸은 사이드바를 렌더하되 Zone2만 — StaffEventProvider가 ready 분기(배정 1건)라 셸이 살아있다.
    const service = page.getByRole('navigation', { name: '서비스' });
    await expect(service.getByRole('link', { name: '체크인 스캔' })).toBeVisible();
    await expect(service.getByRole('link', { name: '행사 목록' })).toHaveCount(0);
    await expect(service.getByRole('link', { name: '계정 관리' })).toHaveCount(0);
  });
});

test.describe('REQ-0046 — 셸 무결성 (V14, V16, V17, V18)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD, '/events');
  });

  test('V14 — 중첩 셸 부재: 콘솔 화면에 사이드바가 정확히 1개', async ({ page }) => {
    await page.goto(`/events/${EID}/roster`);
    await expect(page.getByRole('complementary', { name: '콘솔 사이드바' })).toHaveCount(1);
  });

  test('V16 — 상세 화면에서 aria-current="page"가 사이드바 내부에 정확히 1개(Zone3만)', async ({ page }) => {
    await page.goto(`/events/${EID}/roster`);
    const sidebar = page.getByRole('complementary', { name: '콘솔 사이드바' });
    await expect(sidebar.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(sidebar.getByRole('navigation', { name: '행사 메뉴' }).getByRole('link', { name: '명단' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('V16 — 서비스 레벨(/events)에서도 aria-current="page"가 정확히 1개', async ({ page }) => {
    await page.goto('/events');
    const sidebar = page.getByRole('complementary', { name: '콘솔 사이드바' });
    await expect(sidebar.locator('[aria-current="page"]')).toHaveCount(1);
  });

  test('V17 — 편입 6화면 폭이 기존 편집 폼(576px)·목록(max-w-3xl)·스캔(max-w-2xl)과 정합한다', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto(`/events/${EID}/edit`);
    const editWidth = await page.locator('main > div').first().evaluate((el) => el.getBoundingClientRect().width);

    await page.goto('/events/new');
    const newWidth = await page.locator('main > div').first().evaluate((el) => el.getBoundingClientRect().width);
    expect(newWidth, '/events/new 폭이 /events/{eid}/edit(576px)과 동일해야 함').toBeCloseTo(editWidth, 0);

    await page.goto('/accounts/new');
    const accountsNewWidth = await page
      .locator('main > div')
      .first()
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(accountsNewWidth).toBeCloseTo(editWidth, 0);

    await page.goto('/events');
    const listMaxWidth = await page.evaluate(() => {
      const el = document.querySelector('main > div');
      return el ? getComputedStyle(el).maxWidth : null;
    });
    expect(listMaxWidth).toBe('768px'); // max-w-3xl

    await page.goto('/accounts');
    const accountsMaxWidth = await page.evaluate(() => {
      const el = document.querySelector('main > div');
      return el ? getComputedStyle(el).maxWidth : null;
    });
    expect(accountsMaxWidth).toBe('768px');
  });

});

test.describe('REQ-0046 — V18 /staff/scan/confirm main 랜드마크 유일성 (EVENT_STAFF ready 상태)', () => {
  // ⚠️ 확증 공백 1 보완 — 이전 라운드는 SYSTEM_ADMIN(eventIds=null)으로 로그인해 진입했으나,
  // StaffEventProvider는 eventIds===null이면 'unsupported' 분기로 빠져 children(ScanConfirmContent)을
  // 렌더하지 않고 자기 자신의 안내 화면(main 1개)을 반환한다 — 즉 이전 V18은 confirm 페이지의
  // <div> 강등을 전혀 검증하지 못한 채 "안내 화면의 main"으로 통과했다. EVENT_STAFF(배정 1건)로
  // 로그인해야 StaffEventProvider가 'ready' 분기로 children을 렌더하고, 셸(ConsoleShell)의
  // <main> 안에 confirm 페이지가 실제로 배치된다. 각 테스트는 사이드바(콘솔 사이드바) 렌더
  // 여부를 먼저 단언해 "대상 화면에 실제로 도달했는지"를 선증명한다(도달 실패가 조용히 PASS로
  // 계상되는 것이 원 결함의 본체였음).
  test.beforeEach(async ({ page }) => {
    await login(page, EVENT_STAFF_EMAIL, EVENT_STAFF_PASSWORD, '/landing');
  });

  test('V18-a — 잘못된 접근(guestId·token 부재) 분기: 셸 도달 확인 + main 1개', async ({ page }) => {
    await page.goto('/staff/scan/confirm');
    // 셸이 실제로 렌더됐음(=StaffEventProvider가 ready 분기)을 먼저 확인 — 이게 없으면 아래
    // main 단언이 무엇을 세고 있는지 알 수 없다(도달 증명 없는 카운트는 확증 공백 1의 재발).
    await expect(page.getByRole('complementary', { name: '콘솔 사이드바' })).toHaveCount(1);
    await expect(page.getByText('잘못된 접근입니다', { exact: false })).toBeVisible();
    await expect(page.getByRole('main')).toHaveCount(1);
  });

  test('V18-b — 유효 파라미터(guestId+name+org) 본문 분기: 셸 도달 확인 + main 1개', async ({ page }) => {
    await page.goto('/staff/scan/confirm?guestId=req0046-e2e-fake-guest&name=REQ-0046%20검증대상&org=REQ-0046');
    await expect(page.getByRole('complementary', { name: '콘솔 사이드바' })).toHaveCount(1);
    await expect(page.getByRole('button', { name: '참석 확인' })).toBeVisible();
    await expect(page.getByRole('main')).toHaveCount(1);
  });

  // V18-c(Suspense fallback 분기)는 의도적으로 미작성 — ScanConfirmPage의 Suspense 경계는
  // useSearchParams()의 정적 프리렌더 CSR bailout 대응이 목적이라, 순수 CSR 라우트(이 REQ의
  // (staff) 그룹은 전부 'use client')에서는 하이드레이션 이후 런타임에 재현 가능한 상태가 아니다
  // (React 공식 문서상 이 Suspense는 빌드 시점 프리렌더 실패 방지용). BUILD-001이 정적 프리렌더
  // 자체의 성공(=bailout 경계가 실제로 존재·동작함)을 이미 검증한다 — 런타임 E2E로 강제 재현을
  // 시도하지 않는다(허위 커버리지 주장 방지, 확증 공백 1 보고서의 "V18이 3분기를 요구했는데
  // 0분기만 실행됐다"는 지적에 대한 정직한 응답: 2/3분기는 런타임 검증, 1/3분기는 빌드 검증).
});

test.describe('REQ-0046 — 로그아웃 (V15)', () => {
  test('로그아웃 → /logged-out 착지(/landing·콘솔 아님) → 재진입 시 미인증 + mm_ 쿠키 4종 전량 삭제', async ({
    page,
  }) => {
    await login(page, SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD, '/events');

    // ⚠️ 확증 공백 5 보완 — 로그아웃 전 mm_ 쿠키가 실제로 존재함을 먼저 확인한다(vacuous 방지 —
    // 로그아웃 전 count>0이어야 로그아웃 후 count===0이 의미를 가진다). 이 REQ의 로그아웃은
    // 결정 ⑤=C(웹 쿠키 4종 삭제로 완결, IdP 세션 종결은 REQ-0047)이므로 검증 대상도 mm_ 4종이다.
    const cookiesBefore = await page.context().cookies();
    const mmCookiesBefore = cookiesBefore.filter((c) => c.name.startsWith('mm_'));
    expect(mmCookiesBefore.length, '로그아웃 전에는 mm_ 쿠키가 존재해야 함(그래야 이후 삭제 확인이 유효)').toBeGreaterThan(
      0,
    );

    const sidebar = page.getByRole('complementary', { name: '콘솔 사이드바' });
    await sidebar.getByRole('button', { name: '로그아웃' }).click();
    await page.waitForURL(/\/app\/logged-out$/);
    await expect(page.getByRole('heading', { name: '로그아웃되었습니다' })).toBeVisible();
    await expect(page.getByRole('link', { name: '다시 로그인' })).toBeVisible();

    // mm_ 쿠키 4종(mm_auth·mm_id_token·mm_access_token·mm_refresh_token) 전량 삭제 확인 —
    // middleware는 mm_auth 1종만 보므로(request.cookies.has(COOKIE_AUTH)) 아래 딥링크 재요청
    // 단언만으로는 나머지 3종의 잔존을 검출하지 못한다(로그아웃 라우트가 4종 중 1종만 지워도
    // 이 딥링크 단언은 그대로 통과하는 거짓 그린 — 그래서 쿠키 자체를 직접 열거한다).
    const cookiesAfter = await page.context().cookies();
    const mmCookiesAfter = cookiesAfter.filter((c) => c.name.startsWith('mm_'));
    expect(
      mmCookiesAfter.map((c) => c.name),
      'mm_ prefix 쿠키가 로그아웃 후 전부 삭제돼야 함(만료 쿠키가 name은 남기고 value만 비우는 형태라도 브라우저 쿠키 저장소에서는 사라져야 함)',
    ).toEqual([]);

    // 재진입 시 미인증 확인 — 딥링크 재요청이 다시 로그인으로 튕겨야 한다.
    const res = await page.request.get('/app/events', { maxRedirects: 0 });
    expect([307, 308]).toContain(res.status());
    expect(res.headers()['location']).toContain('/app/oauth/login');
    await shot(page, 'logged-out');
  });

  /**
   * 부록 A-2 (b) 전용 가드 — 되돌림 반영 적대적 검토가 지적한 mutation 공백 봉합. 위 V15는
   * 로그인→로그아웃 단일 경로만 밟아 로그아웃 시점에 PKCE 쿠키가 애초에 존재하지 않는다
   * (`/oauth/callback`이 성공·실패 모든 경로에서 이미 최종 삭제 — one-time use). 즉 (b) "정리
   * 대상 쿠키 열거에 PKCE 검증자를 포함한다"는 위 테스트에서 no-op이라, `logout/route.ts`의
   * PKCE 삭제 줄을 지워도 위 테스트는 계속 GREEN이다(mutation-insensitive).
   *
   * 이 테스트는 (b)가 실제로 막으려는 시나리오 — "사용자가 다른 탭에서 로그인 흐름을 열어둔 채
   * (=PKCE 쿠키 실존) 로그아웃" — 를 직접 만든다: `?prompt=login`으로 `/oauth/login`을 1회
   * 태워 `mm_pkce_verifier`를 심되 콜백을 완주하지 않고(=PKCE가 아직 살아있는 상태로 고정)
   * 로그아웃해 mm_ 전수 0건을 단언한다. `logout/route.ts`의 PKCE 삭제를 되돌리면 이 테스트가
   * 즉시 FAIL한다.
   */
  test('로그아웃 시점에 다른 탭의 로그인 흐름이 남긴 PKCE 쿠키도 함께 삭제된다 (A-2(b) 되돌림 반영)', async ({
    page,
  }) => {
    await login(page, SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD, '/events');

    // `?prompt=login`은 "이미 로그인됨" 단락을 건너뛰고 항상 새 PKCE 페어를 발급한다 —
    // 다른 탭에서 로그인을 다시 개시했지만 콜백까지는 안 간 상태를 인위적으로 재현한다.
    // maxRedirects:0으로 외부 auth 도메인(authorize URL)까지는 따라가지 않는다 — Set-Cookie만
    // 필요하다. page.request는 브라우저 컨텍스트와 쿠키 저장소를 공유하므로 이 응답의
    // mm_pkce_verifier가 이후 page.context().cookies()에 그대로 나타난다.
    const loginRes = await page.request.get('/app/oauth/login?prompt=login', { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(loginRes.status());

    const cookiesMidway = await page.context().cookies();
    expect(
      cookiesMidway.some((c) => c.name === 'mm_pkce_verifier'),
      'PKCE 개시 직후에는 mm_pkce_verifier가 실존해야 함(그래야 이후 삭제 확인이 유효 — vacuous 방지)',
    ).toBe(true);

    const sidebar = page.getByRole('complementary', { name: '콘솔 사이드바' });
    await sidebar.getByRole('button', { name: '로그아웃' }).click();
    await page.waitForURL(/\/app\/logged-out$/);

    const cookiesAfter = await page.context().cookies();
    const mmCookiesAfter = cookiesAfter.filter((c) => c.name.startsWith('mm_'));
    expect(
      mmCookiesAfter.map((c) => c.name),
      '다른 탭이 남긴 mm_pkce_verifier를 포함해 mm_ prefix 쿠키가 로그아웃 후 전부 삭제돼야 함',
    ).toEqual([]);
  });
});

test.describe('REQ-0046 — 랜딩 발광 예산 (V10)', () => {
  /**
   * 발광 토큰(`--glow-cta`·`--glow-num`)은 `box-shadow`/`filter: drop-shadow(...)` 값 자체에
   * CSS 키워드 "blur"가 등장하지 않는다(globals.css 실측: `--glow-cta: 0 10px 26px -10px
   * rgba(212, 179, 106, .45)`) — 기존 스펙들의 `/blur/.test(...)` 휴리스틱은 이 토큰 체계에서
   * 항상 0을 반환하는 무의미(vacuous) 단언이라 여기서는 채택하지 않는다(범위 밖 기존 스펙은
   * 수정하지 않음 — 사전 존재 관찰로 보고만 함). 대신 champagne 발광 색(rgb(212, 179, 106))이
   * 그림자·필터에 실제로 나타나는지를 직접 단언한다.
   */
  async function countChampagneGlow(page: Page) {
    return page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      return all.filter((el) => {
        const s = getComputedStyle(el);
        const hasGlowShadow = s.boxShadow !== 'none' && /rgba?\(212,\s*179,\s*106/.test(s.boxShadow);
        const hasGlowFilter = s.filter !== 'none' && /rgba?\(212,\s*179,\s*106/.test(s.filter);
        return hasGlowShadow || hasGlowFilter;
      }).length;
    });
  }

  test('랜딩(SYSTEM_ADMIN, 이동 카드 2개 이상) — 발광 정확히 1개', async ({ page }) => {
    await login(page, SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD, '/landing');
    // useMe()·useEvents() 비동기 로드가 끝나기 전엔 items가 빈 배열(로딩 상태)이라 이동 카드
    // 자체가 아직 렌더되지 않는다 — 카드 노출을 먼저 기다린 뒤 발광을 센다.
    await expect(page.getByRole('link', { name: '행사 목록' })).toBeVisible();
    const glowCount = await countChampagneGlow(page);
    expect(glowCount, '랜딩 발광 요소는 정확히 1개여야 함').toBe(1);
    await shot(page, 'landing-system-admin');
  });

  test('콘솔·스태프 화면 — 발광 0', async ({ page }) => {
    await login(page, SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD, '/events');
    await page.goto(`/events/${EID}/roster`);
    const glowCount = await countChampagneGlow(page);
    expect(glowCount).toBe(0);
  });
});

test.describe('REQ-0046 — 모달 dirty 가드 (V9, V9-b)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD, '/events');
    await page.goto(`/events/${EID}/roster`);
  });

  function scrim(page: Page) {
    return page.locator('[role="presentation"] > [aria-hidden]');
  }

  test('V9-b — 무입력 상태에서 스크림 클릭 시 confirm 없이 즉시 닫힌다(오탐 가드)', async ({ page }) => {
    let dialogFired = false;
    page.on('dialog', (dialog) => {
      dialogFired = true;
      void dialog.dismiss();
    });

    await page.getByRole('button', { name: '개별 등록' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await scrim(page).click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(dialogFired, '무입력 편집 모달은 스크림 클릭 시 confirm이 뜨면 안 됨(오탐)').toBe(false);
  });

  test('V9 — 입력 후 스크림 클릭 시 confirm 노출, 취소 시 모달 유지', async ({ page }) => {
    let dialogMessage = '';
    page.on('dialog', (dialog) => {
      dialogMessage = dialog.message();
      void dialog.dismiss(); // 취소 = 모달 유지
    });

    await page.getByRole('button', { name: '개별 등록' }).click();
    const nameInput = page.locator('form input').first();
    await nameInput.fill('Dirty Guard 테스트');
    await scrim(page).click({ position: { x: 10, y: 10 } });
    expect(dialogMessage.length, '입력 후 스크림 클릭은 confirm을 노출해야 함').toBeGreaterThan(0);
    await expect(page.getByRole('dialog'), '취소 시 모달이 유지돼야 함').toBeVisible();
  });

  test('V9 — ESC는 dirty 여부와 무관하게 confirm 없이 즉시 닫힌다', async ({ page }) => {
    let dialogFired = false;
    page.on('dialog', () => {
      dialogFired = true;
    });
    await page.getByRole('button', { name: '개별 등록' }).click();
    const nameInput = page.locator('form input').first();
    await nameInput.fill('ESC 테스트');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(dialogFired).toBe(false);
  });

  test('V8 — 모달 오픈 시 사이드바가 inert(딤 밖, 탭 불가)', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: '콘솔 사이드바' });
    await expect(sidebar).not.toHaveAttribute('inert', '');
    await page.getByRole('button', { name: '개별 등록' }).click();
    await expect(sidebar).toHaveAttribute('inert', '');
    await page.keyboard.press('Escape');
    await expect(sidebar).not.toHaveAttribute('inert', '');
  });
});

test.describe('REQ-0046 — SeatAssignModal(자유석) dirty 가드 — useDirty 유일 소비처 커버리지 보완', () => {
  // ⚠️ 확증 공백 2 보완 — useDirty의 유일 실사용처는 SeatAssignModal(자유석 memberIds 변경
  // 포함)인데, 어떤 신규 E2E도 좌석 배정 모달을 열지 않아 이 훅에 커버리지가 0이었다.
  // (`useDirty`의 `open` 인자가 정확히 이 소비처를 위해 만든 시그니처 — `useDirty.ts`를 `return false`로
  // 치환해도 GREEN을 유지했던 거짓 그린을 여기서 닫는다.)
  test('자유석 그룹에서 멤버 추가 후 스크림 클릭 시 confirm 노출(dirty=true), 취소 시 배정 유지', async ({ page }) => {
    await login(page, SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD, '/events');

    const guestName = `REQ0046-dirty-${DIRTY_RUN}`;
    const groupLabel = `REQ0046-자유석-${DIRTY_RUN}`;
    await ensureRosterGuest(page, guestName);
    await createFreeSeatGroup(page, groupLabel);

    await page.locator('li', { hasText: groupLabel }).getByRole('button', { name: '배정' }).click();
    await expect(page.getByRole('heading', { name: `${groupLabel} 배정` })).toBeVisible();

    // 무입력 상태 — 스크림 클릭은 confirm 없이 즉시 닫혀야 한다(오탐 가드, V9-b와 동일 취지를
    // 이 소비처에서도 별도 확인 — SeatAssignEditor는 GuestEditModal과 다른 스냅샷 구조를 쓴다).
    let dialogFiredBeforeEdit = false;
    const noopListener = (dialog: import('@playwright/test').Dialog) => {
      dialogFiredBeforeEdit = true;
      void dialog.dismiss();
    };
    page.on('dialog', noopListener);
    const scrim = page.locator('[role="presentation"] > [aria-hidden]');
    await scrim.click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(dialogFiredBeforeEdit, '무입력 좌석 배정 모달은 스크림 클릭 시 confirm이 뜨면 안 됨(오탐)').toBe(false);
    page.off('dialog', noopListener);

    // 재오픈 후 자유석 멤버를 추가(memberIds 변경 — v3가 놓쳤던 dirty 스냅샷 대상)
    await page.locator('li', { hasText: groupLabel }).getByRole('button', { name: '배정' }).click();
    await page.getByPlaceholder('이름 또는 소속').fill(guestName);
    await page.locator('li', { hasText: guestName }).getByRole('button', { name: '추가' }).click();

    let dialogMessage = '';
    page.on('dialog', (dialog) => {
      dialogMessage = dialog.message();
      void dialog.dismiss(); // 취소 = 모달 유지(배정 미저장)
    });
    await scrim.click({ position: { x: 10, y: 10 } });
    expect(dialogMessage.length, '멤버 추가 후 스크림 클릭은 confirm을 노출해야 함(useDirty가 true를 반환)').toBeGreaterThan(
      0,
    );
    await expect(page.getByRole('dialog'), '취소 시 모달이 유지돼야 함').toBeVisible();

    // 정리 — ESC로 닫고(미저장이므로 배정 없음) 그룹 삭제
    await page.keyboard.press('Escape');
    await deleteSeatGroup(page, groupLabel);
  });
});

test.describe('REQ-0046 — §7 수용 기준 (핸드오프 QA 체크리스트)', () => {
  test('수용① — 계정 관리 화면에서 클릭 1번으로 행사 목록 복귀', async ({ page }) => {
    await login(page, SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD, '/accounts');
    await page.getByRole('navigation', { name: '서비스' }).getByRole('link', { name: '행사 목록' }).click();
    await expect(page).toHaveURL(/\/app\/events$/);
  });

  test('수용② — 로그인 이후 모든 관리 화면에서 세션 UI(이름·역할·로그아웃)가 같은 위치(Zone4 고정)', async ({
    page,
  }) => {
    await login(page, SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD, '/events');
    const sidebar = page.getByRole('complementary', { name: '콘솔 사이드바' });
    const positionsAt: Record<string, number> = {};
    for (const path of ['/events', '/accounts', `/events/${EID}/roster`]) {
      await page.goto(path);
      const box = await sidebar.getByRole('button', { name: '로그아웃' }).boundingBox();
      expect(box).not.toBeNull();
      positionsAt[path] = box!.y;
    }
    const values = Object.values(positionsAt);
    expect(values.every((v) => Math.abs(v - values[0]) < 2), '세 화면에서 로그아웃 버튼 y좌표가 동일해야 함').toBe(
      true,
    );
  });

  test('수용③ — 서비스 그룹은 행사 선택 전후 동일 위치(사이드바 Zone2 상시 노출)', async ({ page }) => {
    await login(page, SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD, '/events');
    await expect(page.getByRole('navigation', { name: '서비스' })).toBeVisible();
    await page.goto(`/events/${EID}/roster`);
    await expect(page.getByRole('navigation', { name: '서비스' })).toBeVisible();
  });

  // ⚠️ 확증 공백 3·4 보완 — 이전 라운드는 이 지점에 `expect(true).toBe(true)` 항진 테스트
  // 2건을 두고 "수용④⑤⑥ PASS"로 집계했다. ⑤·⑥(발광 예산·hex 리터럴 0)은 V10/V11이 실제로
  // 앱 코드를 실행하며 검증하므로 항진 테스트 없이 그대로 교차 참조로 충분하지만(04-test-result.md
  // §8에서 별도 테스트 없이 각주로만 표기), ④(§1 6개 시나리오)는 실제로는 6개 중 3개(시나리오
  // 2·4·6)에 대응하는 V 항목이 존재하지 않았다 — "교차 참조"라는 주장 자체가 근거 없었다.
  // 아래 3개는 그 공백을 실제 실행으로 메운다(시나리오 1·3·5는 각각 V13(사전존재 파손,
  // REQ-0046 무관)·V1·V3·V4로 이미 커버됨).
  test('수용④-보강 — 시나리오2: `/` 접근·로그인됨 → /landing으로 이동(랜딩 생략 아님)', async ({ page }) => {
    await login(page, SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD, '/landing');
    await page.goto('/');
    await expect(page).toHaveURL(/\/app\/landing$/);
  });

  test('수용④-보강 — 시나리오4: 딥링크·로그인됨은 랜딩을 거치지 않고 해당 화면 그대로 응답한다', async ({
    page,
  }) => {
    await login(page, SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD, '/landing');
    await page.goto(`/events/${EID}/roster`);
    // 랜딩으로 우회하지 않고 요청한 화면 그대로 응답해야 한다(§1 "해당 화면 그대로(랜딩 생략)").
    await expect(page).toHaveURL(new RegExp(`/app/events/${EID}/roster$`));
    await expect(page.getByRole('complementary', { name: '콘솔 사이드바' })).toHaveCount(1);
  });

  test('수용④-보강 — 시나리오6: 세션 만료 상태에서 조작 시 현재 경로가 returnTo로 저장된다', async ({
    page,
  }) => {
    // useRequireRole은 gate-client 마운트 시 1회 /api/auth/me를 호출해 세션을 재확인한다
    // (SPA 네비게이션 중 만료 감지 — 서버 게이트가 못 잡는 영역). 쿠키는 유효한 채로 두고
    // 이 재확인 호출만 무인증 응답으로 가로채 "화면은 이미 로드됐는데 세션이 그 사이 만료된"
    // 상태를 재현한다(쿠키까지 지우면 middleware가 먼저 막아 이 훅에 도달하지 못함 — 이번 변경이
    // 고친 것은 정확히 이 훅의 returnTo 누락이므로 훅이 실행되는 경로로 진입해야 한다).
    await login(page, SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD, '/landing');
    await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, json: { user: null } }));

    // router.replace가 /oauth/login으로 다시 302(→ authorize → login 폼)를 밟기 전에, Next
    // 클라이언트가 이 경로로 보내는 요청 URL 자체를 가로채 returnTo를 확인한다(최종 주소창
    // 값에 의존하면 그 뒤 연쇄 리다이렉트로 인해 중간 URL을 놓칠 수 있다). 하드 네비게이션
    // (page.goto) 직후에는 방금 떠나는 이전 화면(/landing)의 게이트도 잠시 동일 가짜 응답을
    // 받아 자기 경로(returnTo=/landing)로 먼저 재요청하는 경우가 관찰된다(레이스 — 이 REQ의
    // 7개 확증 공백 범위 밖이라 별도 결함으로 취급하지 않는다) — 그래서 첫 매치가 아니라
    // "목표 경로(roster)를 returnTo로 담은" 요청을 특정해 잡는다(오탐 회피).
    let capturedLoginRequestUrl: string | null = null;
    const targetReturnTo = encodeURIComponent(`/events/${EID}/roster`);
    await page.route('**/oauth/login**', async (route) => {
      const url = route.request().url();
      if (!capturedLoginRequestUrl && url.includes(`returnTo=${targetReturnTo}`)) {
        capturedLoginRequestUrl = url;
      }
      await route.continue();
    });

    await page.goto(`/events/${EID}/roster`);
    await expect
      .poll(() => capturedLoginRequestUrl, { message: 'useRequireRole이 세션 만료를 감지해 roster 경로를 returnTo로 담아 /oauth/login을 재요청해야 함' })
      .not.toBeNull();
    const url = new URL(capturedLoginRequestUrl!);
    expect(url.pathname).toBe('/app/oauth/login');
    expect(url.searchParams.get('returnTo'), 'returnTo에 세션 만료 당시 경로가 저장돼야 함').toBe(
      `/events/${EID}/roster`,
    );
  });
});

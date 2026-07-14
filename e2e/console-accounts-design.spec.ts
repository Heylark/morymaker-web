import { test, expect, type Page } from '@playwright/test';

/**
 * 콘솔 계정·권한(ADM-11) — SYSTEM_ADMIN 전용 auth `/api/accounts` 소비 회귀 + 게이트 프리미티브
 * 재설계(v2) 재검증.
 *
 * ★weakest link 실측★: BFF 프록시가 부착하는 `mm_access_token`이 auth
 * `AdminApiSecurityConfig`(hasRole(SYSTEM_ADMIN))에서 실제로 200/201로 수락되는지는 정적 분석으로
 * 확인 불가 — 목록 조회(GET)·계정 생성(POST) 두 지점 모두 실 서버 응답 status를 직접 단언한다.
 *
 * 게이트 재검증: 이전 구현은 EVENT_ADMIN 세션의 `/accounts` 접근이 `net::ERR_TOO_MANY_REDIRECTS`로
 * 실패했다(`assertRoleOrRedirect`가 미인증·인증+불충족을 구분 못 하고 둘 다 로그인으로 보내
 * auth 기존 세션 재인정 → 동일 role 재발급 → 재차단 무한 루프). 게이트 프리미티브 분기 수정 후에는
 * 인증+불충족이 `FORBIDDEN_PATH`(게이트 없는 `/forbidden`)로 안정 종결돼야 한다 — 이번 회차는
 * "차단됨"이 아니라 "**`/forbidden`에서 안정적으로 멈춤**"을 명시적으로 단언한다.
 *
 * `assertRoleOrRedirect`·`resolveGateOutcome`은 공유 프리미티브라 (console) ADMIN_ROLES 게이트와
 * (staff) STAFF_ROLES 게이트도 동일 함수를 소비한다 — 세 번째 테스트가 EVENT_STAFF 세션으로
 * `/staff`(공유 프리미티브의 또 다른 소비자) 정상 통과 + 미인증 `/staff` 로그인 리다이렉트를
 * 실 서버 E2E로 재확인한다(단위 테스트 `auth-gate.test.ts`가 이미 커버하지만, 실 auth 서버·실
 * 브라우저 리다이렉트 사이클에서도 동일하게 동작하는지가 이번 재검증의 핵심).
 *
 * 세 테스트가 데이터(계정 생성 → 재로그인)로 이어지므로 `serial`로 고정한다.
 *
 * 데이터: 로컬 개발 DB 이벤트 e757ba35-c62e-471a-99da-6f301abc3660(기존 콘솔 회귀 테스트가 쓰던
 * 로컬 개발 전용 이벤트)을 담당 행사로 재사용한다(운영 데이터 아님, 로컬 전용).
 * 신규 생성 계정(EVENT_ADMIN·EVENT_STAFF 각 1개)은 auth에 DELETE 엔드포인트가 없어 Tester가
 * 검증 직후 DB에서 직접 정리한다(TASK_LOG "테스트 환경 lifecycle" 참조).
 */

test.describe.configure({ mode: 'serial' });

const EID = 'e757ba35-c62e-471a-99da-6f301abc3660';
const SYSTEM_ADMIN_EMAIL = 'dev-verify@morymaker.local';
const SYSTEM_ADMIN_PASSWORD = 'DevPassw0rd!';
const EVENT_ADMIN_EMAIL = 'req0018-06-tester-event-admin@morymaker.local';
const EVENT_ADMIN_PASSWORD = 'TesterPassw0rd1!';
const EVENT_STAFF_EMAIL = 'req0018-06-tester-event-staff@morymaker.local';
const EVENT_STAFF_PASSWORD = 'TesterPassw0rd2!';

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `test-screenshots/REQ-0018-06/${name}.png`, fullPage: true });
}

// entryPath는 로그인 성공 후 auth가 되돌려보내는 목적지(returnTo) — 게이트가 다른 표면
// ((console)/events vs (staff)/staff)마다 role 요구가 달라 목적지별로 도착 지점이 달라진다.
async function login(page: Page, username: string, password: string, entryPath = '/events') {
  await page.goto(entryPath);
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**${entryPath}`);
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

test.describe('ADM-11 계정·권한 — SYSTEM_ADMIN 전용 auth 연동', () => {
  test('SYSTEM_ADMIN 목록(200 실측) + 생성(EVENT_ADMIN, 201 실측) + 역할별 eventIds 조건부 + 목록 반영', async ({
    page,
  }) => {
    await login(page, SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD);

    // ★weakest link① — GET /api/accounts가 SYSTEM_ADMIN mm_access_token으로 200(≠401/403) 수락되는지 실측
    const [listResp] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/proxy/api/accounts') && r.request().method() === 'GET',
      ),
      page.goto('/accounts'),
    ]);
    expect(listResp.status(), 'weakest link — auth AdminApiSecurityConfig가 SYSTEM_ADMIN 목록 조회를 200으로 수락해야 함').toBe(
      200,
    );

    await assertLightNoGlowNoBlackBorder(page);
    await expect(page.getByRole('heading', { name: '계정 관리' })).toBeVisible();
    await expect(page.getByText(SYSTEM_ADMIN_EMAIL, { exact: false })).toBeVisible();
    await shot(page, 'ADM-11-accounts-list-desktop');

    // 생성 화면 진입
    await page.getByRole('link', { name: '+ 계정 추가' }).click();
    await expect(page).toHaveURL(/\/accounts\/new$/);
    await shot(page, 'ADM-11-accounts-new-initial');

    // role=SYSTEM_ADMIN이면 eventIds 필드셋이 숨겨져야 함(디폴트는 EVENT_STAFF라 우선 확인)
    await page.locator('select[name="role"]').selectOption('SYSTEM_ADMIN');
    await expect(page.getByText('담당 행사', { exact: false })).toHaveCount(0);

    // role=EVENT_ADMIN 전환 → eventIds 노출 + 서버 무접촉 클라 사전방어(미체크 제출 시 폼 잔류)
    await page.locator('select[name="role"]').selectOption('EVENT_ADMIN');
    await expect(page.getByText('담당 행사 (1개 이상 필수)')).toBeVisible();
    await page.locator('input[name="email"]').fill(EVENT_ADMIN_EMAIL);
    await page.locator('input[name="password"]').fill(EVENT_ADMIN_PASSWORD);
    await page.getByRole('button', { name: '계정 만들기' }).click();
    await expect(page.getByText('담당 행사를 1개 이상 선택하세요.')).toBeVisible();
    await expect(page).toHaveURL(/\/accounts\/new$/); // 서버 호출 없이 폼에 남아있어야 함(클라 사전방어 실증)

    // 담당 행사 체크 후 재제출 — ★weakest link② — POST /api/accounts가 201(≠401/403) 수락되는지 실측
    await page.locator(`input[type="checkbox"][value="${EID}"]`).check();
    const [createResp] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/proxy/api/accounts') && r.request().method() === 'POST',
      ),
      page.getByRole('button', { name: '계정 만들기' }).click(),
    ]);
    expect(createResp.status(), 'weakest link — auth AdminApiSecurityConfig가 SYSTEM_ADMIN 계정 생성을 201로 수락해야 함').toBe(
      201,
    );

    await expect(page.getByRole('heading', { name: '계정이 생성되었습니다' })).toBeVisible();
    await expect(page.getByText(EVENT_ADMIN_EMAIL)).toBeVisible();
    await shot(page, 'ADM-11-accounts-create-success');

    // 목록 복귀 — 신규 계정이 즉시 반영되는지(React Query invalidate)
    // name 미입력 계정은 이메일이 제목(strong)·부제(email·role) 양쪽에 나타나 getByText가 모호해진다 —
    // li 카드 단위로 좁혀 단일 요소로 특정한다.
    await page.getByRole('link', { name: '목록으로' }).click();
    await expect(page).toHaveURL(/\/accounts$/);
    await expect(page.locator('li', { hasText: EVENT_ADMIN_EMAIL })).toBeVisible();
    await shot(page, 'ADM-11-accounts-list-after-create');

    // (staff) 게이트 회귀(3번째 테스트)용 EVENT_STAFF 계정을 같은 SYSTEM_ADMIN 세션에서 미리
    // 발급한다 — 폼 role 디폴트가 이미 EVENT_STAFF라 role select 조작이 불요하다.
    await page.getByRole('link', { name: '+ 계정 추가' }).click();
    await expect(page).toHaveURL(/\/accounts\/new$/);
    await page.locator('input[name="email"]').fill(EVENT_STAFF_EMAIL);
    await page.locator('input[name="password"]').fill(EVENT_STAFF_PASSWORD);
    await page.locator(`input[type="checkbox"][value="${EID}"]`).check();
    await page.getByRole('button', { name: '계정 만들기' }).click();
    await expect(page.getByRole('heading', { name: '계정이 생성되었습니다' })).toBeVisible();
    await expect(page.getByText(EVENT_STAFF_EMAIL)).toBeVisible();
    await page.getByRole('link', { name: '목록으로' }).click();
    await expect(page).toHaveURL(/\/accounts$/);

    // 반응형 뷰포트 — mobile(375x812)에서도 라이트·오버플로 0·다크 누출 없음(목록 화면 기준)
    await page.setViewportSize({ width: 375, height: 812 });
    await assertNoOverflowNoDarkLeak(page);
    await shot(page, 'ADM-11-accounts-list-mobile');
  });

  test('[TC-ACC-06 재검증] EVENT_ADMIN 세션 — /accounts 접근이 /forbidden에서 안정 종결(무한 루프 재현 안 됨)', async ({
    page,
  }) => {
    // 로그인 성공 자체로 계정이 정상 동작함을 재확인(직전 테스트에서 생성한 실 계정) — (console)
    // 상위 게이트(ADMIN_ROLES)는 EVENT_ADMIN을 통과시키므로 /events 도달이 곧 콘솔 게이트 회귀 확인.
    await login(page, EVENT_ADMIN_EMAIL, EVENT_ADMIN_PASSWORD);

    // 상위 콘솔 게이트(ADMIN_ROLES)는 통과하지만, 중첩 accounts 게이트(SYSTEM_ADMIN_ROLES)가
    // 렌더 전 서버 단계에서 차단해야 한다 — v1은 여기서 net::ERR_TOO_MANY_REDIRECTS로 throw했다
    // (무한 루프). v2는 page.goto가 정상적으로 resolve되고 /forbidden에서 멈춰야 한다.
    await page.goto('/accounts');
    await expect(page, 'v1 무한 루프 재발 시 이 시점에 도달하지 못하거나 /accounts에 머무름').toHaveURL(/\/forbidden$/);
    await expect(page.getByRole('heading', { name: '접근 권한이 없습니다' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '계정 관리' })).toHaveCount(0);
    await shot(page, 'ADM-11-event-admin-forbidden-desktop');

    // 반응형 뷰포트 — /forbidden도 mobile(375x812)에서 오버플로·다크 누출 없이 렌더되는지 확인.
    // /forbidden은 (console) 라이트 스코프 밖(전역 다크 상속)이라 assertNoOverflowNoDarkLeak의
    // "라이트 wrapper 배경" 전제가 적용되지 않는다 — 오버플로만 별도로 확인한다.
    await page.setViewportSize({ width: 375, height: 812 });
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth, '/forbidden 모바일 가로 오버플로 0').toBeLessThanOrEqual(overflow.clientWidth);
    await shot(page, 'ADM-11-event-admin-forbidden-mobile');
  });

  test('[정상 경로 회귀] EVENT_STAFF 세션 — (staff) 게이트(공유 프리미티브 소비자) 회귀 확인', async ({ page }) => {
    // 미인증 접근 — 공유 프리미티브(resolveGateOutcome)가 UNAUTHENTICATED로 판정해 실제
    // 로그인 화면까지 안정적으로 리다이렉트되는지 확인(루프·오류 없음). 이 시점 page는 아직
    // 어떤 세션도 없는 완전히 새 브라우저 컨텍스트(Playwright test별 격리)다.
    await page.goto('/staff');
    await expect(page.locator('input[name="username"]'), '미인증 /staff 접근이 로그인 화면으로 도달해야 함').toBeVisible();

    // 인증 + STAFF_ROLES 충족(EVENT_STAFF) — 직전 테스트에서 생성한 실 계정으로 로그인 후
    // returnTo=/staff로 정상 진입해야 한다(공유 게이트 프리미티브가 staff 소비자에서도 회귀 없음).
    await login(page, EVENT_STAFF_EMAIL, EVENT_STAFF_PASSWORD, '/staff');
    await expect(page).toHaveURL(/\/staff$/);
    await shot(page, 'ADM-11-staff-gate-regression-desktop');
  });
});

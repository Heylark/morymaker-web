import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * REQ-0045 — auth 세션 생명주기 E2E(설계 §5 V13·V8-b).
 *
 * 데이터: 기존 회귀 픽스처 계정 재사용(REQ-0018-06/-07). V13은 SYSTEM_ADMIN,
 * V8-b는 EVENT_ADMIN을 사용해 파일 내 두 테스트가 병렬 실행돼도 같은 계정으로 동시 로그인해
 * SAS SessionRegistry sid 대조가 서로를 걷어차는 경합을 피한다(아래 "환경 노트" 참조).
 */

const SYSTEM_ADMIN_EMAIL = 'dev-verify@morymaker.local';
const SYSTEM_ADMIN_PASSWORD = 'DevPassw0rd!';
const EVENT_ADMIN_EMAIL = 'req0018-06-tester-event-admin@morymaker.local';
const EVENT_ADMIN_PASSWORD = 'TesterPassw0rd1!';

async function login(page: Page, username: string, password: string, entryPath: string) {
  await page.goto(entryPath);
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**${entryPath}`);
}

test.describe('REQ-0045 — 로그아웃→재로그인 접합 사이클 (V13)', () => {
  test('로그아웃 후 다시 로그인하면 auth 로그인 폼이 실제로 노출되고, 폼 통과 후 콘솔에 착지한다', async ({ page }) => {
    await login(page, SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD, '/events');

    const sidebar = page.getByRole('complementary', { name: '콘솔 사이드바' });
    await sidebar.getByRole('button', { name: '로그아웃' }).click();
    await page.waitForURL(/\/app\/logged-out$/);
    await expect(page.getByRole('heading', { name: '로그아웃되었습니다' })).toBeVisible();

    // ★ 핵심 단언 1 — 로그아웃 후 재진입이 IdP 세션을 재인정해 폼 없이 통과(무마찰 재로그인)하면
    // 안 된다. §2·§3 어느 한쪽이라도 빠지면 이 시점에 auth가 곧바로 콘솔로 튕겨 아래 입력 필드
    // 단언이 타임아웃으로 실패한다(REQ의 성공 기준 그 자체).
    await page.getByRole('link', { name: '다시 로그인' }).click();
    await expect(page).toHaveURL(/localhost:30000\/login/);
    await expect(page.locator('input[name="username"]'), '로그아웃 후 재진입은 로그인 폼을 실제로 렌더해야 함(무마찰 통과 0건)').toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // ★ 핵심 단언 2 — 폼 제출 후 콘솔(웹)로 정상 착지한다(회귀 없음).
    await page.locator('input[name="username"]').fill(SYSTEM_ADMIN_EMAIL);
    await page.locator('input[name="password"]').fill(SYSTEM_ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/landing');
    await expect(page).toHaveURL(/\/app\/landing$/);
  });
});

test.describe('REQ-0045 — 프록시 회전 → 로그아웃 합성 사이클 (V8-b)', () => {
  test('만료된 access 쿠키로 프록시를 1회 호출(proactive refresh 강제)한 뒤 로그아웃해도 auth를 경유해 정상 종료된다', async ({
    page,
  }) => {
    await login(page, EVENT_ADMIN_EMAIL, EVENT_ADMIN_PASSWORD, '/events');

    // exp=1(과거) — isTokenExpired가 malformed/과거 클레임을 즉시 만료로 판정(fail-closed,
    // 30분 실대기 불요 — 02-architect.md §5 "V8-b 실행 가능성 근거" 참조).
    const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ exp: 1, roles: ['EVENT_ADMIN'] })).toString('base64url');
    const expiredAccessToken = `${header}.${body}.sig`;

    await page.context().addCookies([
      {
        name: 'mm_access_token',
        value: expiredAccessToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
      },
    ]);

    // PRIVATE 프록시 1회 호출 — proactive refresh를 강제해 mm_access_token·mm_refresh_token·
    // mm_id_token 3종이 회전되게 만든다(§3-1). 응답 자체의 성공 여부보다 회전이 목적이므로
    // status는 단언하지 않는다(만료 role 토큰이라도 refresh는 별도로 성공해야 정상).
    await page.request.get('/app/api/proxy/api/events');

    const cookiesAfterRefresh = await page.context().cookies();
    const idTokenAfterRefresh = cookiesAfterRefresh.find((c) => c.name === 'mm_id_token');
    expect(idTokenAfterRefresh, '프록시 1회 호출 후 mm_id_token이 회전돼 존재해야 함(§3-1 회전 유실 시 부재)').toBeTruthy();

    // 리다이렉트 체인에 auth origin이 실제로 등장하는지 응답(3xx 포함)을 전량 수집한다.
    // framenavigated는 서버 리다이렉트 체인의 중간 hop을 별도 committed navigation으로
    // 보고하지 않아(최종 목적지만 잡힘 — 실측) 응답 레벨에서 추적한다.
    const visitedOrigins: string[] = [];
    page.on('response', (response) => {
      try {
        visitedOrigins.push(new URL(response.url()).origin);
      } catch {
        // 무시
      }
    });

    const sidebar = page.getByRole('complementary', { name: '콘솔 사이드바' });
    await sidebar.getByRole('button', { name: '로그아웃' }).click();
    await page.waitForURL(/\/app\/logged-out$/);

    // ★ 핵심 단언 — 회전된(새) id_token으로 로그아웃했으므로 auth가 옛 hint로 거부(400)하지
    // 않고 실제로 /connect/logout(auth origin)을 경유해야 한다. 회전이 유실됐다면 auth가
    // 400을 반환해 착지가 auth 에러 페이지에서 멈추고, 위 waitForURL 자체가 타임아웃한다.
    expect(visitedOrigins, 'auth(localhost:30000) origin이 리다이렉트 체인에 등장해야 함').toContain(
      'http://localhost:30000',
    );
    await expect(page.getByRole('heading', { name: '로그아웃되었습니다' })).toBeVisible();

    const cookiesAfterLogout = await page.context().cookies();
    const mmCookiesAfter = cookiesAfterLogout.filter((c) => c.name.startsWith('mm_'));
    expect(mmCookiesAfter.map((c) => c.name), '로그아웃 후 mm_ 쿠키는 전량 삭제돼야 함').toEqual([]);
  });
});

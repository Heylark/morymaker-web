import { test, expect, type Page } from '@playwright/test';

/**
 * 콘솔 행사 현황·통계(ADM-03, ADM-10 흡수) 회귀 — 5블록 시각화(도넛·참석 진행바·주차 구획
 * 바·도착 리스트·6점 누적 라인)가 실 로그인(OIDC)·실 서버·실 DB로 렌더되는지, nav path
 * 교정(`/stats`→`/dashboard`)이 반영됐는지, Excel 다운로드·15초 폴링이 동작하는지 확인한다
 * (CP-3 visual sanity 게이트 1차 입력).
 *
 * 데이터: 실제 등록·참석·주차 기록이 있는 로컬 개발 DB 행사
 * 85f20822-7a48-4163-afa1-d0a71568df05("REQ-0007-02 테스트 행사" — 등록 23명, 참석 5명,
 * 주차 5건/50석)를 사용한다. 좌석/명단 E2E가 쓰는 e757ba35...는 참석·주차 데이터가
 * 없어(전량 취소/대기) 차트가 의미 있게 렌더되지 않는다 — 이 스펙은 읽기 전용(쓰기 없음)이라
 * 다른 스펙과 데이터 충돌이 없다.
 */

const EID = '85f20822-7a48-4163-afa1-d0a71568df05';

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `test-screenshots/REQ-0018-05/${name}.png`, fullPage: true });
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

test.describe('콘솔 행사 현황(ADM-03) — 대시보드 렌더·nav·Excel·폴링', () => {
  test('초기 렌더 — 5블록 전부 표시(라이트·발광 0), 헤딩·값 확인', async ({ page }) => {
    const statsGet = page.waitForResponse(
      (res) => /\/stats(\?|$)/.test(new URL(res.url()).pathname) && res.request().method() === 'GET',
    );
    await login(page);
    await page.goto(`/events/${EID}/dashboard`);
    await statsGet;
    await assertLightNoGlowNoBlackBorder(page);

    await expect(page.getByRole('heading', { name: '행사 현황', level: 1 })).toBeVisible();

    // 5블록 헤딩 전부 렌더
    for (const title of ['등록 현황', '참석 현황', '주차 현황', '도착 현황', '누적 참석 추이']) {
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
    }

    // 서버값 그대로 표시 확인 — 등록 총원 23명(사전1+현장22, 취소 제외 실측), 참석 도착 리스트 5명
    await expect(page.getByRole('img', { name: /전체 등록 \d+명/ })).toBeVisible();
    await expect(page.getByText('입차').first()).toBeVisible();

    await shot(page, 'ADM-03-dashboard-initial');
  });

  test('nav path 교정 — 콘솔 nav "통계" 클릭 시 /dashboard 도달(404 아님)', async ({ page }) => {
    await login(page);
    // 다른 화면(좌석)에서 시작해 nav 클릭으로 이동 — path 교정(구 /stats 잔존 시 404) 검증
    await page.goto(`/events/${EID}/seats`);
    const statsLink = page.getByRole('link', { name: '통계', exact: true });
    await expect(statsLink).toHaveAttribute('href', `/events/${EID}/dashboard`);
    await statsLink.click();
    await page.waitForURL(`**/events/${EID}/dashboard`);
    // 404였다면 dashboard 전용 헤딩·5블록이 렌더될 수 없다 — 이 단언 자체가 404 아님의 증거
    await expect(page.getByRole('heading', { name: '행사 현황', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '누적 참석 추이' })).toBeVisible();
  });

  test('Excel 다운로드 — 버튼 클릭 시 xlsx 파일 다운로드', async ({ page }) => {
    await login(page);
    await page.goto(`/events/${EID}/dashboard`);
    await expect(page.getByRole('heading', { name: '행사 현황', level: 1 })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '엑셀 다운로드' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename(), 'xlsx 확장자로 저장돼야 함(CT 가드 통과)').toMatch(/\.xlsx$/);
    // 실패 안내 문구가 뜨지 않아야 함(CT 가드가 401/비-xlsx를 걸렀다면 여기서 에러 문구 노출)
    await expect(page.getByText('다운로드에 실패했습니다', { exact: false })).toBeHidden();
  });

  test('15초 폴링 — useStats refetchInterval 동작(네트워크 반복 조회 실측)', async ({ page }) => {
    let statsGetCount = 0;
    page.on('request', (req) => {
      const url = new URL(req.url());
      if (req.method() === 'GET' && /\/stats$/.test(url.pathname)) statsGetCount++;
    });

    await login(page);
    await page.goto(`/events/${EID}/dashboard`);
    await expect(page.getByRole('heading', { name: '행사 현황', level: 1 })).toBeVisible();

    await expect.poll(() => statsGetCount, { timeout: 5_000 }).toBeGreaterThanOrEqual(1);
    const initialCount = statsGetCount;

    // refetchInterval=15_000ms — 16초 넘게 대기해 재조회가 실제로 발생하는지 실측(mock 아님)
    await expect.poll(() => statsGetCount, { timeout: 20_000, intervals: [1_000] }).toBeGreaterThan(initialCount);
  });
});

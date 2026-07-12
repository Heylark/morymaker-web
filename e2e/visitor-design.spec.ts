import { test, expect, type Page } from '@playwright/test';
import type {
  OnsiteForm,
  OnsiteRegisterResult,
  PublicHub,
  PublicSlotView,
  RecordRegisterResult,
} from '@/types/visitor';

/**
 * REQ-0022-03 방문자 표면(VIS-00~03) 다크 시그니처 DEV-SANITY 스크린샷 캡처.
 *
 * 실 backend 없이 `page.route()`로 `/api/proxy/api/public/**` 응답을 mock한다 — 이 REQ는
 * 스타일 전용(마크업·동작 로직 불변)이라 API 계약 검증이 목적이 아니라 각 화면·상태가
 * scenes 목업(`ui-kit/scenes/vis*.html`) 대비 어떤 톤으로 렌더되는지를 사람이 눈으로
 * 대조(Manager CP-3 DEV-SANITY)할 수 있는 스크린샷을 남기는 것이 목적이다.
 *
 * VIS-03(완료 화면)은 등록 API 응답이 아니라 sessionStorage에 저장된 결과를 읽어 렌더하므로
 * (CompleteView/ParkCompleteView 소스 참조) `page.addInitScript`로 값을 먼저 심고 이동한다.
 */

const HUB_TOKEN = 'e2e-hub-token-001';

const hubFixture: PublicHub = {
  guest: { name: '김도윤', org: '모리메이커', title: '대표', seatLabel: 'A-12', plate: null, status: '대기' },
  event: {
    name: '2026 VIP 초청 행사',
    place: '그랜드볼룸 3층',
    eventDate: '2026-07-20T10:00:00Z',
    bgColor: null,
    pointColor: null,
  },
  checkinQr: { url: 'https://morymaker.example.com/u/e2e-hub-token-001', token: HUB_TOKEN },
  prereg: { plateRegistered: false, plate: null },
  parkingEntry: { scanUrl: 'https://morymaker.example.com/p/z1-01' },
};

const slotNormalFixture: PublicSlotView = {
  slot: { slotCode: 'z1-01', slotSig: 'sig-1', display: '지하 2층 A구역 8' },
  viewType: 'SELF_PARK_FORM',
  occupied: false,
  event: { name: '2026 VIP 초청 행사', bgColor: null, pointColor: null },
};

const slotOccupiedFixture: PublicSlotView = {
  slot: { slotCode: 'z1-02', slotSig: 'sig-2', display: '지하 2층 A구역 9' },
  viewType: 'OCCUPIED_NOTICE',
  occupied: true,
  event: { name: '2026 VIP 초청 행사', bgColor: null, pointColor: null },
};

const onsiteFormFixture: OnsiteForm = {
  event: { name: '2026 VIP 초청 행사', bgColor: null, pointColor: null },
};

const onsiteCompleteFixture: OnsiteRegisterResult = {
  guestId: 'guest-e2e-001',
  token: HUB_TOKEN,
  checkinQr: { url: 'https://morymaker.example.com/u/e2e-hub-token-001', token: HUB_TOKEN },
  message: '현장등록이 완료되었습니다',
};

const parkCompleteFixture: RecordRegisterResult = {
  result: 'PARKED',
  record: {
    id: 'rec-e2e-001',
    zoneId: 'z1',
    slotSig: 'sig-1',
    slotDisplay: '지하 2층 A구역 8',
    plate: '12가3456',
    phone: null,
    vipName: null,
    guestId: null,
    registeredBy: 'VISITOR',
    registeredAt: '2026-07-12T10:00:00Z',
    status: 'PARKED',
    reviewNeeded: false,
  },
  mapping: null,
  supersededRecord: null,
  message: null,
};

const MOBILE_VIEWPORT = { width: 375, height: 812 };

function errorBody(code: string) {
  return { error: { code, message: code } };
}

async function mockJson(page: Page, urlGlob: string, status: number, body: unknown) {
  await page.route(urlGlob, (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }),
  );
}

// ── VIS-00 개인허브 ───────────────────────────────────────────────────────────

test('VIS-00 개인허브 — 정상 데이터', async ({ page }) => {
  await mockJson(page, `**/api/proxy/api/public/u/${HUB_TOKEN}`, 200, { data: hubFixture });

  await page.goto(`/u/${HUB_TOKEN}`);
  await expect(page.getByText('김도윤')).toBeVisible();
  await page.screenshot({ path: 'test-screenshots/req-0022-03-vis00-hub-desktop.png', fullPage: true });

  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.screenshot({ path: 'test-screenshots/req-0022-03-vis00-hub-mobile.png', fullPage: true });
});

test('VIS-00 개인허브 — 무효 링크(404)', async ({ page }) => {
  await mockJson(page, '**/api/proxy/api/public/u/invalid-token', 404, errorBody('NOT_FOUND'));

  await page.goto('/u/invalid-token');
  // TanStack Query 기본 retry(3회, 지수 백오프 최대 ~7초)가 settle될 때까지 대기 — 이 REQ가
  // 도입한 컴포넌트 변경이 아니라 useHub 등 방문자 hook의 기존(변경 없음) 동작.
  await expect(page.getByText('유효하지 않은 링크입니다')).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: 'test-screenshots/req-0022-03-vis00-hub-invalid-desktop.png', fullPage: true });
});

// ── VIS-01 주차 셀프폼(4상태) ─────────────────────────────────────────────────

test('VIS-01 주차 셀프폼 — ①정상폼', async ({ page }) => {
  await mockJson(page, '**/api/proxy/api/public/p/z1-01', 200, { data: slotNormalFixture });

  await page.goto('/p/z1-01');
  await expect(page.getByText('지하 2층 A구역 8')).toBeVisible();
  await page.screenshot({
    path: 'test-screenshots/req-0022-03-vis01-parking-form-normal-desktop.png',
    fullPage: true,
  });

  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.screenshot({
    path: 'test-screenshots/req-0022-03-vis01-parking-form-normal-mobile.png',
    fullPage: true,
  });
});

test('VIS-01 주차 셀프폼 — ②주차중 안내 / ③승계확인', async ({ page }) => {
  await mockJson(page, '**/api/proxy/api/public/p/z1-02', 200, { data: slotOccupiedFixture });

  await page.goto('/p/z1-02');
  await expect(page.getByText('이미 주차 기록이 있는 자리입니다')).toBeVisible();
  await page.screenshot({
    path: 'test-screenshots/req-0022-03-vis01-parking-form-occupied-notice-desktop.png',
    fullPage: true,
  });

  await page.getByRole('button', { name: '그래도 제 차 등록' }).click();
  await expect(page.getByText('지하 2층 A구역 9')).toBeVisible();
  await page.screenshot({
    path: 'test-screenshots/req-0022-03-vis01-parking-form-occupied-confirmed-desktop.png',
    fullPage: true,
  });
});

test('VIS-01 주차 셀프폼 — ④무효 자리(404)', async ({ page }) => {
  await mockJson(page, '**/api/proxy/api/public/p/invalid-slot', 404, errorBody('NOT_FOUND'));

  await page.goto('/p/invalid-slot');
  // TanStack Query 기본 retry(3회, 지수 백오프 최대 ~7초) settle 대기 — 위와 동일 사유.
  await expect(page.getByText('유효하지 않은 자리입니다')).toBeVisible({ timeout: 15000 });
  await page.screenshot({
    path: 'test-screenshots/req-0022-03-vis01-parking-form-invalid-desktop.png',
    fullPage: true,
  });
});

test('VIS-01 주차 셀프폼 — 일시 오류(재시도 안내)', async ({ page }) => {
  await mockJson(page, '**/api/proxy/api/public/p/retry-slot', 500, errorBody('INTERNAL_ERROR'));

  await page.goto('/p/retry-slot');
  // TanStack Query 기본 retry(3회, 지수 백오프 최대 ~7초) settle 대기 — 위와 동일 사유.
  await expect(page.getByText('잠시 후 다시 시도해 주세요')).toBeVisible({ timeout: 15000 });
  await page.screenshot({
    path: 'test-screenshots/req-0022-03-vis01-parking-form-retry-desktop.png',
    fullPage: true,
  });
});

// ── VIS-02 현장등록 ───────────────────────────────────────────────────────────

test('VIS-02 현장등록 — 정상 폼', async ({ page }) => {
  await mockJson(page, '**/api/proxy/api/public/r/demo-event', 200, { data: onsiteFormFixture });

  await page.goto('/r/demo-event');
  await expect(page.getByText('2026 VIP 초청 행사')).toBeVisible();
  await page.screenshot({ path: 'test-screenshots/req-0022-03-vis02-onsite-desktop.png', fullPage: true });

  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.screenshot({ path: 'test-screenshots/req-0022-03-vis02-onsite-mobile.png', fullPage: true });
});

test('VIS-02 현장등록 — 종료된 행사(409)', async ({ page }) => {
  await mockJson(page, '**/api/proxy/api/public/r/closed-event', 409, errorBody('EVENT_CLOSED'));

  await page.goto('/r/closed-event');
  // TanStack Query 기본 retry(3회, 지수 백오프 최대 ~7초) settle 대기 — 위와 동일 사유.
  await expect(page.getByText('종료된 행사입니다')).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: 'test-screenshots/req-0022-03-vis02-onsite-closed-desktop.png', fullPage: true });
});

// ── VIS-03 완료(2종) ──────────────────────────────────────────────────────────

test('VIS-03 완료 — 현장등록완료(QR T1 발광)', async ({ page }) => {
  const eventCode = 'demo-event';
  await page.addInitScript(
    ([key, value]) => sessionStorage.setItem(key, value),
    [`visitor:onsite-done:${eventCode}`, JSON.stringify(onsiteCompleteFixture)],
  );

  await page.goto(`/r/${eventCode}/done`);
  await expect(page.getByText('현장등록이 완료되었습니다')).toBeVisible();
  await page.screenshot({
    path: 'test-screenshots/req-0022-03-vis03-complete-onsite-desktop.png',
    fullPage: true,
  });

  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.screenshot({
    path: 'test-screenshots/req-0022-03-vis03-complete-onsite-mobile.png',
    fullPage: true,
  });
});

test('VIS-03 완료 — 주차완료(위치 T2 발광)', async ({ page }) => {
  const slotCode = 'z1-01';
  await page.addInitScript(
    ([key, value]) => sessionStorage.setItem(key, value),
    [`visitor:park-done:${slotCode}`, JSON.stringify(parkCompleteFixture)],
  );

  await page.goto(`/p/${slotCode}/done`);
  await expect(page.getByText('지하 2층 A구역 8')).toBeVisible();
  await page.screenshot({ path: 'test-screenshots/req-0022-03-vis03-complete-park-desktop.png', fullPage: true });

  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.screenshot({ path: 'test-screenshots/req-0022-03-vis03-complete-park-mobile.png', fullPage: true });
});

test('VIS-03 완료 — 주차완료 위치 텍스트가 실제로 읽힌다(회귀 가드)', async ({ page }) => {
  // 이 REQ 발견 결함 재현 TC — ParkCompleteView.tsx의 위치 텍스트가 Tailwind
  // `[background:var(--gold-grad)] bg-clip-text text-transparent` 조합에서
  // `background-clip: text`가 `border-box`로 되돌아가(shorthand `background`
  // 유틸리티가 별도 규칙으로 분리 생성되어 later-wins), 텍스트가 완전히 불투명한
  // 금색 사각형에 가려 읽을 수 없다(색상은 정상 transparent, 배경은 정상 gradient
  // — background-clip만 어긋남). 04-test-result.md TC-VIS03-T2 참조.
  const slotCode = 'z1-01';
  await page.addInitScript(
    ([key, value]) => sessionStorage.setItem(key, value),
    [`visitor:park-done:${slotCode}`, JSON.stringify(parkCompleteFixture)],
  );
  await page.goto(`/p/${slotCode}/done`);
  await expect(page.getByText('지하 2층 A구역 8')).toBeVisible();

  const backgroundClip = await page.evaluate(() => {
    const el = [...document.querySelectorAll('p')].find((p) => p.textContent?.includes('지하 2층'));
    return el ? getComputedStyle(el).getPropertyValue('background-clip') : null;
  });
  await page.screenshot({ path: 'test-screenshots/req-0022-03-vis03-complete-park-t2-defect.png', fullPage: true });

  expect(backgroundClip, 'background-clip이 text가 아니면 위치 텍스트가 금색 사각형에 가려 불가독').toBe('text');
});

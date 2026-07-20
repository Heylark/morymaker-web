import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { IDLE_CYCLE_INTERVAL_MS } from '@/lib/kiosk/constants';

/**
 * 대기화면 다건 순환 + 키오스크 브랜딩 소비 전용 스펙 — IdlePlayer 다건 순환(video onEnded /
 * 이미지 고정 간격 / 영상 실패 강제전환) + 키오스크 브랜딩 액센트 소비(color-mix 파생·안전
 * 퇴화·fail-closed). 0개/1개 항목 시나리오는 `kiosk-idle-media.spec.ts`가 이미 커버(회귀 대상,
 * 이 스펙에서 중복 작성하지 않는다) — 여기서는 새로 도입된 다건 순환·브랜딩 소비 축만 다룬다.
 *
 * idle-contents·branding 목록·미디어 파일 자체를 page.route로 모의해 실 DB·실 backend를
 * 건드리지 않는다(kiosk-idle-media.spec.ts와 동일 방식). 타이머 전환(8초)은 실시간 대기 대신
 * Playwright Clock API로 가상 시간을 흘려 결정적으로 검증한다.
 */

const EID = '11111111-2222-4333-8444-555555555555'; // 순수 모의 전용 — 실 시드 이벤트 아님
const FILE_A = 'http://localhost:30100/api/public/events/fake/idle-contents/file-a';
const FILE_B = 'http://localhost:30100/api/public/events/fake/idle-contents/file-b';

const BRANDED_POINT_COLOR = '#B04A5A'; // 디자인 규약 정본 예시(버건디) — visitor-design.spec.ts와 동일 상수
// 시스템 기본 골드(다크 테마) — src/app/globals.css --gold-grad 다크 변주를 브라우저가 계산한 rgb 값.
const DEFAULT_GOLD_GRADIENT =
  'linear-gradient(135deg, rgb(240, 220, 168) 0%, rgb(212, 179, 106) 45%, rgb(156, 124, 60) 100%)';

const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const TINY_PNG_BUFFER = Buffer.from(TINY_PNG_BASE64, 'base64');

// 2×2 h264/mp4, 5초 길이(ffmpeg 생성) — 실제로 디코드 가능한 유효 mp4라야 한다. 빈 버퍼(0바이트)를
// video/mp4로 응답하면 Chromium이 곧바로 네이티브 디코드 에러(error 이벤트)를 real wall-clock 기준
// 비결정적 시점에 발화시켜(테스트가 매는 page.clock 가상 시간과 무관) `<video>` 엘리먼트가 폴백
// 텍스트로 조용히 대체되는 레이스가 난다 — kiosk-idle-media.spec.ts의 동일 video 테스트를 순환
// 리팩터 이전 IdlePlayer로 되돌려도 동일하게 재현된다(리팩터 이전에도 동일 실패 = 이 변경의
// 회귀 아님). "재생 중엔 타이머 무시" 등 재생 지속을 전제하는 단언은 유효 mp4가 아니면 성립 불가.
const TINY_MP4_BASE64 =
  'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAOzbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAE4gAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAt10cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAE4gAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAIAAAACAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAABOIAABAAAABAAAAAAJVbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAABAAAABQABVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACAG1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAcBzdGJsAAAAwHN0c2QAAAAAAAAAAQAAALBhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAIAAgBIAAAASAAAAAAAAAABFUxhdmM2Mi4yOC4xMDIgbGlieDI2NAAAAAAAAAAAAAAAGP//AAAANmF2Y0MBZAAK/+EAGWdkAAqs2V+IiMBEAAADAAQAAAMAEDxIllgBAAZo6+PLIsD9+PgAAAAAEHBhc3AAAAABAAAAAQAAABRidHJ0AAAAAAAABTEAAAAAAAAAGHN0dHMAAAAAAAAAAQAAAAoAACAAAAAAFHN0c3MAAAAAAAAAAQAAAAEAAABgY3R0cwAAAAAAAAAKAAAAAQAAQAAAAAABAACgAAAAAAEAAEAAAAAAAQAAAAAAAAABAAAgAAAAAAEAAKAAAAAAAQAAQAAAAAABAAAAAAAAAAEAACAAAAAAAQAAQAAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAoAAAABAAAAPHN0c3oAAAAAAAAAAAAAAAoAAALFAAAADAAAAAwAAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAAFHN0Y28AAAAAAAAAAQAAA+MAAABidWR0YQAAAFptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAC1pbHN0AAAAJal0b28AAAAdZGF0YQAAAAEAAAAATGF2ZjYyLjEyLjEwMgAAAAhmcmVlAAADR21kYXQAAAKtBgX//6ncRem95tlIt5Ys2CDZI+7veDI2NCAtIGNvcmUgMTY1IHIzMjIyIGIzNTYwNWEgLSBILjI2NC9NUEVHLTQgQVZDIGNvZGVjIC0gQ29weWxlZnQgMjAwMy0yMDI1IC0gaHR0cDovL3d3dy52aWRlb2xhbi5vcmcveDI2NC5odG1sIC0gb3B0aW9uczogY2FiYWM9MSByZWY9MyBkZWJsb2NrPTE6MDowIGFuYWx5c2U9MHgzOjB4MTEzIG1lPWhleCBzdWJtZT03IHBzeT0xIHBzeV9yZD0xLjAwOjAuMDAgbWl4ZWRfcmVmPTEgbWVfcmFuZ2U9MTYgY2hyb21hX21lPTEgdHJlbGxpcz0xIDh4OGRjdD0xIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJvbWFfcXBfb2Zmc2V0PS0yIHRocmVhZHM9MSBsb29rYWhlYWRfdGhyZWFkcz0xIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTMgYl9weXJhbWlkPTIgYl9hZGFwdD0xIGJfYmlhcz0wIGRpcmVjdD0xIHdlaWdodGI9MSBvcGVuX2dvcD0wIHdlaWdodHA9MiBrZXlpbnQ9MjUwIGtleWludF9taW49MiBzY2VuZWN1dD00MCBpbnRyYV9yZWZyZXNoPTAgcmNfbG9va2FoZWFkPTQwIHJjPWNyZiBtYnRyZWU9MSBjcmY9MjMuMCBxY29tcD0wLjYwIHFwbWluPTAgcXBtYXg9NjkgcXBzdGVwPTQgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAABBliIQAFv/+99M/zLLsmiWBAAAACEGaJGxBX/7wAAAACEGeQniCn5eBAAAACAGeYXRBL6GAAAAACAGeY2pBL6GBAAAADkGaaEmoQWiZTAgp//7xAAAACkGehkURLBT/l4EAAAAIAZ6ldEEvoYEAAAAIAZ6nakEvoYAAAAAOQZqpSahBbJlMCCX//uA=';
const TINY_MP4_BUFFER = Buffer.from(TINY_MP4_BASE64, 'base64');

function errorBody(code: string) {
  return { error: { code, message: code } };
}

function videoItem(id: string, fileUrl: string, name: string): Record<string, unknown> {
  return { id, name, kind: '영상', mode: 'branded', play: '자동재생', fileUrl, sortOrder: 1 };
}

function imageItem(id: string, fileUrl: string, name: string): Record<string, unknown> {
  return { id, name, kind: '이미지', mode: 'branded', play: '자동재생', fileUrl, sortOrder: 1 };
}

async function mockIdleList(page: Page, items: Record<string, unknown>[]) {
  await page.route(`**/api/proxy/api/public/events/${EID}/idle-contents`, async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: items }) });
  });
}

async function mockBranding(page: Page, status: number, body: unknown) {
  await page.route(`**/api/proxy/api/public/events/${EID}/branding`, async (route) => {
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

async function mockVideo(page: Page, url: string) {
  await page.route(url, async (route) => {
    await route.fulfill({ status: 200, contentType: 'video/mp4', body: TINY_MP4_BUFFER });
  });
}

async function mockImage(page: Page, url: string) {
  await page.route(url, async (route) => {
    await route.fulfill({ status: 200, contentType: 'image/png', body: TINY_PNG_BUFFER });
  });
}

async function mockVideoFail(page: Page, url: string) {
  await page.route(url, async (route) => {
    await route.fulfill({ status: 404, body: 'not found' });
  });
}

/** IdlePlayer 폴백 워드마크(.text-transparent 그라데이션 클립)의 계산된 배경. */
async function wordmarkStyle(page: Page) {
  return page.evaluate(() => {
    const el = document.querySelector('p.text-transparent') as HTMLElement | null;
    return el ? { backgroundImage: getComputedStyle(el).backgroundImage } : null;
  });
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `test-screenshots/REQ-0033-02/${name}.png`, fullPage: true });
}

test.describe('키오스크 대기화면 — 다건 콘텐츠 순환 (설계 6상황 계약표)', () => {
  test('항목 N개(영상) — 재생 중엔 타이머 무시하고 onEnded 발화 시에만 다음 항목', async ({ page }) => {
    await page.clock.install();
    await mockIdleList(page, [videoItem('v1', FILE_A, '첫번째 영상'), imageItem('i2', FILE_B, '두번째 이미지')]);
    await mockBranding(page, 200, { data: { pointColor: null, defaultIdleMode: null } });
    await mockVideo(page, FILE_A);
    await mockImage(page, FILE_B);

    await page.goto(`/kiosk/${EID}`);
    const video = page.locator('video');
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute('src', FILE_A);

    // 다건이라 loop가 해제돼 있어야 onEnded가 의미를 가진다.
    const loopProp = await video.evaluate((el: HTMLVideoElement) => el.loop);
    expect(loopProp, '다건 영상은 loop 해제(onEnded 대기)').toBe(false);

    // 재생 중인 영상은 타이머가 붙지 않는다 — 8초+를 흘려도 전환되면 안 된다(설계 usesTimer=false 검증).
    await page.clock.fastForward(IDLE_CYCLE_INTERVAL_MS + 5_000);
    await expect(video, '재생 중 영상은 시간 경과만으로 전환되지 않아야 함').toHaveAttribute('src', FILE_A);

    // onEnded 발화 → 다음 항목(이미지)으로 전환.
    await video.evaluate((el: HTMLVideoElement) => el.dispatchEvent(new Event('ended')));
    await expect(page.locator('img[alt="두번째 이미지"]')).toBeVisible();
    await shot(page, 'cycle-video-onended-transition');
  });

  test('항목 N개(이미지) — 8초 고정 간격 타이머로 다음 항목 전환', async ({ page }) => {
    await page.clock.install();
    await mockIdleList(page, [imageItem('i1', FILE_A, '첫째 이미지'), imageItem('i2', FILE_B, '둘째 이미지')]);
    await mockBranding(page, 200, { data: { pointColor: null, defaultIdleMode: null } });
    await mockImage(page, FILE_A);
    await mockImage(page, FILE_B);

    await page.goto(`/kiosk/${EID}`);
    await expect(page.locator('img[alt="첫째 이미지"]')).toBeVisible();

    // 타이머 발화 직전(마진 1초)에는 아직 전환되지 않아야 한다.
    await page.clock.fastForward(IDLE_CYCLE_INTERVAL_MS - 1_000);
    await expect(page.locator('img[alt="첫째 이미지"]')).toBeVisible();

    await page.clock.fastForward(1_000);
    await expect(page.locator('img[alt="둘째 이미지"]')).toBeVisible();
    await shot(page, 'cycle-image-timer-transition');
  });

  test('항목 N개(영상 로드 실패) — 폴백 텍스트 노출 후 8초 뒤 강제 전환(무한 대기 방지)', async ({ page }) => {
    await page.clock.install();
    await mockIdleList(page, [videoItem('v1', FILE_A, '깨진 영상'), imageItem('i2', FILE_B, '다음 이미지')]);
    await mockBranding(page, 200, { data: { pointColor: null, defaultIdleMode: null } });
    await mockVideoFail(page, FILE_A);
    await mockImage(page, FILE_B);

    await page.goto(`/kiosk/${EID}`);
    // onError → failed=true → showMedia=false → name 텍스트 폴백(죽은 화면 방지).
    await expect(page.getByText('깨진 영상', { exact: true })).toBeVisible();
    await expect(page.locator('video')).toHaveCount(0);

    // failed 전환으로 usesTimer가 반전(강제 타이머) — 8초 후 다음 항목으로 전환.
    await page.clock.fastForward(IDLE_CYCLE_INTERVAL_MS);
    await expect(page.locator('img[alt="다음 이미지"]')).toBeVisible();
    await shot(page, 'cycle-video-error-forced-transition');
  });
});

test.describe('키오스크 대기화면 — 행사 브랜딩 액센트', () => {
  test('저장 pointColor가 워드마크 액센트로 파생 주입된다', async ({ page }) => {
    await mockIdleList(page, []);
    await mockBranding(page, 200, { data: { pointColor: BRANDED_POINT_COLOR, defaultIdleMode: null } });

    await page.goto(`/kiosk/${EID}`);
    await expect(page.getByText('행사에 오신 것을 환영합니다')).toBeVisible();

    // 브랜딩은 useQuery로 하이드레이션 이후 도착 — 주입 완료까지 폴링.
    await expect(page.locator('[data-event-branded]')).toHaveCount(1);
    const champagne = await page.evaluate(() => {
      const el = document.querySelector('[data-event-branded]') as HTMLElement | null;
      return el ? getComputedStyle(el).getPropertyValue('--champagne').trim() : null;
    });
    expect(champagne).toBe(BRANDED_POINT_COLOR);

    await expect
      .poll(async () => (await wordmarkStyle(page))?.backgroundImage)
      .not.toBe(DEFAULT_GOLD_GRADIENT);
    await shot(page, 'branding-accent-applied');
  });

  test('color-mix 미지원 브라우저 — 주입을 생략하고 시스템 골드로 안전 퇴화', async ({ page }) => {
    await page.addInitScript(() => {
      const original = CSS.supports.bind(CSS);
      // @ts-expect-error 테스트 전용 스텁 — color-mix 지원 질의만 선택적으로 미지원 위장
      CSS.supports = (...args: Parameters<typeof CSS.supports>) => {
        if (String(args).includes('color-mix')) return false;
        return original(...args);
      };
    });
    await mockIdleList(page, []);
    await mockBranding(page, 200, { data: { pointColor: BRANDED_POINT_COLOR, defaultIdleMode: null } });

    await page.goto(`/kiosk/${EID}`);
    await expect(page.getByText('행사에 오신 것을 환영합니다')).toBeVisible();

    // canDeriveAccent 게이트가 false → BrandingScope가 래핑 자체를 생략(pass-through).
    await expect(page.locator('[data-event-branded]')).toHaveCount(0);
    const wm = await wordmarkStyle(page);
    expect(wm?.backgroundImage).toBe(DEFAULT_GOLD_GRADIENT);
    await shot(page, 'branding-colormix-unsupported-degrade');
  });

  for (const [status, label] of [
    [404, '무효 eid'],
    [409, '종료 행사'],
  ] as const) {
    test(`브랜딩 API ${status}(${label}, fail-closed) — 에러가 화면을 막지 않고 시스템 골드 유지`, async ({
      page,
    }) => {
      await mockIdleList(page, []);
      await mockBranding(page, status, errorBody(status === 404 ? 'NOT_FOUND' : 'EVENT_CLOSED'));

      await page.goto(`/kiosk/${EID}`);
      await expect(page.getByText('행사에 오신 것을 환영합니다')).toBeVisible();
      await expect(page.locator('[data-event-branded]')).toHaveCount(0);
      const wm = await wordmarkStyle(page);
      expect(wm?.backgroundImage).toBe(DEFAULT_GOLD_GRADIENT);

      // 브랜딩 에러가 흐름을 막지 않는다는 것을 메뉴 전이까지 확인해 증명한다.
      await page.getByRole('button', { name: /터치하세요/ }).click();
      await expect(page.getByRole('button', { name: /참가자/ })).toBeVisible();
    });
  }
});

// ── visual sanity 캡처 (브랜딩 색 반영 + 다건 순환 — 사용자 육안 확인용) ─────────────────────────
// 위 TC들은 1×1 투명 PNG로 기능만 검증한다 — 사람이 눈으로 판단할 스크린샷은 식별 가능한 색
// 콘텐츠(파랑→초록 64×64 PNG)로 별도 캡처해 "브랜딩 액센트 + 항목 전환"이 실제로 눈에 보이는지
// 함께 남긴다. PASS/FAIL 판정은 본 스펙이 아니라 사용자 육안 sanity 확인 몫이다.
const VISUAL_BLUE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAT0lEQVR42u3PQQkAAAgEsCtjMuNbwgi+hcEKLNXzWgQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQELguYZjFanhwbHAAAAABJRU5ErkJggg==',
  'base64',
);
const VISUAL_GREEN_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAT0lEQVR42u3PQQkAAAgEsEthKGta1Ai+hcEKLDX9WgQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQELgvTNzDxMK+3UQAAAABJRU5ErkJggg==',
  'base64',
);

test.describe('visual sanity 캡처 (육안 확인용)', () => {
  test('브랜딩 액센트 + 2건 이미지 순환 — desktop/mobile 캡처', async ({ page }) => {
    await page.clock.install();
    await mockIdleList(page, [imageItem('vs1', FILE_A, '첫 콘텐츠'), imageItem('vs2', FILE_B, '둘째 콘텐츠')]);
    await mockBranding(page, 200, { data: { pointColor: BRANDED_POINT_COLOR, defaultIdleMode: null } });
    await page.route(FILE_A, (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: VISUAL_BLUE_PNG }),
    );
    await page.route(FILE_B, (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: VISUAL_GREEN_PNG }),
    );

    await page.goto(`/kiosk/${EID}`);
    await expect(page.locator('img[alt="첫 콘텐츠"]')).toBeVisible();
    await expect(page.locator('[data-event-branded]')).toHaveCount(1); // 액센트 주입 확인(터치 안내 문구 색)
    await shot(page, 'visual-sanity-desktop-item1-branded');

    await page.clock.fastForward(IDLE_CYCLE_INTERVAL_MS);
    await expect(page.locator('img[alt="둘째 콘텐츠"]')).toBeVisible();
    await shot(page, 'visual-sanity-desktop-item2-branded');

    await page.setViewportSize({ width: 375, height: 812 });
    await shot(page, 'visual-sanity-mobile-item2-branded');
  });
});

import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * KIO-00 대기화면 실 미디어 렌더 — 이미지 표시·영상 재생·재생 실패 폴백·
 * playsInline을 결정적으로 검증한다. idle-contents 목록 GET과 미디어 파일 자체(fileUrl)를
 * page.route로 모의해 실 DB·실 파일 저장소를 건드리지 않는다(kiosk-states.spec.ts는 실 시드
 * 데이터를 쓰는 반면, 이 스펙은 이미지/영상/깨진 URL 세 상태를 결정적으로 통제해야 해서 별도
 * 파일로 분리했다 — 두 파일의 검증 축이 다르다: 상태 전이(kiosk-states) vs 미디어 렌더(본 파일)).
 *
 * 실 파일 업로드→저장→서빙 왕복 자체는 콘솔 쪽 실 라운드트립 테스트(console-branding-design.spec.ts
 * "실 파일 업로드")와 Tester DEV-SANITY 수동 확인이 담당 — 이 스펙은 KIO 소비 측 렌더 로직만 대상.
 */

const EID = '85f20822-7a48-4163-afa1-d0a71568df05'; // kiosk-states.spec.ts와 동일(실 시드 이벤트, idle-contents 목록만 이 스펙이 모의로 덮어씀)
const FAKE_FILE_URL = 'http://localhost:30100/api/public/events/fake/idle-contents/fake/file';

// 1×1 투명 PNG(유효한 magic byte) — console-branding-design.spec.ts와 동일 상수 취지.
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const TINY_PNG_BUFFER = Buffer.from(TINY_PNG_BASE64, 'base64');

async function mockIdleList(page: Page, item: Record<string, unknown>) {
  await page.route(`**/api/proxy/api/public/events/${EID}/idle-contents`, async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [item] }) });
  });
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `test-screenshots/REQ-0030-02/${name}.png`, fullPage: true });
}

test.describe('KIO-00 대기화면 — 실 미디어 렌더(이미지·영상·재생 실패 폴백)', () => {
  test('fileUrl 존재 + kind=이미지 — <img> 렌더(name 텍스트 폴백 아님)', async ({ page }) => {
    await mockIdleList(page, {
      id: 'idle-img-1',
      name: '이미지 콘텐츠',
      kind: '이미지',
      mode: 'branded',
      play: '자동재생',
      fileUrl: FAKE_FILE_URL,
      sortOrder: 1,
    });
    await page.route(FAKE_FILE_URL, async (route) => {
      await route.fulfill({ status: 200, contentType: 'image/png', body: TINY_PNG_BUFFER });
    });

    await page.goto(`/kiosk/${EID}`);
    const img = page.locator('img[alt="이미지 콘텐츠"]');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', FAKE_FILE_URL);
    // 실제로 로드 성공했는지(onError 폴백으로 새지 않았는지)는 naturalWidth로 확정한다 — img
    // 엘리먼트 존재만으로는 깨진 이미지도 DOM엔 남아있어 구분이 안 된다.
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
    await shot(page, 'KIO-00-media-image-rendered');
  });

  test('fileUrl 존재 + kind=영상 — <video autoPlay loop muted playsInline> 렌더', async ({ page }) => {
    await mockIdleList(page, {
      id: 'idle-vid-1',
      name: '영상 콘텐츠',
      kind: '영상',
      mode: 'branded',
      play: '자동재생',
      fileUrl: FAKE_FILE_URL,
      sortOrder: 1,
    });
    // 실 mp4가 아니어도 <video> 엘리먼트 자체는 렌더된다(디코드 성공 여부는 이 TC 범위 밖 —
    // 디코드 실패도 onError 대상이라 별도 테스트에서 다룸). 여기서는 속성·분기만 확인.
    await page.route(FAKE_FILE_URL, async (route) => {
      await route.fulfill({ status: 200, contentType: 'video/mp4', body: Buffer.alloc(0) });
    });

    await page.goto(`/kiosk/${EID}`);
    const video = page.locator('video');
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute('src', FAKE_FILE_URL);
    // React가 muted/playsInline을 attribute가 아닌 DOM 프로퍼티로만 반영하는 경우가 있어(HTML5
    // 스펙상 muted content attribute는 초기값에만 반영) markup attribute 대신 실제 미디어
    // 엘리먼트 프로퍼티로 확인한다 — 이게 실제 재생 동작을 좌우하는 값이다.
    const props = await video.evaluate((el: HTMLVideoElement) => ({
      autoplay: el.autoplay,
      loop: el.loop,
      muted: el.muted,
      playsInline: el.playsInline,
    }));
    expect(props.autoplay).toBe(true);
    expect(props.loop).toBe(true);
    expect(props.muted).toBe(true);
    expect(props.playsInline, 'iOS 전체화면 강제 방지').toBe(true);
    await shot(page, 'KIO-00-media-video-attrs');
  });

  test('fileUrl 존재하나 로드 실패(404) — onError 폴백으로 name 텍스트 렌더(죽은 화면 방지)', async ({
    page,
  }) => {
    await mockIdleList(page, {
      id: 'idle-broken-1',
      name: '유실된 콘텐츠',
      kind: '이미지',
      mode: 'branded',
      play: '자동재생',
      fileUrl: FAKE_FILE_URL,
      sortOrder: 1,
    });
    await page.route(FAKE_FILE_URL, async (route) => {
      await route.fulfill({ status: 404, body: 'not found' });
    });

    await page.goto(`/kiosk/${EID}`);
    // onError 발화까지 폴링 대기 — name 텍스트 폴백이 최종 렌더 상태.
    await expect(page.getByText('유실된 콘텐츠', { exact: true })).toBeVisible();
    await expect(page.locator('img[alt="유실된 콘텐츠"]')).toHaveCount(0);
    await shot(page, 'KIO-00-media-onerror-fallback');
  });

  test('fileUrl null(구 메타 전용 콘텐츠) — 기존 name 텍스트 폴백 비회귀', async ({ page }) => {
    await mockIdleList(page, {
      id: 'idle-null-1',
      name: '메타뿐인 콘텐츠',
      kind: '이미지',
      mode: null,
      play: null,
      fileUrl: null,
      sortOrder: 1,
    });

    await page.goto(`/kiosk/${EID}`);
    await expect(page.getByText('메타뿐인 콘텐츠', { exact: true })).toBeVisible();
    await expect(page.locator('img, video')).toHaveCount(0);
  });
});

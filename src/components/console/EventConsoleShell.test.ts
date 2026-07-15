import { describe, expect, it } from 'vitest';
import { isNavItemActive, NAV_ITEMS } from './EventConsoleShell';

/**
 * 렌더 없이 하단 탭바 활성 판정 로직만 단위 테스트한다(vitest.config.ts가 jsdom 없이 node
 * 환경만 제공 — SlotTitleTable.test.ts와 동일 전략). 슬래시 경계 없는 단순 startsWith가
 * 형제 경로를 잘못 활성으로 잡는 경계 오류를 이 순수 함수 레벨에서 방지한다.
 */
describe('EventConsoleShell — isNavItemActive (하단 탭바 활성 판정)', () => {
  it('정확히 일치하면 활성이다', () => {
    expect(isNavItemActive('/events/e1/parking', '/events/e1/parking')).toBe(true);
  });

  it('슬래시로 이어지는 하위 경로면 활성이다', () => {
    expect(isNavItemActive('/events/e1/parking/z1', '/events/e1/parking')).toBe(true);
  });

  it('접두만 같고 슬래시 경계가 없는 형제 경로는 비활성이다', () => {
    expect(isNavItemActive('/events/e1/parking2', '/events/e1/parking')).toBe(false);
  });

  it('전혀 다른 경로는 비활성이다', () => {
    expect(isNavItemActive('/events/e1/roster', '/events/e1/parking')).toBe(false);
  });

  it('pathname이 null이면 비활성이다', () => {
    expect(isNavItemActive(null, '/events/e1/parking')).toBe(false);
  });
});

/**
 * vitest.config.ts의 전역 NEXT_PUBLIC_BASE_PATH='/app' 환경에서 실행된다. 이 값
 * 아래에서도 NAV_ITEMS의 path 빌더가 basePath 없는 앱 좌표계를 반환해야 한다 — <Link href>가
 * Next.js 라우터를 거쳐 자동으로 basePath를 붙이고, usePathname()도 strip된 앱 좌표계를
 * 반환하므로 둘이 같은 좌표계로 비교돼야 활성 판정이 성립한다. 누군가 path에 ${BASE_PATH}를
 * 직접 붙이면(순수 함수 리터럴 테스트로는 못 잡는 결함) 이 테스트가 즉시 RED가 된다.
 */
describe('EventConsoleShell — NAV_ITEMS 좌표계 (basePath 이중 적용 회귀 가드)', () => {
  it('nav href는 basePath를 포함하지 않는다 — usePathname()이 strip한 값과 같은 좌표계여야 활성 판정이 성립한다', () => {
    expect(NAV_ITEMS.map((item) => item.path('e1'))).toEqual([
      '/events/e1/parking',
      '/events/e1/roster',
      '/events/e1/seats',
      '/events/e1/branding',
      '/events/e1/dashboard',
    ]);
  });
});

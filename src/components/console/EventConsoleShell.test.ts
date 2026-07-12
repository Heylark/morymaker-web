import { describe, expect, it } from 'vitest';
import { isNavItemActive } from './EventConsoleShell';

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

import { describe, expect, it } from 'vitest';
import {
  EVENT_NAV_ITEMS,
  EVENT_TABBAR_ITEMS,
  isNavItemActive,
  isServiceNavItemActive,
  SERVICE_NAV_ITEMS,
  serviceNavItemsFor,
} from './console-nav';

/**
 * `EventConsoleShell.test.ts`의 하단 탭바 활성 판정 테스트를 이 파일로 이전·확장한다
 * (`EventConsoleShell` 삭제 — `ConsoleShell`+`EventScopeGate`로 분해).
 */
describe('console-nav — isNavItemActive (Zone3·하단 탭바 활성 판정)', () => {
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
 * Zone2 활성 판정 — eid 존재 여부로 완전히 갈린다. `isNavItemActive`를 그대로 쓰면
 * `/events`가 Zone3 전 항목의 진접두라 상세 8화면에서 aria-current가 2개가 된다.
 */
describe('console-nav — isServiceNavItemActive (Zone2 전용 — eid 존재 시 항상 false)', () => {
  it('eid가 있으면 href가 정확히 일치해도 비활성이다', () => {
    expect(isServiceNavItemActive('/events/e1/roster', '/events', 'e1')).toBe(false);
  });

  it('eid가 없고 정확히 일치하면 활성이다', () => {
    expect(isServiceNavItemActive('/events', '/events', undefined)).toBe(true);
  });

  it('eid가 없고 하위 경로(/events/new)면 활성이다', () => {
    expect(isServiceNavItemActive('/events/new', '/events', undefined)).toBe(true);
  });

  it('eid가 없고 전혀 다른 경로면 비활성이다', () => {
    expect(isServiceNavItemActive('/accounts', '/events', undefined)).toBe(false);
  });

  it('pathname이 null이면 비활성이다', () => {
    expect(isServiceNavItemActive(null, '/events', undefined)).toBe(false);
  });
});

/**
 * NAV_ITEMS 좌표계 회귀 가드 — vitest.config.ts의 전역 NEXT_PUBLIC_BASE_PATH='/app' 환경에서도
 * path 빌더가 basePath 없는 앱 좌표계를 반환해야 한다(<Link href>가 자동 접두, usePathname()도
 * strip된 값을 반환하므로 둘이 같은 좌표계여야 활성 판정이 성립).
 */
describe('console-nav — EVENT_NAV_ITEMS·EVENT_TABBAR_ITEMS 좌표계 (basePath 이중 적용 회귀 가드)', () => {
  it('EVENT_NAV_ITEMS는 핸드오프 §2 순서(행사 정보·명단·좌석·주차·브랜딩·통계)로 앱 좌표계 경로를 반환한다', () => {
    expect(EVENT_NAV_ITEMS.map((item) => item.path('e1'))).toEqual([
      '/events/e1/edit',
      '/events/e1/roster',
      '/events/e1/seats',
      '/events/e1/parking',
      '/events/e1/branding',
      '/events/e1/dashboard',
    ]);
  });

  it('EVENT_TABBAR_ITEMS는 기존 순서(주차·명단·좌석·브랜딩·통계)를 유지하고 행사 정보(edit)를 제외한다', () => {
    expect(EVENT_TABBAR_ITEMS.map((item) => item.key)).toEqual(['parking', 'guests', 'seats', 'branding', 'stats']);
  });

  it('두 배열은 같은 항목 객체를 참조한다(라벨·경로 drift 방지)', () => {
    const guestsInNav = EVENT_NAV_ITEMS.find((item) => item.key === 'guests');
    const guestsInTabbar = EVENT_TABBAR_ITEMS.find((item) => item.key === 'guests');
    expect(guestsInNav).toBe(guestsInTabbar);
  });
});

/**
 * V5-b — serviceNavItemsFor 5조합 + 로딩. 역할별 기대 항목 라벨 집합까지 명시한다(개수 단언만으로는
 * 항목 뒤바뀜 회귀를 못 잡는다). SYSTEM_ADMIN 2항목 확정은 scan 배정 단일성 조건 반영.
 */
describe('console-nav — serviceNavItemsFor (V5 정정: 3/2/1 + V5-b 5조합)', () => {
  it('SYSTEM_ADMIN(eventIds=null)은 행사 목록·계정 관리 2항목만 렌더한다(scan은 배정 1건 조건 미충족)', () => {
    const items = serviceNavItemsFor(['SYSTEM_ADMIN'], null);
    expect(items.map((item) => item.label)).toEqual(['행사 목록', '계정 관리']);
  });

  it('EVENT_ADMIN + 배정 1건은 행사 목록·체크인 스캔 2항목을 렌더한다(계정 관리 제외)', () => {
    const items = serviceNavItemsFor(['EVENT_ADMIN'], ['e1']);
    expect(items.map((item) => item.label)).toEqual(['행사 목록', '체크인 스캔']);
  });

  it('EVENT_STAFF + 배정 1건은 체크인 스캔 1항목만 렌더한다', () => {
    const items = serviceNavItemsFor(['EVENT_STAFF'], ['e1']);
    expect(items.map((item) => item.label)).toEqual(['체크인 스캔']);
  });

  it('EVENT_STAFF + 배정 0건은 빈 배열이다(죽은 링크 0)', () => {
    expect(serviceNavItemsFor(['EVENT_STAFF'], [])).toEqual([]);
  });

  it('EVENT_ADMIN + 배정 2건 이상은 체크인 스캔을 제외한다(막다른 화면 진입 차단)', () => {
    const items = serviceNavItemsFor(['EVENT_ADMIN'], ['e1', 'e2']);
    expect(items.map((item) => item.key)).not.toContain('scan');
  });

  it('eventIds가 undefined(로딩 중)이면 scan을 렌더하지 않는다(과소 노출이 안전 방향)', () => {
    const items = serviceNavItemsFor(['EVENT_STAFF'], undefined);
    expect(items.map((item) => item.key)).not.toContain('scan');
  });

  it('roles가 null이면 빈 배열이다', () => {
    expect(serviceNavItemsFor(null, ['e1'])).toEqual([]);
  });
});

describe('console-nav — SERVICE_NAV_ITEMS', () => {
  it('3항목(행사 목록·계정 관리·체크인 스캔)을 정의한다', () => {
    expect(SERVICE_NAV_ITEMS.map((item) => item.key)).toEqual(['events', 'accounts', 'scan']);
  });
});

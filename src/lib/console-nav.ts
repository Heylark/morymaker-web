import { ADMIN_ROLES, hasAnyRole, STAFF_ROLES, SYSTEM_ADMIN_ROLES } from './roles';

/**
 * 서비스 그룹 SSOT — 사이드바 Zone2와 랜딩 이동 카드가 같은 배열을 소비한다(정의 이원화 금지).
 * href는 앱 좌표계(basePath 없음) — <Link href>가 자동으로 basePath를 붙이고 usePathname()도
 * strip된 값을 반환하므로, 여기 문자열에 BASE_PATH가 섞이면 활성 판정이 영구 불일치한다.
 */
export interface ServiceNavItem {
  key: 'events' | 'accounts' | 'scan';
  label: string;
  href: string;
  roles: readonly string[];
  description: string;
}

export const SERVICE_NAV_ITEMS: readonly ServiceNavItem[] = [
  {
    key: 'events',
    label: '행사 목록',
    href: '/events',
    roles: ADMIN_ROLES,
    description: '등록된 행사를 확인하고 새 행사를 만듭니다.',
  },
  {
    key: 'accounts',
    label: '계정 관리',
    href: '/accounts',
    roles: SYSTEM_ADMIN_ROLES,
    description: '운영진 계정과 권한을 관리합니다.',
  },
  {
    key: 'scan',
    label: '체크인 스캔',
    href: '/staff/scan',
    roles: STAFF_ROLES,
    description: '현장에서 QR을 스캔해 참석을 확인합니다.',
  },
];

/**
 * 사용자 역할 + 행사 배정 상태로 필터. roles가 null/빈 배열이면 빈 배열(죽은 링크 0).
 *
 * `scan` 항목은 역할만으로 판정하지 않는다 — `/staff/scan`은 `StaffEventProvider` 아래에 있고,
 * 그 Provider는 eventIds가 null(SYSTEM_ADMIN)이거나 2건 이상이면 children을 렌더하지 않고
 * 자체 안내 화면으로 대체한다(셸이 통째로 사라지는 막다른 화면). 따라서 `scan`은 정확히 1건
 * 배정일 때만 렌더한다.
 *
 * @param eventIds `/api/auth/me`의 `user.eventIds` 3-값 의미론 그대로:
 *                 null = 클레임 부재(SYSTEM_ADMIN 전체 허용) / [] = 배정 0건 / string[] = 배정 목록.
 *                 (`undefined`는 "아직 로딩 중" — scan을 렌더하지 않는다. 과소 노출이 안전 방향.)
 */
export function serviceNavItemsFor(
  userRoles: readonly string[] | null,
  eventIds: readonly string[] | null | undefined,
): ServiceNavItem[] {
  const roles = userRoles ?? [];
  return SERVICE_NAV_ITEMS.filter((item) => {
    if (!hasAnyRole(roles, item.roles)) return false;
    if (item.key === 'scan') {
      return Array.isArray(eventIds) && eventIds.length === 1;
    }
    return true;
  });
}

export interface EventNavItem {
  key: string;
  label: string;
  path: (eid: string) => string;
  implemented: boolean;
}

const EDIT_ITEM: EventNavItem = { key: 'edit', label: '행사 정보', path: (eid) => `/events/${eid}/edit`, implemented: true };
const GUESTS_ITEM: EventNavItem = { key: 'guests', label: '명단', path: (eid) => `/events/${eid}/roster`, implemented: true };
const SEATS_ITEM: EventNavItem = { key: 'seats', label: '좌석', path: (eid) => `/events/${eid}/seats`, implemented: true };
const PARKING_ITEM: EventNavItem = { key: 'parking', label: '주차', path: (eid) => `/events/${eid}/parking`, implemented: true };
const BRANDING_ITEM: EventNavItem = {
  key: 'branding',
  label: '브랜딩',
  path: (eid) => `/events/${eid}/branding`,
  implemented: true,
};
const STATS_ITEM: EventNavItem = { key: 'stats', label: '통계', path: (eid) => `/events/${eid}/dashboard`, implemented: true };

/** Zone3 사이드바 6항목 — 핸드오프 §2 순서: 행사 정보·명단·좌석·주차·브랜딩·통계 */
export const EVENT_NAV_ITEMS: readonly EventNavItem[] = [
  EDIT_ITEM,
  GUESTS_ITEM,
  SEATS_ITEM,
  PARKING_ITEM,
  BRANDING_ITEM,
  STATS_ITEM,
];

/**
 * 모바일 하단 탭바 5항목 — 기존 NAV_ITEMS와 동일 집합·동일 순서(핸드오프 §4 "변경 없음").
 * EVENT_NAV_ITEMS와 같은 항목 객체를 참조해 라벨·경로 drift를 원천 차단한다.
 */
export const EVENT_TABBAR_ITEMS: readonly EventNavItem[] = [
  PARKING_ITEM,
  GUESTS_ITEM,
  SEATS_ITEM,
  BRANDING_ITEM,
  STATS_ITEM,
];

/**
 * 정확 일치 또는 `href + '/'` 접두. 기존 isNavItemActive 로직·시그니처 그대로 이전. **Zone3 전용**
 * (하단 탭바도 동일 로직을 공유한다 — 기존 EventConsoleShell의 판정과 동형).
 */
export function isNavItemActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Zone2(서비스 그룹) 전용 활성 판정.
 * 행사 컨텍스트(eid 존재) 안에서는 **항상 false** — 그 화면의 활성 주체는 Zone3다.
 * eid가 없을 때만 접두 판정을 적용한다(`/events/new` → '행사 목록' 활성은 유지).
 *
 * `isNavItemActive`를 Zone2에 그대로 쓰지 않는 이유: `isNavItemActive`는 형제 항목이 서로
 * 접두 관계가 아닌 하단 탭바 전용으로 도입된 규칙이다. Zone2의 `/events`는 Zone3 전 항목
 * (`/events/{eid}/…`)의 진접두라, 그대로 적용하면 상세 8화면 전부에서 Zone2 '행사 목록'과
 * Zone3 항목이 동시에 활성이 되어 한 문서에 `aria-current="page"`가 2개가 된다.
 */
export function isServiceNavItemActive(pathname: string | null, href: string, eid: string | undefined): boolean {
  if (!pathname) return false;
  if (eid) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

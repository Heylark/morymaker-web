/**
 * 실행자 웹(HLP·PRK·SCN) 게이트가 허용하는 역할 — SSOT.
 * (console)의 ADMIN_ROLES와 별개 목록이다.
 */
export const STAFF_ROLES = ['SYSTEM_ADMIN', 'EVENT_ADMIN', 'EVENT_STAFF'] as const;

/**
 * 관리자 콘솔((console)) 게이트가 허용하는 역할 — SSOT.
 * 이전에는 `(console)/layout.tsx`와 `useRequireAdmin`이 각자 로컬 상수로 중복 선언했다 —
 * 두 곳 모두 이 값을 가져다 쓰도록 통일한다(값·순서 동일, 동작 보존).
 */
export const ADMIN_ROLES = ['SYSTEM_ADMIN', 'EVENT_ADMIN'] as const;

/**
 * 계정 관리(`/accounts`, ADM-11) 게이트가 허용하는 역할 — SSOT. ADMIN_ROLES와 달리 EVENT_ADMIN을
 * 배제한다 — auth `/api/accounts`가 hasRole(SYSTEM_ADMIN) 단일 게이트라(AdminApiSecurityConfig),
 * 이 목록이 EVENT_ADMIN을 허용하면 web은 통과시키고 auth만 403을 내는 UX 불일치가 생긴다.
 */
export const SYSTEM_ADMIN_ROLES = ['SYSTEM_ADMIN'] as const;

/**
 * 게이트 실패 시 "미인증"과 "인증됐으나 role 불충족"을 구분하지 않고 둘 다 로그인으로 보내면,
 * 이미 로그인한 사용자가 재인증 후 같은 role로 되돌아와 다시 차단되는 무한 리다이렉트가
 * 생긴다(로그인 경로가 브라우저의 기존 세션을 그대로 인정해 로그인 폼 없이 즉시 재통과시키기
 * 때문). 인증+불충족은 재인증으로 해결되지 않으므로 이 게이트 없는 종결 경로로 보낸다.
 *
 * 게이트 그룹((console)/(staff)/(kiosk)/(visitor)) 밖에 위치한 경로여야 한다 — 게이트가 걸린
 * 경로를 폴백으로 쓰면 그 게이트의 불충족 대상이 다시 여기로 튕겨 새 무한 루프가 생긴다.
 */
export const FORBIDDEN_PATH = '/forbidden';

/** 사용자 role 목록 중 하나라도 필요 role 목록에 포함되면 true. 순서·중복은 판정에 영향 없음. */
export function hasAnyRole(userRoles: readonly string[], requiredRoles: readonly string[]): boolean {
  return userRoles.some((role) => requiredRoles.includes(role));
}

export type GateOutcome = 'AUTHORIZED' | 'UNAUTHENTICATED' | 'FORBIDDEN';

/**
 * 게이트 판정(순수 함수) — 서버(`assertRoleOrRedirect`)·클라(`useRequireRole`) 양쪽이 이 함수
 * 하나로 미인증/인증+불충족/통과 세 갈래를 판정한다. 두 소비자가 각자 분기를 중복 구현하면
 * 판정 기준이 갈라질(drift) 위험이 있어 하나로 모았다 — 클라 훅은 렌더링 없이 이 함수만으로
 * 분기 로직을 유닛 테스트할 수 있다(훅 자체는 fetch+useEffect라 렌더 없이 직접 검증 불가).
 */
export function resolveGateOutcome(
  userRoles: readonly string[] | null,
  allowedRoles: readonly string[],
): GateOutcome {
  if (userRoles === null) return 'UNAUTHENTICATED';
  return hasAnyRole(userRoles, allowedRoles) ? 'AUTHORIZED' : 'FORBIDDEN';
}

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

/** 사용자 role 목록 중 하나라도 필요 role 목록에 포함되면 true. 순서·중복은 판정에 영향 없음. */
export function hasAnyRole(userRoles: readonly string[], requiredRoles: readonly string[]): boolean {
  return userRoles.some((role) => requiredRoles.includes(role));
}

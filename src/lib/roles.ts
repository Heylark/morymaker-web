/**
 * 실행자 웹(HLP·PRK·SCN) 게이트가 허용하는 역할 — SSOT.
 * (console)의 ADMIN_ROLES와 별개 목록이다 — console은 이번 REQ에서 손대지 않는다(동작 보존).
 */
export const STAFF_ROLES = ['SYSTEM_ADMIN', 'EVENT_ADMIN', 'EVENT_STAFF'] as const;

/** 사용자 role 목록 중 하나라도 필요 role 목록에 포함되면 true. 순서·중복은 판정에 영향 없음. */
export function hasAnyRole(userRoles: readonly string[], requiredRoles: readonly string[]): boolean {
  return userRoles.some((role) => requiredRoles.includes(role));
}

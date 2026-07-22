import { accountRoleLabel } from './account-constants';
import type { AccountRole } from '@/types/account';

const ROLE_PRIORITY: readonly AccountRole[] = ['SYSTEM_ADMIN', 'EVENT_ADMIN', 'EVENT_STAFF'];

/** 표시명 — 이메일 전체를 그대로 반환(CP-1 Q2=A). 공백·빈 문자열이면 '로그인 계정'. */
export function displayNameOf(username: string | null | undefined): string {
  if (!username || username.trim() === '') return '로그인 계정';
  return username;
}

/** 아바타 이니셜 — 로컬파트 첫 글자 대문자. 도출 불가면 '·'. (예: dev-verify@… → 'D') */
export function initialOf(username: string | null | undefined): string {
  if (!username || username.trim() === '') return '·';
  const localPart = username.split('@')[0];
  if (!localPart) return '·';
  return localPart.charAt(0).toUpperCase();
}

/**
 * 역할 라벨 — 최상위 1개만. SYSTEM_ADMIN > EVENT_ADMIN > EVENT_STAFF. 라벨 문자열은 신규
 * 정의하지 않는다 — `lib/account-constants.ts`의 `accountRoleLabel()`을 그대로 호출한다.
 */
export function roleLabelOf(roles: readonly string[] | null | undefined): string {
  if (!roles || roles.length === 0) return '권한 없음';
  const topRole = ROLE_PRIORITY.find((role) => roles.includes(role));
  return topRole ? accountRoleLabel(topRole) : '권한 없음';
}

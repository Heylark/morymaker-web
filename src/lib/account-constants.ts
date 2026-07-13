import type { PillTone } from './console-constants';
import type { AccountRole } from '@/types/account';

/**
 * 계정·권한(ADM-11) 도메인 상수 — role 3종 한국어 라벨(스펙 §1-2 접근권한 범례 그대로:
 * SYSTEM_ADMIN=시스템 관리자 / EVENT_ADMIN=행사 관리자 / EVENT_STAFF=행사 실행자) + eventIds
 * 필수 여부(auth AccountAdminService.validateRoleAndEvents 미러) + 상태 톤 매핑을 순수 함수로
 * 분리해 렌더 없이 단위 테스트 가능하게 한다(vitest가 jsdom 없이 node 환경만 제공).
 */

export const ACCOUNT_ROLE_OPTIONS: AccountRole[] = ['SYSTEM_ADMIN', 'EVENT_ADMIN', 'EVENT_STAFF'];

export function accountRoleLabel(role: AccountRole): string {
  switch (role) {
    case 'SYSTEM_ADMIN':
      return '시스템 관리자';
    case 'EVENT_ADMIN':
      return '행사 관리자';
    case 'EVENT_STAFF':
      return '행사 실행자';
  }
}

/** SYSTEM_ADMIN은 eventIds가 무의미(서버 무시) / 그 외 역할은 ≥1 필수(else 서버 422) — 폼이 서버 검증을 미러한다. */
export function isEventIdsRequired(role: AccountRole): boolean {
  return role !== 'SYSTEM_ADMIN';
}

/** 계정 상태 → StatePill 톤. 활성=done, 비활성=void(저강조 — 새 색조 도입 없음). */
export function accountStatusTone(status: string): PillTone {
  return status === '활성' ? 'done' : 'void';
}

import { describe, expect, it } from 'vitest';
import { ACCOUNT_ROLE_OPTIONS, accountRoleLabel, accountStatusTone, isEventIdsRequired } from './account-constants';

describe('account-constants — accountRoleLabel (역할 → 한국어 라벨)', () => {
  it('3역할 모두 스펙 §1-2 접근권한 범례와 동일한 한국어 라벨을 반환한다', () => {
    expect(accountRoleLabel('SYSTEM_ADMIN')).toBe('시스템 관리자');
    expect(accountRoleLabel('EVENT_ADMIN')).toBe('행사 관리자');
    expect(accountRoleLabel('EVENT_STAFF')).toBe('행사 실행자');
  });
});

describe('account-constants — isEventIdsRequired (auth AccountAdminService.validateRoleAndEvents 미러)', () => {
  it('SYSTEM_ADMIN은 eventIds가 필요 없다(서버가 무시)', () => {
    expect(isEventIdsRequired('SYSTEM_ADMIN')).toBe(false);
  });

  it('EVENT_ADMIN·EVENT_STAFF는 eventIds가 필요하다(미충족 시 서버 422)', () => {
    expect(isEventIdsRequired('EVENT_ADMIN')).toBe(true);
    expect(isEventIdsRequired('EVENT_STAFF')).toBe(true);
  });
});

describe('account-constants — accountStatusTone (상태 → StatePill 톤)', () => {
  it('활성은 done, 비활성은 void 톤을 반환한다', () => {
    expect(accountStatusTone('활성')).toBe('done');
    expect(accountStatusTone('비활성')).toBe('void');
  });
});

describe('account-constants — ACCOUNT_ROLE_OPTIONS', () => {
  it('auth MoryRoles 3역할을 동일 순서로 노출한다', () => {
    expect(ACCOUNT_ROLE_OPTIONS).toEqual(['SYSTEM_ADMIN', 'EVENT_ADMIN', 'EVENT_STAFF']);
  });
});

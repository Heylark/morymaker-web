import { describe, expect, it } from 'vitest';
import { ADMIN_ROLES, hasAnyRole, STAFF_ROLES, SYSTEM_ADMIN_ROLES } from './roles';

describe('hasAnyRole — STAFF_ROLES 포함/미포함 역할 판정', () => {
  it('EVENT_STAFF만 가진 사용자는 STAFF_ROLES 게이트를 통과한다', () => {
    expect(hasAnyRole(['EVENT_STAFF'], STAFF_ROLES)).toBe(true);
  });

  it('SYSTEM_ADMIN·EVENT_ADMIN도 STAFF_ROLES 게이트를 통과한다(상위 role 겸용)', () => {
    expect(hasAnyRole(['SYSTEM_ADMIN'], STAFF_ROLES)).toBe(true);
    expect(hasAnyRole(['EVENT_ADMIN'], STAFF_ROLES)).toBe(true);
  });

  it('STAFF_ROLES에 없는 역할만 가진 사용자는 차단된다', () => {
    expect(hasAnyRole(['GUEST'], STAFF_ROLES)).toBe(false);
  });

  it('역할이 아예 없으면 차단된다', () => {
    expect(hasAnyRole([], STAFF_ROLES)).toBe(false);
  });

  it('여러 역할 중 하나만 겹쳐도 통과한다', () => {
    expect(hasAnyRole(['GUEST', 'EVENT_STAFF'], STAFF_ROLES)).toBe(true);
  });
});

describe('hasAnyRole — ADMIN_ROLES 포함/미포함 역할 판정 (콘솔 게이트 SSOT)', () => {
  it('SYSTEM_ADMIN·EVENT_ADMIN은 ADMIN_ROLES 게이트를 통과한다', () => {
    expect(hasAnyRole(['SYSTEM_ADMIN'], ADMIN_ROLES)).toBe(true);
    expect(hasAnyRole(['EVENT_ADMIN'], ADMIN_ROLES)).toBe(true);
  });

  it('EVENT_STAFF만 가진 사용자는 ADMIN_ROLES 게이트를 통과하지 못한다(실행자와 관리자 분리)', () => {
    expect(hasAnyRole(['EVENT_STAFF'], ADMIN_ROLES)).toBe(false);
  });

  it('역할이 아예 없으면 차단된다', () => {
    expect(hasAnyRole([], ADMIN_ROLES)).toBe(false);
  });
});

describe('hasAnyRole — SYSTEM_ADMIN_ROLES 포함/미포함 역할 판정 (계정 관리 게이트 SSOT)', () => {
  it('SYSTEM_ADMIN은 SYSTEM_ADMIN_ROLES 게이트를 통과한다', () => {
    expect(hasAnyRole(['SYSTEM_ADMIN'], SYSTEM_ADMIN_ROLES)).toBe(true);
  });

  it('EVENT_ADMIN은 ADMIN_ROLES는 통과해도 SYSTEM_ADMIN_ROLES는 통과하지 못한다(과허용 방지가 목적)', () => {
    expect(hasAnyRole(['EVENT_ADMIN'], ADMIN_ROLES)).toBe(true);
    expect(hasAnyRole(['EVENT_ADMIN'], SYSTEM_ADMIN_ROLES)).toBe(false);
  });

  it('EVENT_STAFF는 SYSTEM_ADMIN_ROLES 게이트를 통과하지 못한다', () => {
    expect(hasAnyRole(['EVENT_STAFF'], SYSTEM_ADMIN_ROLES)).toBe(false);
  });

  it('역할이 아예 없으면 차단된다', () => {
    expect(hasAnyRole([], SYSTEM_ADMIN_ROLES)).toBe(false);
  });
});

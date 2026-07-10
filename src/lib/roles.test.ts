import { describe, expect, it } from 'vitest';
import { hasAnyRole, STAFF_ROLES } from './roles';

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
